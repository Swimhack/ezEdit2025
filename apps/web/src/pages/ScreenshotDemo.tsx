import React, { useState } from 'react';
import { Container } from '../components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScreenshotPreview } from '../components/editor/ScreenshotPreview';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Define the ScreenshotResult type locally to match the one in screenshot-service.ts
interface ScreenshotResult {
  url: string;
  imageData: string; // base64 encoded image or URL
  timestamp: string; // Changed from number to string to match the service
  viewport: { width: number; height: number };
  success: boolean;
  message?: string;
}

export default function ScreenshotDemo() {
  const [screenshotResult, setScreenshotResult] = useState<ScreenshotResult | null>(null);
  const [editedHtml, setEditedHtml] = useState<string>('');

  const handleScreenshotTaken = (result: ScreenshotResult) => {
    setScreenshotResult(result);
  };

  const handleEditPreview = (result: ScreenshotResult, html: string) => {
    setScreenshotResult(result);
    setEditedHtml(html);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sky-50 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-sky-100 dark:border-gray-700 sticky top-0 z-40 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm">
        <Container>
          <div className="flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
          Website Screenshot & Edit Demo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ScreenshotPreview 
              initialUrl=""
              onScreenshotTaken={handleScreenshotTaken}
              onEditPreview={handleEditPreview}
            />
          </div>

          <div>
            <Card className="h-full shadow-md">
              <CardHeader>
                <CardTitle>Results & Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3>How to use this tool</h3>
                      <ol>
                        <li>Enter a website URL and click "Capture" to take a screenshot</li>
                        <li>Click "Enter Edit Mode" to make changes to the website</li>
                        <li>Add CSS selectors and new text content to modify elements</li>
                        <li>Click "Preview Edits" to see your changes</li>
                      </ol>
                      
                      <h4>Example selectors:</h4>
                      <ul>
                        <li><code>#header h1</code> - Main heading in header</li>
                        <li><code>.hero-title</code> - Element with class "hero-title"</li>
                        <li><code>p.intro</code> - Paragraph with class "intro"</li>
                      </ul>
                      
                      <p className="text-sm text-gray-500 mt-4">
                        This demo uses Puppeteer to capture screenshots and make edits to websites.
                        In a production environment, this would be handled by a server-side API.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metadata">
                    {screenshotResult ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">URL:</div>
                          <div className="truncate">{screenshotResult.url}</div>
                          
                          <div className="font-medium">Timestamp:</div>
                          <div>{new Date(screenshotResult.timestamp).toLocaleString()}</div>
                          
                          <div className="font-medium">Viewport:</div>
                          <div>{screenshotResult.viewport.width}x{screenshotResult.viewport.height}</div>
                          
                          <div className="font-medium">Status:</div>
                          <div>{screenshotResult.success ? 'Success' : 'Failed'}</div>
                          {screenshotResult.message && (
                            <>
                              <div className="font-medium">Message:</div>
                              <div>{screenshotResult.message}</div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No screenshot taken yet
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="html">
                    {editedHtml ? (
                      <div className="overflow-auto max-h-96 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                        <pre className="text-xs">
                          <code>{editedHtml}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No edited HTML available yet
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
