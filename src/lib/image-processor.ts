// Tesseract.js will be imported dynamically to avoid bundling issues

export interface ImageExtractionResult {
  text: string;
  success: boolean;
  error?: string;
  confidence?: number;
  processingTime?: number;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };
}

/**
 * Extract text from JPG/PNG images using OCR
 */
export async function extractTextFromImage(file: File): Promise<ImageExtractionResult> {
  const startTime = Date.now();
  
  try {
    console.log('🖼️ Starting image text extraction for:', file.name, 'type:', file.type);
    console.log('🖼️ File size:', file.size, 'bytes');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error(`Unsupported file type: ${file.type}. Only image files are supported.`);
    }

    // Convert File to ArrayBuffer for Tesseract
    const arrayBuffer = await file.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);
    
    console.log('🖼️ Image data loaded, starting OCR...');
    
    // Dynamic import of Tesseract.js to avoid bundling issues
    const Tesseract = await import('tesseract.js');
    
    // Configure Tesseract for better accuracy
    const { data: { text, confidence } } = await Tesseract.default.recognize(
      Buffer.from(imageData),
      'eng', // English language
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`🖼️ OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    const processingTime = Date.now() - startTime;
    const extractedText = text.trim();
    
    console.log('✅ Image text extraction completed');
    console.log('🖼️ Text length:', extractedText.length);
    console.log('🖼️ Confidence:', confidence);
    console.log('🖼️ Processing time:', processingTime, 'ms');
    console.log('🖼️ Text preview (first 200 chars):', extractedText.substring(0, 200));
    
    // Validate extracted text quality
    const validation = validateExtractedImageText(extractedText, file.name);
    if (!validation.isValid) {
      console.warn('⚠️ Image text extraction quality issues:', validation.issues);
      console.warn('💡 Suggestions:', validation.suggestions);
    }

    return {
      text: extractedText,
      success: true,
      confidence: confidence / 100, // Convert to 0-1 scale
      processingTime,
      metadata: {
        width: 0, // Tesseract doesn't provide this easily
        height: 0,
        format: file.type,
        size: file.size
      }
    };

  } catch (error) {
    console.error('❌ Image text extraction error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Validate extracted text quality from images
 */
export function validateExtractedImageText(text: string, filename: string): {
  isValid: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check minimum length
  if (text.length < 50) {
    issues.push('Text too short - may be incomplete extraction');
    suggestions.push('Try higher resolution image or better lighting');
  }

  // Check for common OCR issues
  const commonOcrIssues = [
    { pattern: /[0-9]{1,2}[Oo0]{1,2}[0-9]{1,2}/g, issue: 'Numbers may be misread as letters' },
    { pattern: /[Il1|]{3,}/g, issue: 'Similar characters may be confused' },
    { pattern: /\s{5,}/g, issue: 'Excessive whitespace detected' },
    { pattern: /[^\w\s.,\-$()\[\]{}:;!?@#%&*+=/\\|~`"\' \n\t]/g, issue: 'Unusual characters detected' }
  ];

  commonOcrIssues.forEach(({ pattern, issue }) => {
    if (pattern.test(text)) {
      issues.push(issue);
    }
  });

  // Check for financial document indicators
  const financialIndicators = [
    /\$\s*[\d,]+\.?\d*/g, // Dollar amounts
    /€\s*[\d,]+\.?\d*/g,  // Euro amounts
    /£\s*[\d,]+\.?\d*/g,  // Pound amounts
    /invoice|receipt|payment|total|amount|due|paid/gi,
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // Dates
    /\d{2,4}-\d{1,2}-\d{1,2}/g // ISO dates
  ];

  const hasFinancialContent = financialIndicators.some(pattern => pattern.test(text));
  if (!hasFinancialContent) {
    issues.push('No clear financial content detected');
    suggestions.push('Ensure image contains invoice, receipt, or financial document');
  }

  // Determine quality
  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  if (issues.length === 0) {
    quality = 'excellent';
  } else if (issues.length <= 2) {
    quality = 'good';
  } else if (issues.length <= 4) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  // Add quality-specific suggestions
  if (quality === 'poor') {
    suggestions.push('Consider retaking photo with better lighting and focus');
    suggestions.push('Ensure document is flat and fully visible');
    suggestions.push('Try scanning instead of photographing');
  }

  return {
    isValid: issues.length <= 2,
    quality,
    issues,
    suggestions
  };
}

/**
 * Preprocess image for better OCR accuracy
 */
export async function preprocessImageForOCR(file: File): Promise<File> {
  try {
    console.log('🖼️ Preprocessing image for better OCR...');
    
    // Create canvas for image manipulation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Load image
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Apply basic preprocessing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Convert to grayscale and enhance contrast
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const enhanced = gray < 128 ? gray * 0.5 : gray * 1.2; // Enhance contrast
            data[i] = enhanced;     // Red
            data[i + 1] = enhanced; // Green
            data[i + 2] = enhanced; // Blue
            // Alpha stays the same
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // Convert back to blob
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(imageUrl);
            if (blob) {
              const processedFile = new File([blob], file.name, { type: file.type });
              console.log('✅ Image preprocessing completed');
              resolve(processedFile);
            } else {
              reject(new Error('Failed to process image'));
            }
          }, file.type, 0.9);
          
        } catch (error) {
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
    
  } catch (error) {
    console.warn('⚠️ Image preprocessing failed, using original:', error);
    return file; // Return original file if preprocessing fails
  }
}
