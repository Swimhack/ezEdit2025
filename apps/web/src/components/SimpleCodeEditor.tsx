import React, { useState, useEffect, useRef } from 'react';
import { editor as monacoEditor } from 'monaco-editor';

interface SimpleCodeEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  language?: string;
  readOnly?: boolean;
}

const SimpleCodeEditor: React.FC<SimpleCodeEditorProps> = ({
  value,
  onChange,
  language = 'plaintext',
  readOnly = false
}) => {
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  // Initialize editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monacoEditor.create(containerRef.current, {
        value,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        readOnly,
      });
      
      // Setup change handler
      editorRef.current.onDidChangeModelContent(() => {
        const newValue = editorRef.current?.getValue() || '';
        onChange(newValue);
      });
      
      setIsEditorReady(true);
    }
    
    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);
  
  // Update editor value when it changes externally
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value, isEditorReady]);
  
  // Update language when it changes
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoEditor.setModelLanguage(model, language);
      }
    }
  }, [language, isEditorReady]);
  
  // Update read-only state
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly, isEditorReady]);
  
  return (
    <div ref={containerRef} className="h-full w-full" />
  );
};

export default SimpleCodeEditor;
