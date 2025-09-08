// PDF Text Extraction Utility
// This provides both client-side and server-side PDF text extraction
// Also supports image text extraction using OCR

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
}

// Client-side PDF extraction using PDF.js
export async function extractTextFromPDFClient(file: File): Promise<PDFExtractionResult> {
  try {
    console.log('📄 Starting client-side PDF text extraction for:', file.name);
    
    // Dynamic import of PDF.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up the worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('📄 PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    const pageCount = pdf.numPages;
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      fullText += pageText + '\n';
      console.log(`📄 Page ${pageNum} extracted, text length:`, pageText.length);
    }
    
    // Get metadata
    const metadata = await pdf.getMetadata();
    
    console.log('✅ PDF text extraction completed successfully');
    console.log('📄 Total text length:', fullText.length);
    console.log('📄 Text preview (first 200 chars):', fullText.substring(0, 200));
    
    return {
      text: fullText.trim(),
      pageCount,
      success: true,
      metadata: {
        title: (metadata.info as any)?.Title,
        author: (metadata.info as any)?.Author,
        subject: (metadata.info as any)?.Subject,
        creator: (metadata.info as any)?.Creator,
        producer: (metadata.info as any)?.Producer,
        creationDate: (metadata.info as any)?.CreationDate,
        modificationDate: (metadata.info as any)?.ModDate
      }
    };
    
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Server-side PDF extraction using pdf-parse (only works on server)
// This function is only available on the server side
export async function extractTextFromPDFServer(fileBuffer: Buffer): Promise<PDFExtractionResult> {
  // This function should only be called on the server side
  // It's not included in the client bundle to avoid fs module issues
  throw new Error('Server-side PDF extraction is not available in this context');
}

// Main text extraction function for client-side use
export async function extractTextFromFile(file: File): Promise<PDFExtractionResult> {
  try {
    console.log('📄 Starting text extraction for file:', file.name, 'type:', file.type);
    
    if (file.type === 'application/pdf') {
      return await extractTextFromPDFClient(file);
    } else if (file.type.includes('text') || file.type === 'text/plain') {
      const text = await file.text();
      return {
        text: text.trim(),
        pageCount: 1,
        success: true
      };
    } else if (file.type.startsWith('image/')) {
      // Handle image files (JPG, PNG, etc.) with OCR
      console.log('🖼️ Processing image file with OCR...');
      const { extractTextFromImage } = await import('./image-processor');
      const result = await extractTextFromImage(file);
      
      return {
        text: result.text,
        pageCount: 1,
        success: result.success,
        error: result.error,
        metadata: {
          ...result.metadata
        } as any
      };
    } else if (file.type.includes('document') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      // For Word documents, we'll need to implement this
      return {
        text: `[Word Document: ${file.name}] - Text extraction for Word documents not yet implemented.`,
        pageCount: 1,
        success: false,
        error: 'Word document extraction not implemented'
      };
    } else {
      return {
        text: `[Unsupported File: ${file.name}] - File type ${file.type} is not supported for text extraction.`,
        pageCount: 1,
        success: false,
        error: `Unsupported file type: ${file.type}`
      };
    }
    
  } catch (error) {
    console.error('❌ File text extraction failed:', error);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Validate extracted text quality
export function validateExtractedText(text: string, fileName: string): {
  isValid: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'invalid';
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for placeholder text
  if (text.includes('This is a placeholder for PDF text extraction') || 
      text.includes('PDF Content:') ||
      text.includes('File Content:')) {
    issues.push('Placeholder text detected - PDF extraction not working');
    suggestions.push('Fix PDF text extraction implementation');
    return { isValid: false, quality: 'invalid', issues, suggestions };
  }
  
  // Check text length
  if (text.length < 10) {
    issues.push('Text too short - extraction may have failed');
    suggestions.push('Check PDF file integrity and extraction method');
    return { isValid: false, quality: 'invalid', issues, suggestions };
  }
  
  // Check for financial data indicators
  const financialIndicators = [
    '$', '€', '£', 'USD', 'EUR', 'GBP', 'amount', 'total', 'sum', 'price', 'cost',
    'invoice', 'payment', 'transfer', 'bank', 'account', 'balance', 'receipt'
  ];
  
  const hasFinancialData = financialIndicators.some(indicator => 
    text.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (!hasFinancialData) {
    issues.push('No financial data indicators found');
    suggestions.push('Verify document contains financial information');
  }
  
  // Check for readable text (not just symbols)
  const readableText = text.replace(/[^\w\s]/g, '').trim();
  const readableRatio = readableText.length / text.length;
  
  if (readableRatio < 0.3) {
    issues.push('Low readable text ratio - may contain mostly symbols');
    suggestions.push('Check if PDF is image-based or corrupted');
  }
  
  // Determine quality
  let quality: 'excellent' | 'good' | 'poor' | 'invalid' = 'invalid';
  
  if (issues.length === 0) {
    quality = 'excellent';
  } else if (issues.length === 1) {
    quality = 'good';
  } else if (issues.length <= 3) {
    quality = 'poor';
  }
  
  return {
    isValid: issues.length === 0,
    quality,
    issues,
    suggestions
  };
}
