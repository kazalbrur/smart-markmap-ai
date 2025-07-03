'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

// Maximum characters allowed by Gemini API
const MAX_CHAR_LIMIT = 131072;

export default function FileUpload({ onFileUpload }) {
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const extractTextFromDocx = async (arrayBuffer) => {
    try {
      // Dynamically import dependencies
      const JSZip = (await import('jszip')).default;
      const Docxtemplater = (await import('docxtemplater')).default;
      const { DOMParser } = await import('@xmldom/xmldom');
      
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Load docx file content
      await zip.loadAsync(arrayBuffer);
      
      // Create a new docxtemplater instance
      const doc = new Docxtemplater();
      doc.loadZip(zip);
      
      // Get document.xml file content
      const documentXml = await zip.file('word/document.xml').async('string');
      
      // Parse XML using DOMParser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
      
      // Extract text nodes
      const textNodes = [];
      const extractTextNodes = (node) => {
        if (node.nodeType === 3) { // Text node
          if (node.nodeValue.trim()) {
            textNodes.push(node.nodeValue);
          }
        } else if (node.nodeType === 1) { // Element node
          for (let i = 0; i < node.childNodes.length; i++) {
            extractTextNodes(node.childNodes[i]);
          }
        }
      };
      
      extractTextNodes(xmlDoc);
      
      // Combine all text
      return textNodes.join(' ').replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      
      // If the above method fails, try a simple method
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        const loadedZip = await zip.loadAsync(arrayBuffer);
        const contentXml = await loadedZip.file('word/document.xml').async('text');
        
        // Simple method to extract text
        const textContent = contentXml
          .replace(/<w:p[^>]*>/g, '\n')
          .replace(/<\/w:p>/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/\n{2,}/g, '\n\n')
          .trim();
        
        return textContent;
      } catch (fallbackError) {
        console.error('Fallback method failed:', fallbackError);
        throw new Error('Unable to parse DOCX file: ' + error.message);
      }
    }
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
      
      let text = '';
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      // According to file type, choose different parsing methods
      if (fileExtension === 'docx') {
        text = await extractTextFromDocx(arrayBuffer);
      } else if (fileExtension === 'txt' || fileExtension === 'md') {
        // Plain text files are read directly
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }
      
      // Record text info
      const textInfo = {
        length: text.length,
        byteLength: new Blob([text]).size,
        firstChars: text.substring(0, 100).replace(/[\r\n]+/g, ' ')
      };
      
      console.log('Extracted text info:', textInfo);
      setFileInfo(textInfo);
      
      // Check character limit
      if (text.length > MAX_CHAR_LIMIT) {
        setError(`Text content exceeds API limit (${MAX_CHAR_LIMIT} characters), extracted text length: ${text.length} characters`);
        setIsProcessing(false);
        return;
      }
      
      // Call upload callback
      onFileUpload(text, file.name);
      setIsProcessing(false);
      
    } catch (err) {
      console.error('File processing error:', err);
      setError(`Error processing file: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setError('');
      setFileInfo(null);
      
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        
        // Log file info
        console.log(`File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
        
        // Check file size
        if (file.size > 10 * 1024 * 1024) { // Increased to 10MB
          setError('File too large, please upload a file smaller than 10MB');
          return;
        }
        
        await processFile(file);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={`w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-gray-400 dark:text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          <p className="text-lg font-medium">
            {isDragActive ? "Drop the file here" : "Drop the file here, or click to select a file"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supports .txt, .md, .docx formats (max 130,000 characters)
          </p>
        </div>
      </div>
      
      {/* PDF conversion button */}
      <button
        onClick={() => setShowPdfModal(true)}
        className="self-end text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
      >
        Want to upload a PDF?
      </button>
      
      {/* PDF conversion modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">PDF Conversion</h3>
              <button 
                onClick={() => setShowPdfModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="mb-4">Due to the limitations of this open-source project, PDF files cannot be processed directly for now. You can use the Byte Doc2x platform for free PDF conversion. Just one simple step for fast and accurate conversion. <a 
              href="https://doc2x.noedgeai.com?inviteCode=Q3ZK0E"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Doc2x Platform
            </a></p>
            
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="p-4 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing file, please wait...
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      
      {fileInfo && !error && !isProcessing && (
        <div className="p-4 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-sm">
          File processed: {fileInfo.length} characters ({fileInfo.byteLength} bytes)
        </div>
      )}
    </div>
  );
}