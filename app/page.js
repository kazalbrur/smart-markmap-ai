'use client';

import { useCallback, useState } from 'react';
import ApiSettings from '../components/ApiSettings';
import FileUpload from '../components/FileUpload';
import MarkdownEditor from '../components/MarkdownEditor';
import MindMap from '../components/MindMap';
import TextInput from '../components/TextInput';

export default function Home() {
  const [inputMode, setInputMode] = useState('file'); // 'file' or 'text'
  // Change default modelId and label to Gemini
  const [apiSettings, setApiSettings] = useState({ 
    apiKey: '', 
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', 
    modelId: 'gemini-2.0-flash' 
  });
  const [error, setError] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [mindMapVisible, setMindMapVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (content, fileName) => {
    await generateMindMap(content, fileName);
  };

  const handleTextSubmit = async (text) => {
    await generateMindMap(text);
  };

  const handleApiSettingsChange = useCallback((settings) => {
    setApiSettings(settings);
  }, []);

  const handleMarkdownChange = (newMarkdown) => {
    setMarkdown(newMarkdown);
  };

  const generateMindMap = async (text, fileName = 'document') => {
    setError('');
    setMindMapVisible(false);
    setMarkdown(''); // Clear previous result
    setLoading(true); // Start loading

    try {
      if (!apiSettings.apiKey) {
        setLoading(false);
        throw new Error('Please configure your Gemini API key in settings first');
      }

      // Check if text is exceeding the maximum size before even sending to API
      const MAX_CHAR_LIMIT = 131072; // Match with server constant
      if (text.length > MAX_CHAR_LIMIT) {
        setLoading(false);
        throw new Error(`File content exceeds API limit (${MAX_CHAR_LIMIT} characters), please upload a smaller file`);
      }

      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          apiKey: apiSettings.apiKey,
          apiEndpoint: apiSettings.apiEndpoint,
          modelId: apiSettings.modelId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setLoading(false);
        throw new Error(data.error || 'Failed to generate mind map');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialMarkdown = ''; // Store accumulated Markdown content
      
      // Show mind map area after receiving the first chunk
      let isFirstChunk = true;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setLoading(false);
            break;
          }
          
          // Decode received data
          const chunk = decoder.decode(value, { stream: true });
          
          // Handle data blocks that may contain multiple JSON objects
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              // Check for errors
              if (data.error) {
                setLoading(false);
                throw new Error(data.error);
              }
              
              // Handle complete response data (when done is true)
              if (data.done && data.markdown) {
                setMarkdown(data.markdown);
                if (isFirstChunk) {
                  setMindMapVisible(true);
                  isFirstChunk = false;
                }
                continue;
              }
              
              // Handle partial response data
              if (data.markdown) {
                partialMarkdown = data.markdown;
                setMarkdown(partialMarkdown);
                
                // If this is the first response with content, show the mind map
                if (isFirstChunk) {
                  setMindMapVisible(true);
                  isFirstChunk = false;
                }
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e, line);
            }
          }
        }
      } catch (error) {
        console.error('Error reading stream:', error);
        setLoading(false);
        throw error;
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <circle cx="9" cy="9" r="5" />
              <polyline points="16 4 20 4 20 8" />
              <line x1="14.5" y1="9.5" x2="20" y2="4" />
              <circle cx="9" cy="15" r="5" />
              <path d="M8 9.1v1.8a.79.79 0 0 0 .81.8h2.38a.79.79 0 0 0 .81-.81v-1.8a.79.79 0 0 0-.81-.79h-2.38a.79.79 0 0 0-.81.79Z" />
              <path d="M8 15.1v1.8a.79.79 0 0 0 .81.8h2.38a.79.79 0 0 0 .81-.81v-1.8a.79.79 0 0 0-.81-.79h-2.38a.79.79 0 0 0-.81.79Z" />
            </svg>
            <h1 className="text-xl font-bold">Smart Mind Map</h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/liujuntao123/smart-markmap" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              Support Author
            </a>
            <ApiSettings onSettingsChange={handleApiSettingsChange} />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-8xl mx-auto flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Easily convert your text into a mind map</h2>
          </div>

          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <button
              onClick={() => setInputMode('file')}
              className={`pb-2 px-1 ${
                inputMode === 'file'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`pb-2 px-1 ${
                inputMode === 'text'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Enter Text
            </button>
          </div>

          <div className="min-h-32">
            {inputMode === 'file' ? (
              <FileUpload onFileUpload={handleFileUpload} />
            ) : (
              <TextInput onTextSubmit={handleTextSubmit} />
            )}
          </div>

          {loading && (
            <div className="p-4 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating mind map, please wait...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <MarkdownEditor 
            markdown={markdown} 
            onChange={handleMarkdownChange} 
            isVisible={mindMapVisible} 
          />

          <MindMap markdown={markdown} isVisible={mindMapVisible} />
        </div>
      </main>

      <footer className="w-full py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6 text-center text-gray-600 dark:text-gray-400 text-sm">
          Smart Mind Map by Gemini AI
        </div>
      </footer>
    </div>
  );
}
