import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isAdminClientConfigured } from '../../../../lib/supabase-admin';
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
    const { document_id, document_text, document_type } = body;

    if (!document_id || !document_text) {
      return NextResponse.json({ 
        success: false, 
        error: 'document_id and document_text are required' 
      }, { status: 400 });
    }

    console.log('🔍 AI Processing - Starting analysis for document:', document_id);

    try {
      // Call Claude API for document analysis
      const message = await claude.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: `${PROCUREMENT_EXTRACTION_PROMPT}\n\nDocument Type: ${document_type}\n\n${document_text}`
          }
        ]
      });

      const aiResponse = message.content[0];
      if (aiResponse.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      // Debug: Log the raw AI response
      console.log('🔍 AI Processing - Raw AI response:', aiResponse.text);

      // Parse the AI response
      let extractedData;
      try {
        extractedData = JSON.parse(aiResponse.text);
        console.log('✅ AI Processing - Successfully parsed response:', extractedData);
      } catch (parseError) {
        console.error('❌ AI Processing - JSON parse error:', parseError);
        console.error('Raw AI response:', aiResponse.text);
        throw new Error('Failed to parse AI response');
      }

      // For test document IDs, just return the extracted data without updating database
      if (document_id.startsWith('test')) {
        console.log('🧪 AI Processing - Test document ID detected, skipping database update');
        return NextResponse.json({ 
          success: true, 
          data: extractedData,
          message: 'Document processed successfully (test mode)'
        });
      }

      // Update the document with extracted data
      const { error: updateError } = await supabaseAdmin!
        .from('procurement_documents')
        .update({
          extracted_text: document_text,
          extracted_data: extractedData,
          ai_analysis: {
            processed_at: new Date().toISOString(),
            model: 'claude-sonnet-4-20250514',
            confidence_score: extractedData.confidence_score || 0.5,
            extraction_summary: `Successfully extracted ${Object.keys(extractedData).filter(k => extractedData[k] !== null).length} data points`
          },
          processed: true,
          supplier_name: extractedData.supplier_name,
          amount: extractedData.amount,
          currency: extractedData.currency || 'USD',
          issue_date: extractedData.issue_date,
          due_date: extractedData.due_date,
          status: 'processed'
        })
        .eq('id', document_id);

      if (updateError) {
        console.error('❌ AI Processing - Database update error:', updateError);
        throw updateError;
      }

      console.log('✅ AI Processing - Document updated successfully');
      return NextResponse.json({ 
        success: true, 
        data: extractedData,
        message: 'Document processed successfully'
      });

    } catch (aiError) {
      console.error('❌ AI Processing - Claude API error:', aiError);
      
      // For test document IDs, don't update database on error
      if (!document_id.startsWith('test')) {
        await supabaseAdmin!
          .from('procurement_documents')
          .update({
            extracted_text: document_text,
            processing_error: aiError instanceof Error ? aiError.message : 'AI processing failed',
            status: 'processing_failed'
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
