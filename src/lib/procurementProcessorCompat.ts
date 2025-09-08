// Backward Compatibility Wrapper for Procurement Processor
// This ensures existing code continues to work while providing the option to use the new unified AI service

import { 
  analyzeProcurementDocument as analyzeProcurementDocumentV1,
  uploadProcurementDocument as uploadProcurementDocumentV1,
  extractTextFromFile,
  extractTextFromPDF
} from './procurementProcessor';

import { 
  analyzeProcurementDocumentV2,
  uploadProcurementDocumentV2
} from './procurementProcessorV2';

import { ProcurementExtractedData, ProcurementAIAnalysis } from '../types/procurement';

// Configuration for AI provider selection
const AI_PROVIDER_CONFIG = {
  useUnifiedAI: process.env.USE_UNIFIED_AI === 'true',
  fallbackToV1: process.env.AI_FALLBACK_TO_V1 !== 'false'
};

// Main analysis function with backward compatibility
export async function analyzeProcurementDocument(
  text: string,
  documentType: string,
  userId: string
): Promise<{ extractedData: ProcurementExtractedData; aiAnalysis: ProcurementAIAnalysis }> {
  
  // If unified AI is enabled, try it first
  if (AI_PROVIDER_CONFIG.useUnifiedAI) {
    try {
      console.log('🤖 Using unified AI service for document analysis');
      return await analyzeProcurementDocumentV2(text, documentType, userId);
    } catch (error) {
      console.warn('⚠️ Unified AI failed, falling back to V1:', error);
      
      // If fallback is enabled, try V1
      if (AI_PROVIDER_CONFIG.fallbackToV1) {
        return await analyzeProcurementDocumentV1(text, documentType, userId);
      } else {
        throw error;
      }
    }
  } else {
    // Use original V1 implementation
    console.log('🤖 Using original AI service for document analysis');
    return await analyzeProcurementDocumentV1(text, documentType, userId);
  }
}

// Main upload function with backward compatibility
export async function uploadProcurementDocument(
  file: File,
  documentType: string,
  userId: string
) {
  
  // If unified AI is enabled, try it first
  if (AI_PROVIDER_CONFIG.useUnifiedAI) {
    try {
      console.log('🤖 Using unified AI service for document upload');
      return await uploadProcurementDocumentV2(file, documentType, userId);
    } catch (error) {
      console.warn('⚠️ Unified AI upload failed, falling back to V1:', error);
      
      // If fallback is enabled, try V1
      if (AI_PROVIDER_CONFIG.fallbackToV1) {
        return await uploadProcurementDocumentV1(file, documentType, userId);
      } else {
        throw error;
      }
    }
  } else {
    // Use original V1 implementation
    console.log('🤖 Using original AI service for document upload');
    return await uploadProcurementDocumentV1(file, documentType, userId);
  }
}

// Re-export all other functions from V1 to maintain compatibility
export {
  extractTextFromFile,
  extractTextFromPDF,
  findOrCreateSupplier,
  storeProcurementData
} from './procurementProcessor';

// Export V2 functions for direct use if needed
export {
  analyzeProcurementDocumentV2,
  uploadProcurementDocumentV2
} from './procurementProcessorV2';

// Configuration helper
export function getAIProviderConfig() {
  return {
    ...AI_PROVIDER_CONFIG,
    environment: {
      USE_UNIFIED_AI: process.env.USE_UNIFIED_AI,
      AI_FALLBACK_TO_V1: process.env.AI_FALLBACK_TO_V1,
      AI_DEFAULT_PROVIDER: process.env.AI_DEFAULT_PROVIDER,
      OLLAMA_URL: process.env.OLLAMA_URL,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '***configured***' : 'not configured'
    }
  };
}

// Force use specific version (for testing)
export async function analyzeProcurementDocumentV1Only(
  text: string,
  documentType: string,
  userId: string
): Promise<{ extractedData: ProcurementExtractedData; aiAnalysis: ProcurementAIAnalysis }> {
  console.log('🤖 Forcing V1 AI service for document analysis');
  return await analyzeProcurementDocumentV1(text, documentType, userId);
}

export async function analyzeProcurementDocumentV2Only(
  text: string,
  documentType: string,
  userId: string
): Promise<{ extractedData: ProcurementExtractedData; aiAnalysis: ProcurementAIAnalysis }> {
  console.log('🤖 Forcing V2 unified AI service for document analysis');
  return await analyzeProcurementDocumentV2(text, documentType, userId);
}
