import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { ThemeToggle } from '../components/ui/theme-toggle';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Save,
  Eye,
  EyeOff,
  Send,
  FileText,
  Home,
  Settings,
  LogOut
} from 'lucide-react';

// Mock file data structure
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  content?: string;
  extension?: string;
}

// Mock file tree data
const mockFileTree: FileNode[] = [
  {
    id: 'dir-1',
    name: 'httpdocs',
    type: 'directory',
    path: '/httpdocs',
    children: [
      {
        id: 'file-1',
        name: 'index.html',
        type: 'file',
        extension: 'html',
        path: '/httpdocs/index.html',
        content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Eastgate Ministries</title>\n</head>\n<body>\n  <h1>Welcome to Eastgate Ministries</h1>\n  <p>Our mission is to serve our community.</p>\n</body>\n</html>'
      },
      {
        id: 'file-2',
        name: 'styles.css',
        type: 'file',
        extension: 'css',
        path: '/httpdocs/styles.css',
        content: 'body {\n  font-family: Arial, sans-serif;\n  line-height: 1.6;\n  margin: 0;\n  padding: 20px;\n  color: #333;\n}\n\nh1 {\n  color: #0066cc;\n}'
      },
      {
        id: 'dir-2',
        name: 'images',
        type: 'directory',
        path: '/httpdocs/images',
        children: [
          {
            id: 'file-3',
            name: 'logo.png',
            type: 'file',
            extension: 'png',
            path: '/httpdocs/images/logo.png'
          }
        ]
      }
    ]
  }
];

// Mock chat messages
interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
  suggestion?: string;
}

const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    content: 'Fix the layout of the page',
    timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
  },
  {
    id: 'msg-2',
    sender: 'agent',
    content: 'I can help with that! The layout issues are caused by missing CSS. Here\'s a suggested fix:',
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    suggestion: '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 20px;\n}'
  }
];

