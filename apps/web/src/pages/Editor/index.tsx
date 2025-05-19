import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Save, Eye, RefreshCw, Trash2, FileText } from 'lucide-react';
import AppLayout from '../../layout/AppLayout';
import { useSitesStore } from '../../stores/sites';
import { ftpService } from '../../api/ftp';
import FileExplorer from '../../components/FileExplorer';
import CodeEditor from '../../components/CodeEditor';
import type { FTPListItem } from '../../api/types';
import type { Site } from '../../stores/sites';

export default function Editor() {
  const { siteId, filePath } = useParams<{ siteId: string; filePath?: string }>();
  const navigate = useNavigate();
  const { sites } = useSitesStore();
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(filePath || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isProSubscriber, setIsProSubscriber] = useState(false); // This would come from your auth system
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Find and set the selected site when siteId changes
  useEffect(() => {
    if (siteId && sites && sites.length) {
      const site = sites.find(s => s.id === siteId);
      if (site) {
        setSelectedSite(site);
      } else {
        console.error('Site not found:', siteId);
        navigate('/dashboard');
      }
    }
  }, [siteId, sites, navigate]);

  // Handle file selection from the FileExplorer
  const handleSelectFile = (path: string) => {
    setCurrentFile(path);
  };

  // Refresh the preview iframe
  const refreshPreview = () => {
    if (previewIframeRef.current) {
      setIsRefreshing(true);
      previewIframeRef.current.src = previewIframeRef.current.src;
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Toggle preview panel
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Get file name from path
  const getFileName = (path: string | null) => {
    if (!path) return 'No file selected';
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header with path, actions */}
        <div className="bg-gray-800 text-white p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span className="font-medium">
              {selectedSite ? selectedSite.name : 'Loading...'}
            </span>
            {currentFile && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-300 truncate max-w-md">
                  {getFileName(currentFile)}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              className={`p-1.5 rounded ${isProSubscriber ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 cursor-not-allowed'}`}
              disabled={!isProSubscriber || isSaving || !currentFile}
              title={isProSubscriber ? 'Save file' : 'Pro subscription required to save'}
              onClick={() => {
                // Save functionality will be implemented here
                alert('Save functionality will be implemented in a future update');
              }}
            >
              <Save className="w-4 h-4" />
            </button>
            
            <button
              className="p-1.5 rounded bg-gray-700 hover:bg-gray-600"
              onClick={togglePreview}
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              <Eye className="w-4 h-4" />
            </button>
            
            <button
              className={`p-1.5 rounded bg-gray-700 hover:bg-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
              onClick={refreshPreview}
              title="Refresh preview"
              disabled={isRefreshing}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File explorer */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-auto">
            <div className="p-2">
              <h3 className="text-sm font-medium mb-2">Files</h3>
              {selectedSite ? (
                <FileExplorer onSelectFile={handleSelectFile} />
              ) : (
                <div className="text-sm text-gray-500">Select a site to view files</div>
              )}
            </div>
          </div>
          
          {/* Editor and preview */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Code editor */}
            <div className={`${showPreview ? 'md:w-1/2' : 'w-full'} overflow-hidden flex flex-col`}>
              {currentFile ? (
                <CodeEditor filePath={currentFile} />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500">
                  <p>Select a file to edit</p>
                </div>
              )}
            </div>
            
            {/* Preview pane */}
            {showPreview && (
              <div className="md:w-1/2 border-l border-gray-200 flex flex-col overflow-hidden">
                <div className="p-1 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-medium">Preview</span>
                  <button
                    className="text-xs text-gray-600 hover:text-gray-900"
                    onClick={refreshPreview}
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    ref={previewIframeRef}
                    className="w-full h-full border-0"
                    src="/preview"
                    title="Preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
