import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase-admin';
import { ProcurementExtractedData, ProcurementLineItem } from '../types/procurement';

// TypeScript interfaces to replace 'any' types
interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
}

interface DocumentPatterns {
  hasHeader: boolean;
  hasSupplierInfo: boolean;
  hasBuyerInfo: boolean;
  hasFinancialData: boolean;
  hasDates: boolean;
  hasLineItems: boolean;
  hasTaxInfo: boolean;
  hasPaymentTerms: boolean;
}

interface ExtractedData {
  supplier_name?: string;
  supplier_address?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_tax_id?: string;
  amount?: number;
  currency?: string;
  issue_date?: string;
  due_date?: string;
  document_number?: string;
  po_number?: string;
  invoice_number?: string;
  contract_number?: string;
  reference_number?: string;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payment_terms?: string;
  tax_amount?: number;
  total_amount?: number;
  [key: string]: unknown;
}

// MCP Server for Procurement Document Analysis
export class ProcurementMCPServer {
  private supabase: SupabaseClient | null = null;
  private initialized = false;

  constructor() {
    // Don't initialize in constructor - wait for first use
  }

  async ensureInitialized() {
    if (this.initialized) return;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing required Supabase environment variables');
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Admin client will be created lazily when needed

      this.initialized = true;
      console.log('✅ MCP Server initialized successfully');
    } catch (error) {
      console.error('❌ MCP Server initialization failed:', error);
      throw error;
    }
  }

  // MCP Tool: Supplier Database Lookup
  async supplierLookup(name: string, userId: string) {
    try {
      await this.ensureInitialized();
      
      const supabaseAdmin = getSupabaseAdmin();
      
      const { data, error } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${name}%,contact_email.ilike.%${name}%,tax_id.ilike.%${name}%`);

      if (error) throw error;

      return {
        success: true,
        suppliers: data || [],
        matchCount: data?.length || 0,
        suggestions: this.generateSupplierSuggestions(name, data || [])
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        suppliers: [],
        matchCount: 0,
        suggestions: []
      };
    }
  }

  // MCP Tool: Financial Validation
  async financialValidation(amount: number, currency: string, documentType: string) {
    try {
      await this.ensureInitialized();
      
      const supabaseAdmin = getSupabaseAdmin();
      
      // Get historical data for validation
      const { data: historicalData, error } = await supabaseAdmin
        .from('procurement_documents')
        .select('amount, currency, document_type')
        .eq('currency', currency)
        .eq('document_type', documentType)
        .not('amount', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const amounts = historicalData?.map(d => d.amount) || [];
      const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
      const maxAmount = Math.max(...amounts, 0);
      const minAmount = Math.min(...amounts, 0);

      // Validation rules
      const validations = {
        isReasonable: amount > 0 && amount < maxAmount * 10,
        isTypical: amount >= minAmount && amount <= maxAmount * 2,
        currencySupported: ['USD', 'EUR', 'PLN', 'GBP'].includes(currency),
        amountRange: { min: minAmount, max: maxAmount, average: avgAmount },
        confidence: this.calculateFinancialConfidence(amount, amounts)
      };

      return {
        success: true,
        validations,
        historicalContext: {
          sampleSize: amounts.length,
          averageAmount: avgAmount,
          amountRange: { min: minAmount, max: maxAmount }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        validations: null,
        historicalContext: null
      };
    }
  }

  // MCP Tool: Document Pattern Analysis
  async documentPatternAnalysis(documentText: string, documentType: string) {
    try {
      await this.ensureInitialized();
      
      // Analyze document structure and patterns
      const patterns = {
        hasHeader: /FAKTURA|INVOICE|PURCHASE ORDER|CONTRACT|QUOTE/i.test(documentText),
        hasSupplierInfo: /SPRZEDAWCA|SUPPLIER|VENDOR/i.test(documentText),
        hasBuyerInfo: /NABYWCA|BUYER|CUSTOMER/i.test(documentText),
        hasFinancialData: /(?:EUR|USD|PLN|GBP)\s*\d+[,\d]*/i.test(documentText),
        hasDates: /\d{2}-\d{2}-\d{4}|\d{2}\/\d{2}\/\d{4}/.test(documentText),
        hasLineItems: /Lp\.|Item|Description|Quantity|Price/i.test(documentText),
        hasTaxInfo: /VAT|TAX|NIP|EIN/i.test(documentText),
        hasPaymentTerms: /TERMIN PŁATNOŚCI|PAYMENT TERMS|NET/i.test(documentText)
      };

      // Calculate document completeness score
      const completenessScore = Object.values(patterns).filter(Boolean).length / Object.keys(patterns).length;

      // Identify document language
      const language = this.detectLanguage(documentText);

      // Extract key patterns
      const keyPatterns = this.extractKeyPatterns(documentText, documentType);

      return {
        success: true,
        patterns,
        completenessScore,
        language,
        keyPatterns,
        suggestions: this.generateDocumentSuggestions(patterns, completenessScore)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        patterns: null,
        completenessScore: 0,
        language: 'unknown',
        keyPatterns: [],
        suggestions: []
      };
    }
  }

  // MCP Tool: Compliance Checker
  async complianceChecker(extractedData: ProcurementExtractedData, documentType: string) {
    try {
      await this.ensureInitialized();
      
      const complianceChecks = {
        requiredFields: this.checkRequiredFields(extractedData, documentType),
        dataValidation: this.validateExtractedData(extractedData),
        businessRules: this.checkBusinessRules(extractedData, documentType),
        riskAssessment: this.assessComplianceRisk(extractedData, documentType)
      };

      const overallCompliance = this.calculateComplianceScore(complianceChecks);

      return {
        success: true,
        complianceChecks,
        overallCompliance,
        recommendations: this.generateComplianceRecommendations(complianceChecks),
        riskLevel: this.determineRiskLevel(overallCompliance)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        complianceChecks: null,
        overallCompliance: 0,
        recommendations: [],
        riskLevel: 'unknown'
      };
    }
  }

  // MCP Tool: Industry Benchmark Lookup
  async industryBenchmarkLookup(documentType: string, amount: number, currency: string) {
    try {
      await this.ensureInitialized();
      
      // Get industry benchmarks from your database or external sources
      const benchmarks = await this.getIndustryBenchmarks(documentType, currency);
      
      const analysis = {
        amountInRange: amount >= benchmarks.minAmount && amount <= benchmarks.maxAmount,
        percentile: this.calculatePercentile(amount, benchmarks.amounts),
        industryAverage: benchmarks.averageAmount,
        typicalRange: { min: benchmarks.minAmount, max: benchmarks.maxAmount },
        recommendations: this.generateBenchmarkRecommendations(amount, benchmarks)
      };

      return {
        success: true,
        benchmarks,
        analysis,
        industryContext: {
          documentType,
          currency,
          sampleSize: benchmarks.sampleSize
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        benchmarks: null,
        analysis: null,
        industryContext: null
      };
    }
  }

  // MCP Tool: Intelligent Data Correction
  async intelligentDataCorrection(extractedData: ProcurementExtractedData, documentText: string) {
    try {
      await this.ensureInitialized();
      
      const corrections = {
        supplierName: this.correctSupplierName(extractedData.supplier_name || '', documentText),
        amounts: this.correctFinancialAmounts(extractedData, documentText),
        dates: this.correctDates(extractedData, documentText),
        lineItems: this.correctLineItems(extractedData.line_items || [], documentText),
        confidence: this.calculateCorrectionConfidence(extractedData, documentText)
      };

      return {
        success: true,
        originalData: extractedData,
        correctedData: { ...extractedData, ...corrections },
        corrections,
        confidence: corrections.confidence
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalData: extractedData,
        correctedData: extractedData,
        corrections: {},
        confidence: 0
      };
    }
  }

  // Helper Methods
  private generateSupplierSuggestions(name: string, suppliers: Supplier[]) {
    if (suppliers.length === 0) return [];
    
    return suppliers.map(s => ({
      id: s.id,
      name: s.name,
      confidence: this.calculateNameSimilarity(name, s.name),
      contactInfo: {
        email: s.contact_email,
        phone: s.contact_phone,
        address: s.contact_address
      }
    })).sort((a, b) => b.confidence - a.confidence);
  }

  private calculateFinancialConfidence(amount: number, historicalAmounts: number[]) {
    if (historicalAmounts.length === 0) return 0.5;
    
    const avg = historicalAmounts.reduce((a, b) => a + b, 0) / historicalAmounts.length;
    const stdDev = Math.sqrt(historicalAmounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / historicalAmounts.length);
    
    const zScore = Math.abs(amount - avg) / stdDev;
    return Math.max(0, 1 - zScore / 3); // Higher confidence for amounts closer to average
  }

  private detectLanguage(text: string): string {
    const polishPatterns = /ą|ć|ę|ł|ń|ó|ś|ź|ż|FAKTURA|SPRZEDAWCA|NABYWCA/i;
    const englishPatterns = /the|and|for|with|invoice|supplier|buyer/i;
    
    if (polishPatterns.test(text)) return 'polish';
    if (englishPatterns.test(text)) return 'english';
    return 'unknown';
  }

  private extractKeyPatterns(text: string, documentType: string) {
    const patterns = [];
    
    // Extract document numbers
    const docNumbers = text.match(/(?:FAKTURA|INVOICE|PO|CONTRACT)\s*(?:nr\s*)?([A-Z0-9\/\-]+)/gi);
    if (docNumbers) patterns.push(...docNumbers);
    
    // Extract amounts
    const amounts = text.match(/(?:EUR|USD|PLN|GBP)\s*[\d,]+\.?\d*/gi);
    if (amounts) patterns.push(...amounts);
    
    // Extract dates
    const dates = text.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/g);
    if (dates) patterns.push(...dates);
    
    return patterns;
  }

  private generateDocumentSuggestions(patterns: DocumentPatterns, completenessScore: number) {
    const suggestions = [];
    
    if (completenessScore < 0.7) {
      suggestions.push("Document appears incomplete. Consider manual review.");
    }
    
    if (!patterns.hasFinancialData) {
      suggestions.push("No financial data detected. Verify amount extraction.");
    }
    
    if (!patterns.hasSupplierInfo) {
      suggestions.push("Supplier information missing. Check document headers.");
    }
    
    return suggestions;
  }

  private checkRequiredFields(data: any, documentType: string) {
    const requiredFields = {
      'Invoice': ['supplier_name', 'amount', 'currency', 'issue_date'],
      'PO': ['supplier_name', 'amount', 'currency', 'issue_date'],
      'Contract': ['supplier_name', 'amount', 'currency', 'contract_start_date'],
      'Quote': ['supplier_name', 'amount', 'currency', 'issue_date']
    };
    
    const fields = requiredFields[documentType as keyof typeof requiredFields] || [];
    const missingFields = fields.filter(field => !data[field]);
    
    return {
      hasAllRequired: missingFields.length === 0,
      missingFields,
      score: (fields.length - missingFields.length) / fields.length
    };
  }

  private validateExtractedData(data: any) {
    const validations = {
      supplierName: typeof data.supplier_name === 'string' && data.supplier_name.length > 0,
      amount: typeof data.amount === 'number' && data.amount > 0,
      currency: typeof data.currency === 'string' && data.currency.length === 3,
      dates: this.validateDates(data)
    };
    
    return {
      validations,
      score: Object.values(validations).filter(Boolean).length / Object.keys(validations).length
    };
  }

  private validateDates(data: any) {
    const dateFields = ['issue_date', 'due_date', 'delivery_date'];
    const validDates = dateFields.filter(field => {
      const date = data[field];
      return date && !isNaN(Date.parse(date));
    });
    
    return validDates.length > 0;
  }

  private checkBusinessRules(data: any, documentType: string) {
    const rules = {
      amountPositive: data.amount > 0,
      dueDateAfterIssue: !data.due_date || !data.issue_date || new Date(data.due_date) >= new Date(data.issue_date),
      validCurrency: ['USD', 'EUR', 'PLN', 'GBP'].includes(data.currency)
    };
    
    return {
      rules,
      score: Object.values(rules).filter(Boolean).length / Object.keys(rules).length
    };
  }

  private assessComplianceRisk(data: any, documentType: string) {
    let riskScore = 0;
    
    if (!data.supplier_name) riskScore += 30;
    if (!data.amount || data.amount <= 0) riskScore += 25;
    if (!data.currency) riskScore += 20;
    if (!data.issue_date) riskScore += 15;
    if (data.amount > 100000) riskScore += 10; // High-value transactions
    
    return {
      riskScore: Math.min(100, riskScore),
      riskLevel: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
      factors: this.identifyRiskFactors(data)
    };
  }

  private identifyRiskFactors(data: any) {
    const factors = [];
    
    if (!data.supplier_name) factors.push('Missing supplier information');
    if (!data.amount) factors.push('Missing financial amounts');
    if (!data.currency) factors.push('Missing currency information');
    if (!data.issue_date) factors.push('Missing issue date');
    if (data.amount > 100000) factors.push('High-value transaction');
    
    return factors;
  }

  private calculateComplianceScore(checks: any) {
    const scores = [
      checks.requiredFields.score,
      checks.dataValidation.score,
      checks.businessRules.score,
      (100 - checks.riskAssessment.riskScore) / 100
    ];
    
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private determineRiskLevel(complianceScore: number) {
    if (complianceScore >= 0.8) return 'low';
    if (complianceScore >= 0.6) return 'medium';
    return 'high';
  }

  private generateComplianceRecommendations(checks: any) {
    const recommendations = [];
    
    if (checks.requiredFields.missingFields.length > 0) {
      recommendations.push(`Add missing required fields: ${checks.requiredFields.missingFields.join(', ')}`);
    }
    
    if (checks.dataValidation.score < 0.8) {
      recommendations.push('Validate extracted data for accuracy and completeness');
    }
    
    if (checks.riskAssessment.riskLevel === 'high') {
      recommendations.push('High compliance risk detected. Manual review recommended.');
    }
    
    return recommendations;
  }

  private async getIndustryBenchmarks(documentType: string, currency: string) {
    // This would typically connect to external industry data sources
    // For now, return reasonable defaults
    return {
      minAmount: 100,
      maxAmount: 1000000,
      averageAmount: 50000,
      amounts: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
      sampleSize: 8
    };
  }

  private calculatePercentile(amount: number, amounts: number[]) {
    const sorted = amounts.sort((a, b) => a - b);
    const index = sorted.findIndex(a => a >= amount);
    return index === -1 ? 100 : (index / sorted.length) * 100;
  }

  private generateBenchmarkRecommendations(amount: number, benchmarks: any) {
    const recommendations = [];
    
    if (amount < benchmarks.minAmount) {
      recommendations.push('Amount is below typical industry minimum. Verify accuracy.');
    }
    
    if (amount > benchmarks.maxAmount) {
      recommendations.push('Amount is above typical industry maximum. Review for accuracy.');
    }
    
    if (Math.abs(amount - benchmarks.averageAmount) > benchmarks.averageAmount * 0.5) {
      recommendations.push('Amount significantly differs from industry average. Consider verification.');
    }
    
    return recommendations;
  }

  private correctSupplierName(name: string, documentText: string) {
    // Look for supplier name patterns in the document
    const supplierPatterns = [
      /SPRZEDAWCA:\s*([^\n]+)/i,
      /SUPPLIER:\s*([^\n]+)/i,
      /VENDOR:\s*([^\n]+)/i
    ];
    
    for (const pattern of supplierPatterns) {
      const match = documentText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return name; // Return original if no correction found
  }

  private correctFinancialAmounts(data: ProcurementExtractedData, documentText: string) {
    const corrections: any = {};
    
    // Look for total amounts in the document
    const totalPattern = /(?:RAZEM|TOTAL|AMOUNT):\s*([\d,]+\.?\d*)\s*(EUR|USD|PLN|GBP)/i;
    const totalMatch = documentText.match(totalPattern);
    
    if (totalMatch) {
      corrections.total_amount = parseFloat(totalMatch[1].replace(/,/g, ''));
      corrections.currency = totalMatch[2];
    }
    
    return corrections;
  }

  private correctDates(data: ProcurementExtractedData, documentText: string) {
    const corrections: any = {};
    
    // Look for issue dates
    const issuePattern = /DATA WYSTAWIENIA:\s*(\d{2}-\d{2}-\d{4})/i;
    const issueMatch = documentText.match(issuePattern);
    
    if (issueMatch) {
      corrections.issue_date = issueMatch[1];
    }
    
    return corrections;
  }

  private correctLineItems(items: ProcurementLineItem[], documentText: string) {
    if (!items || items.length === 0) return [];
    
    // Look for line item patterns in the document
    const lineItemPattern = /(\d+)\s+([^\n]+?)\s+([\d,]+\.?\d*)\s*(EUR|USD|PLN|GBP)/gi;
    const matches = Array.from(documentText.matchAll(lineItemPattern));
    
    if (matches.length > 0) {
      return matches.map((match, index) => ({
        description: match[2].trim(),
        quantity: parseFloat(match[1]) || 1,
        unit_price: parseFloat(match[3].replace(/,/g, '')),
        total_price: parseFloat(match[3].replace(/,/g, '')),
        unit: 'piece',
        sku: null,
        category: null
      }));
    }
    
    return items; // Return original if no correction found
  }

  private calculateCorrectionConfidence(originalData: any, documentText: string) {
    let confidence = 0;
    let totalChecks = 0;
    
    // Check if supplier name was found in document
    if (documentText.includes(originalData.supplier_name || '')) {
      confidence += 1;
    }
    totalChecks++;
    
    // Check if amounts were found in document
    if (documentText.includes(originalData.amount?.toString() || '')) {
      confidence += 1;
    }
    totalChecks++;
    
    // Check if dates were found in document
    if (originalData.issue_date && documentText.includes(originalData.issue_date)) {
      confidence += 1;
    }
    totalChecks++;
    
    return totalChecks > 0 ? confidence / totalChecks : 0;
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

  // Export singleton instance with error handling
  export const mcpServer = new ProcurementMCPServer();
  
  // Helper function to safely use MCP tools
  export async function safeMCPCall<T>(
    mcpFunction: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await mcpFunction();
    } catch (error) {
      console.warn('⚠️ MCP tool failed, using fallback:', error);
      return fallback;
    }
  }
