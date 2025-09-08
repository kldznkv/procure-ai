import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isAdminClientConfigured } from '../../../../lib/supabase-admin';
import { handleDatabaseConstraintError, getDefaultDocumentStatus, validateDocumentData } from '../../../../lib/database-constraints';
import { findOrCreateSupplier, extractSupplierDataFromDocument } from '../../../../lib/supplier-manager';
import { aiCache } from '../../../../lib/ai-cache';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Enhanced procurement extraction prompt
const PROCUREMENT_EXTRACTION_PROMPT = `You are an expert procurement document analyzer. Extract structured data from the following document with high accuracy.

**CRITICAL: You must respond with ONLY valid JSON. No explanations, no additional text, just the JSON object.**

**REQUIRED OUTPUT FORMAT (JSON only):**
{
  "supplier_name": "string or null",
  "amount": "number or null", 
  "currency": "string (default: USD)",
  "issue_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "document_number": "string or null",
  "payment_terms": "string or null",
  "line_items": [
    {
      "description": "string",
      "quantity": "number",
      "unit_price": "number",
      "total": "number"
    }
  ],
  "confidence_score": "number (0-1)"
}

**IMPORTANT RULES:**
1. ONLY return valid JSON - no other text, no explanations
2. Use null for missing values, not empty strings
3. Dates must be in YYYY-MM-DD format
4. Amounts should be numeric values only (remove $ and commas)
5. If you can't determine a value, use null
6. DO NOT generate fake data - only extract what's actually in the document
7. Confidence score should reflect your certainty (0.0 = uncertain, 1.0 = very certain)
8. Start your response with { and end with } - nothing else
9. DO NOT include any markdown formatting, backticks, or code blocks
10. Your response must be parseable by JSON.parse()

**Document Content:**
`;

