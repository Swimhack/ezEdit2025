import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Camera, Edit2, RefreshCw } from 'lucide-react';

// Define types locally until we can properly import from lib-puppeteer
interface EditOperation {
  type: 'setText' | 'addStyle' | 'click' | 'removeElement' | 'setAttribute';
  selector?: string;
  value?: string;
  content?: string;
  attribute?: string;
}

interface ScreenshotResult {
  url: string;
  imageData: string; // base64 encoded image
  timestamp: string; // Changed from number to string to match the service
  viewport: { width: number; height: number };
  success: boolean;
  message?: string;
}

interface ScreenshotPreviewProps {
  initialUrl?: string;
  onScreenshotTaken?: (result: ScreenshotResult) => void;
  onEditPreview?: (result: ScreenshotResult, editedHtml: string) => void;
}

export function ScreenshotPreview({ 
  initialUrl = '', 
  onScreenshotTaken,
  onEditPreview 
}: ScreenshotPreviewProps) {
  const [url, setUrl] = useState<string>(initialUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [screenshot, setScreenshot] = useState<ScreenshotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editOperations, setEditOperations] = useState<EditOperation[]>([]);
  const [editSelector, setEditSelector] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');

  // Take a screenshot of the current URL
  const handleTakeScreenshot = async () => {
    if (!url) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure URL has protocol
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // In a real implementation, we would call the screenshot service
      // For now, we'll simulate a screenshot with a placeholder image
      setTimeout(() => {
        // Create a mock screenshot result
        const mockResult: ScreenshotResult = {
          url: formattedUrl,
          imageData: 'https://via.placeholder.com/1280x800?text=Screenshot+of+' + encodeURIComponent(formattedUrl),
          timestamp: new Date().toISOString(),
          viewport: { width: 1280, height: 800 },
          success: true
        };
        
        // Update state with the result
        setScreenshot(mockResult);
        setUrl(formattedUrl);
        
        // Call the callback if provided
        if (onScreenshotTaken) {
          onScreenshotTaken(mockResult);
        }
        
        setIsLoading(false);
      }, 1500); // Simulate network delay
    } catch (err) {
      console.error('Screenshot error:', err);
      setError(`Failed to take screenshot: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  };

  // Add an edit operation to the list
  const handleAddEditOperation = () => {
    if (!editSelector) {
      setError('Please enter a valid CSS selector');
      return;
    }

    const newOperation: EditOperation = {
      type: 'setText',
      selector: editSelector,
      value: editValue
    };

    setEditOperations([...editOperations, newOperation]);
    setEditSelector('');
    setEditValue('');
  };

  // Preview the edits on the website
  const handlePreviewEdits = async () => {
    if (!url || editOperations.length === 0) {
      setError('Please enter a URL and add at least one edit operation');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure URL has protocol
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // In a real implementation, we would call the screenshot service
      // For now, we'll simulate a screenshot with a placeholder image
      setTimeout(() => {
        // Create a mock screenshot result with edited content
        const mockResult: ScreenshotResult = {
          url: formattedUrl,
          imageData: 'https://via.placeholder.com/1280x800?text=Edited+' + encodeURIComponent(formattedUrl),
          timestamp: new Date().toISOString(),
          viewport: { width: 1280, height: 800 },
          success: true
        };
        
        // Update state with the result
        setScreenshot(mockResult);
        
        // Call the callback if provided
        if (onEditPreview) {
          // Generate a simple representation of the edits
          const editedHtml = editOperations.map(op => {
            if (op.type === 'setText') {
              return `<div>${op.selector} → "${op.value}"</div>`;
            }
            return `<div>${op.type} operation</div>`;
          }).join('');
          
          onEditPreview(mockResult, editedHtml);
        }
        
        setIsLoading(false);
      }, 2000); // Simulate network delay
    } catch (err) {
      console.error('Edit preview error:', err);
      setError(`Failed to preview edits: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  };

  // Clear the current screenshot and edit operations
  const handleReset = () => {
    setScreenshot(null);
    setEditOperations([]);
    setEditMode(false);
    setError(null);
  };

  return (
    <Card className="w-full shadow-md transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-500" />
          {editMode ? 'Edit Website Preview' : 'Website Screenshot Tool'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleTakeScreenshot} 
            disabled={isLoading || !url}
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Capture'}
          </Button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        {/* Screenshot Preview */}
        {screenshot && (
          <div className="mt-4 space-y-2">
            <div className="border rounded-md overflow-hidden">
              {screenshot.imageData.startsWith('data:') ? (
                <img 
                  src={screenshot.imageData} 
                  alt="Website Screenshot" 
                  className="w-full h-auto"
                />
              ) : (
                <img 
                  src={screenshot.imageData} 
                  alt="Website Screenshot" 
                  className="w-full h-auto"
                />
              )}
            </div>
            <div className="text-xs text-gray-500">
              Captured: {new Date(screenshot.timestamp).toLocaleString()}
            </div>
          </div>
        )}
        
        {/* Edit Mode Controls */}
        {editMode && (
          <div className="space-y-4 mt-4 p-4 border rounded-md bg-gray-50">
            <h3 className="text-sm font-medium">Edit Operations</h3>
            
            {/* Add Edit Operation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                placeholder="CSS Selector (e.g., #header h1)"
                value={editSelector}
                onChange={(e) => setEditSelector(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="New text content"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Button 
              onClick={handleAddEditOperation}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Add Edit Operation
            </Button>
            
            {/* List of Edit Operations */}
            {editOperations.length > 0 && (
              <div className="space-y-2 mt-2">
                <h4 className="text-xs font-medium text-gray-500">Pending Edits:</h4>
                <ul className="text-xs space-y-1">
                  {editOperations.map((op, index) => (
                    <li key={index} className="p-1 bg-white rounded border">
                      {op.type === 'setText' && (
                        <span>
                          Set text of <code className="bg-gray-100 px-1 rounded">{op.selector}</code> to: 
                          <span className="font-medium"> {op.value}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Preview Edits Button */}
            <Button 
              onClick={handlePreviewEdits}
              disabled={isLoading || editOperations.length === 0}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Preview Edits
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isLoading || (!screenshot && !editMode)}
        >
          Reset
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditMode(!editMode)}
          disabled={isLoading}
        >
          <Edit2 className="h-4 w-4 mr-2" />
          {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ScreenshotPreview;
