import Anthropic from '@anthropic-ai/sdk';
import { mcpServer } from '../mcp-server';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  extracted_data: any;
  processing_time: number;
  model_used: string;
  confidence_score: number;
  cached: boolean;
}

export class AIService {
  private anthropic: Anthropic | null = null;
  private mcpServer: typeof mcpServer;
  private initialized = false;

  constructor() {
    this.mcpServer = mcpServer;
    this.initializeAnthropic();
  }

  private initializeAnthropic() {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
      this.initialized = true;
      console.log('✅ Anthropic Claude API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Anthropic API:', error);
      throw error;
    }
  }

  async processDocument(text: string, documentType: string): Promise<AIResponse> {
    try {
      if (!this.initialized || !this.anthropic) {
        throw new Error('Anthropic API not initialized');
      }

      const startTime = Date.now();
      
      // Build comprehensive prompt for document processing
      const prompt = this.buildDocumentProcessingPrompt(text, documentType);
      
      // Call Claude API for real AI processing
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const processingTime = Date.now() - startTime;
      
      // Parse Claude's response
      const aiResponse = response.content[0];
      if (aiResponse.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      const extractedData = this.parseAIResponse(aiResponse.text, documentType);
      
      // Use MCP server for additional validation and enhancement
      const patterns = await this.mcpServer.documentPatternAnalysis(text, documentType);
      const complianceCheck = await this.mcpServer.complianceChecker(extractedData, documentType);
      
      // Combine AI extraction with MCP validation
      const enhancedData = {
        ...extractedData,
        patterns: patterns.patterns,
        compliance: complianceCheck.complianceChecks,
        confidence: this.calculateConfidenceScore(extractedData, patterns, complianceCheck)
      };
      
      console.log(`🤖 Claude API processed document in ${processingTime}ms`);
      console.log(`📊 Extracted data confidence: ${enhancedData.confidence}`);
      
      return {
        extracted_data: enhancedData,
        processing_time: processingTime,
        model_used: 'claude-3-5-sonnet-20241022',
        confidence_score: enhancedData.confidence,
        cached: false
      };
    } catch (error) {
      console.error('❌ AI Service error:', error);
      
      // Fallback to pattern matching if Claude API fails
      console.log('🔄 Falling back to pattern matching...');
      return await this.fallbackProcessing(text, documentType);
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      if (!this.initialized || !this.anthropic) {
        throw new Error('Anthropic API not initialized');
      }

      // Convert messages to Claude format
      const claudeMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        messages: claudeMessages
      });

      const aiResponse = response.content[0];
      if (aiResponse.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      return aiResponse.text;
    } catch (error) {
      console.error('❌ AI Chat error:', error);
      throw error;
    }
  }

  private buildDocumentProcessingPrompt(text: string, documentType: string): string {
    return `You are an expert procurement document analyzer. Extract structured data from this ${documentType} document.

DOCUMENT TEXT:
${text}

Please extract the following information and return it as valid JSON:

{
  "supplier_name": "string",
  "supplier_address": "string", 
  "supplier_phone": "string",
  "supplier_email": "string",
  "supplier_tax_id": "string",
  "amount": number,
  "currency": "string",
  "issue_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "document_number": "string",
  "po_number": "string",
  "invoice_number": "string",
  "contract_number": "string",
  "reference_number": "string",
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "total_price": number,
      "unit": "string",
      "sku": "string",
      "category": "string"
    }
  ],
  "payment_terms": "string",
  "tax_amount": number,
  "total_amount": number,
  "delivery_date": "YYYY-MM-DD",
  "delivery_address": "string",
  "notes": "string",
  "confidence_score": number
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Use null for missing fields
- Ensure all amounts are numbers (not strings)
- Use ISO date format (YYYY-MM-DD)
- Provide confidence_score as a number between 0-1
- If document is in Polish, translate field names but keep original values
- Be precise and accurate in extraction`;
  }

  private parseAIResponse(responseText: string, documentType: string): any {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      
      // Validate and clean the extracted data
      return this.validateAndCleanData(extractedData, documentType);
    } catch (error) {
      console.error('❌ Failed to parse Claude response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private validateAndCleanData(data: any, documentType: string): any {
    // Ensure required fields exist
    const cleaned = {
      supplier_name: data.supplier_name || null,
      supplier_address: data.supplier_address || null,
      supplier_phone: data.supplier_phone || null,
      supplier_email: data.supplier_email || null,
      supplier_tax_id: data.supplier_tax_id || null,
      amount: typeof data.amount === 'number' ? data.amount : null,
      currency: data.currency || null,
      issue_date: data.issue_date || null,
      due_date: data.due_date || null,
      document_number: data.document_number || null,
      po_number: data.po_number || null,
      invoice_number: data.invoice_number || null,
      contract_number: data.contract_number || null,
      reference_number: data.reference_number || null,
      line_items: Array.isArray(data.line_items) ? data.line_items : [],
      payment_terms: data.payment_terms || null,
      tax_amount: typeof data.tax_amount === 'number' ? data.tax_amount : null,
      total_amount: typeof data.total_amount === 'number' ? data.total_amount : null,
      delivery_date: data.delivery_date || null,
      delivery_address: data.delivery_address || null,
      notes: data.notes || null,
      confidence_score: typeof data.confidence_score === 'number' ? data.confidence_score : 0.5
    };

    return cleaned;
  }

  private calculateConfidenceScore(extractedData: any, patterns: any, compliance: any): number {
    let confidence = extractedData.confidence_score || 0.5;
    
    // Boost confidence based on pattern completeness
    if (patterns.completenessScore > 0.8) {
      confidence += 0.1;
    }
    
    // Boost confidence based on compliance score
    if (compliance.overallCompliance > 0.8) {
      confidence += 0.1;
    }
    
    // Reduce confidence if critical fields are missing
    if (!extractedData.supplier_name) confidence -= 0.2;
    if (!extractedData.amount) confidence -= 0.2;
    if (!extractedData.currency) confidence -= 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }

  private async fallbackProcessing(text: string, documentType: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Use MCP server for pattern-based processing as fallback
    const patterns = await this.mcpServer.documentPatternAnalysis(text, documentType);
    
    const processingTime = Date.now() - startTime;
    
    // Create basic extracted data from patterns
    const result = {
      documentType,
      patterns: patterns.patterns,
      summary: `Document processed using pattern matching: ${documentType}`,
      confidence: patterns.completenessScore * 0.7 // Lower confidence for pattern-only processing
    };
    
    console.log('⚠️ Using fallback pattern matching due to Claude API failure');
    
    return {
      extracted_data: result,
      processing_time: processingTime,
      model_used: 'pattern-matching-fallback',
      confidence_score: result.confidence,
      cached: false
    };
  }
}

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
