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
  private mcpServer: typeof mcpServer;

  constructor() {
    this.mcpServer = mcpServer;
  }

  async processDocument(text: string, documentType: string): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      
      // Use MCP server for document pattern analysis
      const patterns = await this.mcpServer.documentPatternAnalysis(text, documentType);
      
      const processingTime = Date.now() - startTime;
      
      // Create a basic extracted data structure
      const result = {
        documentType,
        patterns,
        summary: `Document processed: ${documentType}`,
        confidence: 0.85
      };
      
      return {
        extracted_data: result,
        processing_time: processingTime,
        model_used: 'claude-3-5-sonnet-20241022',
        confidence_score: 0.85,
        cached: false
      };
    } catch (error) {
      console.error('AI Service error:', error);
      throw error;
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      // Simple chat implementation using MCP server
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        const patterns = await this.mcpServer.documentPatternAnalysis(lastMessage.content, 'general');
        return `AI response: Document patterns analyzed - ${JSON.stringify(patterns)}`;
      }
      return 'No user message found';
    } catch (error) {
      console.error('AI Chat error:', error);
      throw error;
    }
  }
}

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
