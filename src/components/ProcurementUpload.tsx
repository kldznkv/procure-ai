'use client';

import { useState } from 'react';
// import { useUser } from '@clerk/nextjs'; // DISABLED FOR DEPLOYMENT
import { ProcurementDocument } from '@/types/procurement';

interface ProcurementUploadProps {
  onUploadComplete?: (document: ProcurementDocument) => void;
}

export default function ProcurementUpload({ onUploadComplete }: ProcurementUploadProps) {
  // const { user, isLoaded } = useUser(); // DISABLED FOR DEPLOYMENT
  const user = { id: 'temp-user' }; // TEMPORARY FIX
  const isLoaded = true; // TEMPORARY FIX
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<ProcurementDocument['document_type']>('Other');
  const [error, setError] = useState<string | null>(null);

  // Text extraction function
  const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      if (file.type === 'application/pdf') {
        // For PDFs, we'll need to implement client-side extraction or use a service
        // For now, return a placeholder
        return `[PDF Document: ${file.name}] - Text extraction will be processed server-side.`;
      } else if (file.type === 'text/plain') {
        return await file.text();
      } else if (file.type.includes('word') || file.type.includes('document')) {
        return `[Word Document: ${file.name}] - Text extraction will be processed server-side.`;
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error('Failed to extract text from file');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Step 1: Extract text from file
      setUploadProgress(20);
      const extractedText = await extractTextFromFile(selectedFile);
      
      // Step 2: Upload document to database
      setUploadProgress(40);
      const uploadResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          filename: selectedFile.name,
          file_url: `procurement/${user.id}/${Date.now()}_${selectedFile.name}`,
          document_type: documentType,
          processed: false
        })
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload document');
      }

      const uploadResult = await uploadResponse.json();
      const documentId = uploadResult.data.id;

      // Step 3: Process document with AI
      setUploadProgress(60);
      const processResponse = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          document_text: extractedText,
          document_type: documentType
        })
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process document with AI');
      }

      const processResult = await processResponse.json();
      
      setUploadProgress(100);

      // Create document object for callback
      const document: ProcurementDocument = {
        id: documentId,
        user_id: user.id,
        filename: selectedFile.name,
        document_type: documentType,
        processed: true,
        extracted_text: extractedText,
        extracted_data: processResult.data,
        ai_analysis: processResult.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as ProcurementDocument;

      if (onUploadComplete) {
        onUploadComplete(document);
      }

      // Reset form
      setSelectedFile(null);
      setDocumentType('Other');
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📄 Upload Procurement Document
      </h3>
      
      <div className="space-y-4">
        {/* Document Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as ProcurementDocument['document_type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PO">Purchase Order (PO)</option>
            <option value="Invoice">Invoice</option>
            <option value="Contract">Contract</option>
            <option value="Quote">Quote</option>
            <option value="Specification">Specification</option>
            <option value="Receipt">Receipt</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.txt,.doc,.docx"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported: PDF, TXT, DOC, DOCX (max 10MB)
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Processing...' : 'Upload & Analyze'}
        </button>

        {/* Progress Bar */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            ❌ {error}
          </div>
        )}

        {/* Success Message */}
        {uploadProgress === 100 && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
            ✅ Document uploaded and analyzed successfully!
          </div>
        )}
      </div>
    </div>
  );
}
