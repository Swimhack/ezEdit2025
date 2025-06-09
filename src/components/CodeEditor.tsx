
import { useState, useEffect } from 'react';
import { Save, Sparkles, Download, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CodeEditorProps {
  file: any;
  connection: any;
}

const CodeEditor = ({ file, connection }: CodeEditorProps) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Mock file content for demo
  const mockContent = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
        </nav>
    </header>
    
    <main>
        <section id="hero">
            <h2>Beautiful websites made simple</h2>
            <p>Create stunning websites with our easy-to-use tools.</p>
            <button>Get Started</button>
        </section>
    </main>
    
    <script src="script.js"></script>
</body>
</html>`,
    'style.css': `/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 0;
}

nav a {
    color: white;
    text-decoration: none;
    margin: 0 1rem;
    transition: opacity 0.3s;
}

nav a:hover {
    opacity: 0.8;
}

#hero {
    text-align: center;
    padding: 4rem 2rem;
    background: #f8f9fa;
}

button {
    background: #007bff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s;
}

button:hover {
    background: #0056b3;
}`,
    'script.js': `// Website functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully!');
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Button click handler
    const ctaButton = document.querySelector('#hero button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            alert('Welcome! Ready to get started?');
        });
    }
});`
  };

  useEffect(() => {
    if (file) {
      loadFileContent();
    }
  }, [file]);

  const loadFileContent = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from your backend
      await new Promise(resolve => setTimeout(resolve, 300));
      const fileContent = mockContent[file.name] || '// File content will be loaded here';
      setContent(fileContent);
      setOriginalContent(fileContent);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load file content.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to your backend/FTP server
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOriginalContent(content);
      toast({
        title: "File saved",
        description: `${file.name} has been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save file.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiEdit = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsLoading(true);
    try {
      // In a real app, this would call your AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI response - in reality this would be much more sophisticated
      const aiResponse = `/* AI Enhancement Applied: ${aiPrompt} */\n${content}`;
      setContent(aiResponse);
      setAiPrompt('');
      setShowAiPanel(false);
      
      toast({
        title: "AI Enhancement Applied",
        description: "Your code has been updated with AI suggestions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "AI enhancement failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Code copied to clipboard.",
    });
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No file selected</h3>
          <p className="text-sm text-gray-500">Select a file from the file explorer to start editing.</p>
        </div>
      </div>
    );
  }

  const hasChanges = content !== originalContent;

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
            <p className="text-sm text-gray-500">{file.path}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
              title="AI Assistant"
            >
              <Sparkles size={16} />
            </button>
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                hasChanges && !isSaving
                  ? 'bg-[#1597FF] text-white hover:bg-[#1380E0]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} className="mr-1 inline" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-900 mb-2">AI Assistant</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to change..."
                className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAiEdit()}
              />
              <button
                onClick={handleAiEdit}
                disabled={!aiPrompt.trim() || isLoading}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Thinking...' : 'Apply'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1597FF] mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading file...</p>
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1597FF] resize-none"
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              lineHeight: '1.5',
              tabSize: 2
            }}
            placeholder="Start editing your code..."
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {content.split('\n').length} lines • {content.length} characters
          </span>
          {hasChanges && (
            <span className="text-orange-600 font-medium">• Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