export async function POST(request: NextRequest) {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase admin client not configured' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { document_id, document_text, document_type, user_id } = body;

    if (!document_id || !document_text) {
      return NextResponse.json({ 
        success: false, 
        error: 'document_id and document_text are required' 
      }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id is required for supplier management' 
      }, { status: 400 });
    }

    console.log('🔍 AI Processing - Starting analysis for document:', document_id);
    console.log('📄 Document Type:', document_type);
    console.log('📄 Text Length:', document_text.length);
    console.log('📄 Text Preview (first 500 chars):', document_text.substring(0, 500));
    console.log('📄 Text Preview (last 500 chars):', document_text.substring(Math.max(0, document_text.length - 500)));
    
    // CRITICAL DEBUG: Check if this is a real document vs test
    const isRealDocument = !document_id.startsWith('test');
    console.log('🔍 DEBUG - Is Real Document:', isRealDocument);
    console.log('🔍 DEBUG - Document ID Pattern:', document_id);
    
    // CRITICAL DEBUG: Check for empty or placeholder text
    const isEmptyText = document_text.trim().length === 0;
    console.log('🔍 DEBUG - Is Empty Text:', isEmptyText);
    console.log('🔍 DEBUG - Text Length:', document_text.length);
    console.log('🔍 DEBUG - Text Preview (first 1000 chars):', document_text.substring(0, 1000));
    console.log('🔍 DEBUG - Text Preview (last 500 chars):', document_text.substring(Math.max(0, document_text.length - 500)));
    console.log('🔍 DEBUG - Full Text Content:', document_text);
    
    // CRITICAL DEBUG: Check for financial data patterns
    const hasAmounts = /\$[\d,]+\.?\d*|\€[\d,]+\.?\d*|[\d,]+\.?\d*\s*(USD|EUR|GBP)/i.test(document_text);
    const hasDates = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2}/.test(document_text);
    const hasSupplier = /(?:bill to|from|supplier|vendor|company|inc|ltd|corp)/i.test(document_text);
    console.log('🔍 DEBUG - Financial Data Check:', { hasAmounts, hasDates, hasSupplier });

    // Check for placeholder text
    const isPlaceholderText = document_text.includes('This is a placeholder for PDF text extraction') || 
                             document_text.includes('PDF Content:') ||
                             document_text.includes('File Content:');

    if (isPlaceholderText) {
      console.error('❌ AI Processing - PLACEHOLDER TEXT DETECTED! PDF extraction is not working.');
      return NextResponse.json({ 
        success: false, 
        error: 'PLACEHOLDER_TEXT_DETECTED',
        message: 'The document contains placeholder text instead of actual PDF content. PDF text extraction is not working.',
        debug_info: {
          text_preview: document_text.substring(0, 200),
          is_placeholder: true,
          text_length: document_text.length
        }
      }, { status: 400 });
    }

    // Check if text is empty or too short
    if (document_text.trim().length < 10) {
      console.error('❌ AI Processing - TEXT TOO SHORT! Extracted text is too short to process.');
      return NextResponse.json({ 
        success: false, 
        error: 'TEXT_TOO_SHORT',
        message: 'The extracted text is too short to process. PDF text extraction may have failed.',
        debug_info: {
          text_preview: document_text,
          text_length: document_text.length
        }
      }, { status: 400 });
    }

    try {
      // Create the full prompt
      const fullPrompt = `${PROCUREMENT_EXTRACTION_PROMPT}\n\nDocument Type: ${document_type}\n\n${document_text}`;
      console.log('🤖 AI Processing - Prompt length:', fullPrompt.length);
      console.log('🤖 AI Processing - Prompt preview (first 1000 chars):', fullPrompt.substring(0, 1000));
      
      // CRITICAL DEBUG: Log the exact prompt being sent to Claude
      console.log('🔍 DEBUG - FULL PROMPT SENT TO CLAUDE:');
      console.log('='.repeat(80));
      console.log(fullPrompt);
      console.log('='.repeat(80));

      // Check cache first
      const cacheRequest = {
        document_text: document_text,
        document_type: document_type,
        prompt_template: PROCUREMENT_EXTRACTION_PROMPT
      };

      console.log('🔍 Cache - Checking for cached response...');
      const cachedResponse = await aiCache.getCachedResponse(cacheRequest);
      
      let extractedData;
      let processingTime = 0;
      let fromCache = false;

      if (cachedResponse) {
        console.log('🎯 Cache HIT - Using cached AI response');
        extractedData = cachedResponse.extracted_data;
        processingTime = cachedResponse.processing_time;
        fromCache = true;
      } else {
        console.log('❌ Cache MISS - Calling Claude API...');
        const startTime = Date.now();
      
        const message = await claude.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 2000,
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        });

        processingTime = Date.now() - startTime;
        console.log('✅ AI Processing - Claude API response received in', processingTime, 'ms');

        const aiResponse = message.content[0];
        if (aiResponse.type !== 'text') {
          throw new Error('Unexpected response type from Claude API');
        }

        // CRITICAL DEBUG: Log the raw AI response from Claude
        console.log('🔍 DEBUG - RAW CLAUDE RESPONSE:');
        console.log('='.repeat(80));
        console.log(aiResponse.text);
        console.log('='.repeat(80));
        console.log('🔍 DEBUG - Response length:', aiResponse.text.length);
        console.log('🔍 DEBUG - Response type:', typeof aiResponse.text);

        // Parse the AI response
        try {
          extractedData = JSON.parse(aiResponse.text);
          
          // Cache the response for future use
          console.log('💾 Caching AI response...');
          await aiCache.cacheResponse(cacheRequest, extractedData, processingTime);
          
        } catch (parseError) {
          console.error('❌ AI Processing - JSON parse error:', parseError);
          console.error('Raw AI response:', aiResponse.text);
          throw new Error('Failed to parse AI response');
        }
      }

      console.log('✅ AI Processing - Successfully parsed response:', extractedData);

      // Handle supplier creation/lookup if supplier name is extracted
      let supplierId = null;
      let supplierInfo = null;

      // CRITICAL DEBUG: Log extracted data for supplier processing
      console.log('🔍 DEBUG - EXTRACTED DATA FOR SUPPLIER PROCESSING:');
      console.log('='.repeat(80));
      console.log(JSON.stringify(extractedData, null, 2));
      console.log('='.repeat(80));
      console.log('🔍 DEBUG - Supplier name extracted:', extractedData.supplier_name);
      console.log('🔍 DEBUG - Is test document:', document_id.startsWith('test'));
      console.log('🔍 DEBUG - Will process supplier:', extractedData.supplier_name && !document_id.startsWith('test'));

      if (extractedData.supplier_name && !document_id.startsWith('test')) {
        try {
          console.log('🏢 AI Processing - Processing supplier:', extractedData.supplier_name);
          
          // Extract supplier data from document
          const supplierData = extractSupplierDataFromDocument(extractedData);
          console.log('🔍 DEBUG - Supplier data extracted:', JSON.stringify(supplierData, null, 2));
          
          // Find or create supplier
          const supplierResult = await findOrCreateSupplier(user_id, extractedData.supplier_name, supplierData);
          console.log('🔍 DEBUG - Supplier result:', JSON.stringify(supplierResult, null, 2));
          
          if (supplierResult.supplier) {
            supplierId = supplierResult.supplier.id;
            supplierInfo = {
              id: supplierResult.supplier.id,
              name: supplierResult.supplier.name,
              created: supplierResult.created,
              message: supplierResult.message
            };
            
            console.log('✅ AI Processing - Supplier processed:', supplierInfo);
          } else {
            console.log('⚠️ AI Processing - No supplier created:', supplierResult.message);
          }
        } catch (supplierError) {
          console.error('❌ AI Processing - Supplier processing error:', supplierError);
          // Don't fail the entire process if supplier creation fails
          console.log('⚠️ AI Processing - Continuing without supplier creation');
        }
      }

      // For test document IDs, just return the extracted data without updating database
      if (document_id.startsWith('test')) {
        console.log('🧪 AI Processing - Test document ID detected, skipping database update');
        return NextResponse.json({ 
          success: true, 
          data: extractedData,
          supplier_info: supplierInfo,
          message: 'Document processed successfully (test mode)'
        });
      }

      // Validate data before database update
      const validation = validateDocumentData({
        status: getDefaultDocumentStatus(),
        document_type: document_type
      });

      if (!validation.isValid) {
        console.error('❌ AI Processing - Data validation failed:', validation.errors);
        return NextResponse.json({ 
          success: false, 
          error: `Data validation failed: ${validation.errors.join(', ')}` 
        }, { status: 400 });
      }

      // Update the document with extracted data
      const { error: updateError } = await (supabaseAdmin as any)
        .from('procurement_documents')
        .update({
          extracted_text: document_text,
          extracted_data: extractedData,
          ai_analysis: {
            processed_at: new Date().toISOString(),
            model: 'claude-3-haiku-20240307',
            confidence_score: extractedData.confidence_score || 0.5,
            extraction_summary: `Successfully extracted ${Object.keys(extractedData).filter(k => extractedData[k] !== null).length} data points`,
            supplier_info: supplierInfo
          },
          processed: true,
          supplier_id: supplierId, // Link to supplier if created/found
          supplier_name: extractedData.supplier_name,
          amount: extractedData.amount,
          currency: extractedData.currency || 'USD',
          issue_date: extractedData.issue_date,
          due_date: extractedData.due_date,
          status: getDefaultDocumentStatus() // Use validated status value
        })
        .eq('id', document_id);

      if (updateError) {
        console.error('❌ AI Processing - Database update error:', updateError);
        throw handleDatabaseConstraintError(updateError);
      }

      console.log('✅ AI Processing - Document updated successfully');
      
      // Get cache statistics
      const cacheStats = aiCache.getStats();
      
      return NextResponse.json({ 
        success: true, 
        data: extractedData,
        supplier_info: supplierInfo,
        cache_info: {
          from_cache: fromCache,
          processing_time_ms: processingTime,
          cache_hit_rate: cacheStats.hitRate,
          time_saved_ms: fromCache ? cacheStats.time_saved : 0
        },
        message: 'Document processed successfully'
      });

    } catch (aiError) {
      console.error('❌ AI Processing - Claude API error:', aiError);
      
      // For test document IDs, don't update database on error
      if (!document_id.startsWith('test')) {
        await (supabaseAdmin as any)
          .from('procurement_documents')
          .update({
            extracted_text: document_text,
            processing_error: aiError instanceof Error ? aiError.message : 'AI processing failed',
            status: getDefaultDocumentStatus() // Keep as pending when processing fails, use processing_error field for details
          })
          .eq('id', document_id);
      }

      throw new Error(`AI processing failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ AI Processing - Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