export default function Explorer() {
  const { id } = useParams<{ id: string }>();
  const [fileTree, setFileTree] = useState<FileNode[]>(mockFileTree);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [newMessage, setNewMessage] = useState<string>('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/httpdocs']));
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // Mock site data based on id
  const siteName = id === '1' ? 'Eastgateministries.com' : `Site ${id}`;

  useEffect(() => {
    // In a real app, we would fetch the file tree data from the API
    // For now, we'll just use the mock data
  }, [id]);

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      setOriginalContent(file.content || '');
      setEditedContent(file.content || '');
    }
  };

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
  };

  const handleSave = () => {
    alert('Save function would save changes to the FTP server. Requires Pro subscription.');
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setNewMessage('');

    // Mock AI response after a short delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        content: 'I\'m analyzing your request. Here\'s a suggestion to improve the code:',
        timestamp: new Date(),
        suggestion: selectedFile?.extension === 'css' ? 
          'h1 {\n  color: #1d4ed8;\n  font-size: 2rem;\n  margin-bottom: 1rem;\n}' : 
          '<div class="container">\n  <h1>Welcome to Eastgate Ministries</h1>\n  <p>Our mission is to serve our community.</p>\n</div>'
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const applySuggestion = (suggestion: string) => {
    setEditedContent(suggestion);
  };

  // Recursively render file tree
  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedDirs.has(node.path);
      const paddingLeft = `${level * 12}px`;
      
      if (node.type === 'directory') {
        return (
          <div key={node.id}>
            <div 
              className={`flex items-center p-1.5 rounded-md hover:bg-accent cursor-pointer text-sm ${selectedFile?.id === node.id ? 'bg-accent text-accent-foreground' : ''}`}
              style={{ paddingLeft: `calc(${paddingLeft} + 0.375rem)` }}
              onClick={() => toggleDir(node.path)}
            >
              <span className="mr-1.5">
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-primary" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
              <span className="flex-grow truncate">{node.name}</span>
              <span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            </div>
            {isExpanded && node.children && renderFileTree(node.children, level + 1)}
          </div>
        );
      } else {
        return (
          <div 
            key={node.id}
            className={`flex items-center p-1.5 rounded-md hover:bg-accent cursor-pointer text-sm ${selectedFile?.id === node.id ? 'bg-accent text-accent-foreground' : ''}`}
            style={{ paddingLeft: `calc(${paddingLeft} + 0.375rem)` }}
            onClick={() => handleFileSelect(node)}
          >
            <span className="mr-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="truncate">{node.name}</span>
          </div>
        );
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-4 border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo and Site Title */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center gap-1">
              <div className="bg-blue-500 text-white font-bold rounded p-1 text-xl">Ez</div>
              <span className="font-semibold text-xl">EzEdit.co</span>
            </Link>
            <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              {siteName}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              {showSidebar ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
              {showSidebar ? "Hide Files" : "Show Files"}
            </Button>
            <Button 
              onClick={handleSave} 
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* File Browser Sidebar */}
        <aside className={`border-r border-gray-100 bg-gray-50 flex-shrink-0 ${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-sm font-medium text-gray-700">Files</h3>
              <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-2 flex-grow">
              {renderFileTree(fileTree)}
            </div>
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-grow overflow-auto bg-white">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              {/* Editor tabs */}
              <div className="bg-gray-50 border-b border-gray-100 px-3 py-1.5 flex items-center">
                <div className="px-3 py-1 rounded-t-md bg-white border-t border-l border-r border-gray-200 text-sm font-medium text-gray-700 flex items-center">
                  <FileText className="h-4 w-4 mr-1.5 text-blue-500" />
                  {selectedFile.name}
                </div>
              </div>
              
              {/* Split Editor */}
              <div className="flex flex-1 border-b border-gray-100">
                <div className="w-1/2 border-r border-gray-100 flex flex-col">
                  <div className="py-1.5 px-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-700">Original</div>
                  <div className="flex-1 overflow-auto p-3 font-mono text-sm">
                    <pre className="whitespace-pre-wrap break-words">{originalContent}</pre>
                  </div>
                </div>
                <div className="w-1/2 flex flex-col">
                  <div className="py-1.5 px-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-700">Modified</div>
                  <div className="flex-1 overflow-auto">
                    <textarea 
                      value={editedContent} 
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="w-full h-full p-3 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-sm resize-none border-0"
                      spellCheck="false"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preview Controls */}
              <div className="flex items-center py-1.5 px-3 border-b border-gray-100 bg-gray-50">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showPreview} 
                    onChange={() => setShowPreview(!showPreview)}
                    className="sr-only peer" 
                  />
                  <div className="relative w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  <span className="ml-2 text-sm font-medium text-gray-700">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </label>
              </div>
              
              {/* Preview Panel */}
              {showPreview && (
                <div className="flex-1 border-t border-gray-100 bg-gray-50 p-3 overflow-auto">
                  {selectedFile.extension === 'html' ? (
                    <iframe 
                      srcDoc={editedContent} 
                      title="Preview" 
                      className="w-full h-full bg-white border border-gray-200 rounded shadow-sm" 
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 bg-white border border-gray-200 rounded p-6">
                      <div className="text-center">
                        <Eye className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p>Preview not available for this file type.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-6 max-w-sm">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No file selected</h3>
                <p className="text-gray-500">Select a file from the file browser to begin editing</p>
              </div>
            </div>
          )}
        </main>

        {/* Chat Assistant Panel */}
        <aside className="border-l border-gray-100 bg-white flex-shrink-0 w-80 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center">
            <h3 className="text-sm font-medium text-gray-700">AI Assistant</h3>
          </div>
          
          <div className="flex-grow overflow-y-auto p-3">
            {chatMessages.map(message => (
              <div 
                key={message.id} 
                className={`mb-3 last:mb-0 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block rounded-lg p-3 text-sm max-w-[85%] ${
                    message.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  
                  {message.suggestion && (
                    <div className="mt-2 bg-white rounded border border-gray-200 overflow-hidden">
                      <pre className="p-2 text-xs overflow-x-auto bg-gray-50 border-b border-gray-200">{message.suggestion}</pre>
                      <div className="p-2 flex justify-end">
                        <button 
                          className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                          onClick={() => applySuggestion(message.suggestion!)}
                        >
                          Apply Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center rounded-md border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <input 
                type="text"
                placeholder="Ask AI for help..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                className="flex-grow px-3 py-2 text-sm border-none focus:outline-none"
              />
              <button 
                className={`p-2 text-white ${!newMessage.trim() ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                onClick={sendChatMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
      
      {/* Trial Mode Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-amber-50 border-t border-amber-200 p-3 flex justify-between items-center z-50 shadow-md">
        <div className="text-amber-800 text-sm">
          <span className="font-medium">Free Trial Mode:</span> You can browse and edit files, but saving changes requires a premium subscription.
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm">Upgrade to Pro</Button>
      </div>
    </div>
  );
}