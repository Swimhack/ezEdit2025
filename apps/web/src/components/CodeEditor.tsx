import React, { useState, useEffect, useRef } from 'react';
import { editor as monacoEditor } from 'monaco-editor';
import { ftpService } from '../api/ftp';
import { useSitesStore } from '../stores/sites';
import type { FTPResponse } from '../api/types';

interface CodeEditorProps {
  filePath: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ filePath }) => {
  const { currentSite } = useSitesStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<string>('');
  const [originalValue, setOriginalValue] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [language, setLanguage] = useState<string>('plaintext');
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Helper to detect language from file extension
  const detectLanguage = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'scss':
        return 'scss';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'php':
        return 'php';
      case 'py':
        return 'python';
      case 'xml':
        return 'xml';
      default:
        return 'plaintext';
    }
  };
  
  // Initialize editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monacoEditor.create(containerRef.current, {
        value: '',
        language: 'plaintext',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
      });
      
      editorRef.current.onDidChangeModelContent(() => {
        const newValue = editorRef.current?.getValue();
        setIsDirty(newValue !== originalValue);
      });
    }
    
    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);
  
  // Load file content when filePath changes
  const loadFileContent = async () => {
    if (!currentSite || !filePath) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ftpService.downloadFile(currentSite, filePath);
      
      if (response.success && response.data !== undefined) {
        setValue(response.data);
        setOriginalValue(response.data);
        setLanguage(detectLanguage(filePath));
      } else {
        setError(response.error || 'Failed to load file content');
      }
    } catch (err) {
      setError('An error occurred while loading the file');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save content
  const saveContent = async () => {
    if (!currentSite || !filePath) return;
    
    setError(null);
    
    try {
      const content = editorRef.current?.getValue() || value;
      const response = await ftpService.uploadFile(currentSite, filePath, content);
      
      if (response.success) {
        setOriginalValue(content);
        setIsDirty(false);
        alert('File saved successfully!');
      } else {
        setError(response.error || 'Failed to save file');
      }
    } catch (err) {
      setError('An error occurred while saving the file');
      console.error(err);
    }
  };
  
  // Update editor value and language when they change
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoEditor.setModelLanguage(model, language);
      }
      editorRef.current.setValue(value);
    }
  }, [value, language]);
  
  // Load file content when filePath or currentSite changes
  useEffect(() => {
    if (filePath && currentSite) {
      loadFileContent();
    }
  }, [filePath, currentSite]);
  
  return (
    <div className="h-full flex flex-col">
      {/* Editor toolbar */}
      <div className="flex justify-between items-center p-2 bg-gray-800 text-white">
        <div className="text-sm truncate">{filePath}</div>
        <div className="flex items-center space-x-2">
          {isDirty && (
            <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded">
              Modified
            </span>
          )}
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            onClick={saveContent}
            disabled={!isDirty}
          >
            Save
          </button>
        </div>
      </div>
      
      {/* Editor container */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-900 text-white">
            Loading...
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center bg-gray-900 text-white">
            <div className="text-red-400">{error}</div>
          </div>
        ) : (
          <div ref={containerRef} className="h-full w-full" />
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
