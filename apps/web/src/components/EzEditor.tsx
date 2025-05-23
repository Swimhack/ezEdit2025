import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import FileTree from "./FileTree";
import SimpleCodeEditor from "./SimpleCodeEditor";
import ModeToggle, { EditorMode } from "./ModeToggle";
import * as localFs from "../lib/mcpLocalFs";
import * as ftpFs from "../lib/mcpFtp";
import { useSitesStore } from "../stores/sites";
import type { Site } from "../stores/sites";

export default function EzEditor() {
  const { currentSite, setCurrentSite, sites, canSaveChanges, addSite } = useSitesStore();
  const [mode, setMode] = useState<EditorMode>("local");
  const [path, setPath] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastPathByMode, setLastPathByMode] = useState<Record<EditorMode, string>>({ local: "", ftp: "" });
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (path && !isSaving) {
          handleSave();
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [path, code, isSaving]);
  
  // Save the last path for each mode when switching
  useEffect(() => {
    if (path) {
      setLastPathByMode(prev => ({ ...prev, [mode]: path }));
    }
  }, [path, mode]);
  
  // Handle mode change
  const handleModeChange = (newMode: EditorMode) => {
    if (newMode === mode) return;
    
    // Remember current path
    if (path) {
      setLastPathByMode(prev => ({ ...prev, [mode]: path }));
    }
    
    // Reset state for new mode
    setPath("");
    setCode("");
    setError(null);
    setIsModified(false);
    
    // Set the new mode
    setMode(newMode);
    
    // If switching to FTP, check if there's a current site
    if (newMode === "ftp" && !currentSite && sites.length > 0) {
      setCurrentSite(sites[0]);
    }
  };
  
  // Handle file open
  const handleOpen = async (filePath: string, content: string) => {
    setPath(filePath);
    setCode(content);
    setError(null);
    setIsModified(false);
  };
  
  // Handle file save
  const handleSave = async () => {
    if (!path) return;
    
    // Check if user can save changes (if in FTP mode)
    if (mode === "ftp" && !canSaveChanges()) {
      setError("Pro subscription required to save FTP files");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Save based on current mode
      if (mode === "local") {
        await localFs.writeFile(path, code);
      } else {
        // Ensure connection is established for FTP mode
        if (currentSite) {
          // Save file content
          await ftpFs.writeFile(path, code);
          
          // Check if the credentials are already stored by checking if the site has an id
          // that doesn't look like a temporary ID (starts with 'temp_')
          const isTempSite = !currentSite.id || currentSite.id.startsWith('temp_');
          
          if (isTempSite) {
            // Show confirmation dialog to save credentials
            const saveCreds = window.confirm(
              `Would you like to save the FTP credentials for ${currentSite.name} for future use?`
            );
            
            if (saveCreds) {
              try {
                // Create a permanent entry using the sites store
                const newSite = await useSitesStore.getState().addSite({
                  name: currentSite.name,
                  host: currentSite.host,
                  port: currentSite.port,
                  user: currentSite.user,
                  pass: currentSite.pass,
                  secure: currentSite.secure,
                  passive: currentSite.passive,
                  type: currentSite.type,
                  root: currentSite.root
                });
                
                // Update the current site to the new permanent one
                setCurrentSite(newSite);
                console.log('FTP credentials saved successfully');
              } catch (saveErr) {
                console.error('Error saving FTP credentials:', saveErr);
                // Don't throw error here as we've already saved the file
              }
            }
          }
        } else {
          throw new Error("No FTP site selected");
        }
      }
      
      setIsModified(false);
      console.log(`File ${path} saved successfully`);
    } catch (err) {
      console.error(`Error saving file ${path}:`, err);
      setError(`Failed to save file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (newCode !== code) {
      setIsModified(true);
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-64 border-r border-gray-600 bg-gray-800 text-white overflow-auto flex flex-col">
        {/* Mode toggle and site selector */}
        <div className="p-3 border-b border-gray-600">
          <ModeToggle 
            mode={mode} 
            onModeChange={handleModeChange} 
            disabled={isConnecting || isSaving}
          />
          
          {mode === "ftp" && (
            <div className="mt-3">
              <select
                className="w-full bg-gray-700 text-white p-1.5 rounded text-sm"
                value={currentSite?.id || ""}
                onChange={(e) => {
                  const site = sites.find(s => s.id === e.target.value) || null;
                  setCurrentSite(site);
                  // Reset path when changing site
                  setPath("");
                  setCode("");
                }}
                disabled={isConnecting}
              >
                {!currentSite && <option value="">Select a site</option>}
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {sites.length === 0 && (
                <div className="text-yellow-400 text-xs mt-1">
                  Add FTP sites in Dashboard
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* File tree */}
        <div className="flex-1 overflow-auto">
          <FileTree 
            onOpen={handleOpen} 
            mode={mode} 
            currentSite={mode === "ftp" ? currentSite : null} 
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="p-2 bg-gray-800 border-b border-gray-700 flex items-center">
          {/* Path indicator */}
          <div className="flex items-center text-white overflow-hidden mr-4">
            {mode === "ftp" && currentSite && (
              <span className="bg-blue-600 text-xs rounded px-1.5 py-0.5 mr-2">
                {currentSite.name}
              </span>
            )}
            <span className="truncate">
              {path || "No file selected"}
            </span>
            {isModified && (
              <span className="ml-2 text-yellow-400 text-xs">● Modified</span>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="flex items-center text-red-400 text-xs ml-2">
              <AlertCircle size={12} className="mr-1" />
              {error}
            </div>
          )}
          
          {/* Save button */}
          <button
            className={`ml-auto px-3 py-1 rounded ${
              path && !isSaving && (mode === "local" || canSaveChanges()) 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gray-600 cursor-not-allowed opacity-50"
            }`}
            onClick={handleSave}
            disabled={!path || isSaving || (mode === "ftp" && !canSaveChanges())}
            title={mode === "ftp" && !canSaveChanges() ? "Pro subscription required to save" : "Save file (Ctrl+S)"}
          >
            {isSaving ? "Saving..." : "Save Ctrl+S"}
          </button>
        </header>

        <div className="flex-1 overflow-hidden">
          {path ? (
            <SimpleCodeEditor 
              value={code} 
              onChange={handleCodeChange} 
              language={getLanguageFromPath(path)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="mb-2">Select a file from the sidebar to edit</p>
              {mode === "ftp" && !currentSite && (
                <p className="text-sm">Select an FTP site first</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function to determine language mode from file extension
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  
  // Map file extensions to language modes
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'php': 'php',
  };
  
  return languageMap[ext] || 'plaintext';
}
