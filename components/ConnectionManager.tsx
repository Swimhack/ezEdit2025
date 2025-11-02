'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Save, Download, Upload, Trash2, Clock } from 'lucide-react';
import type { FTPConnection } from '@/types';
import type { WordPressConnection, WixConnection } from '@/types/cms';
import { credentialsService, type SavedConnection } from '@/lib/services/credentialsService';

type ConnectionType = 'ftp' | 'sftp' | 'wordpress' | 'wix';

interface ConnectionManagerProps {
  onConnect: (connection: FTPConnection | WordPressConnection | WixConnection) => void;
}

export function ConnectionManager({ onConnect }: ConnectionManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionType, setConnectionType] = useState<ConnectionType>('ftp');

  // Saved connections
  const [saved, setSaved] = useState<SavedConnection[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveAlways, setSaveAlways] = useState(true);

  useEffect(() => {
    setSaved(credentialsService.getSavedConnections());
  }, [isOpen]);

  // FTP/SFTP state
  const [ftpConfig, setFtpConfig] = useState({
    name: '',
    host: '',
    port: 21,
    username: '',
    password: '',
    secure: false,
  });

  // WordPress state
  const [wpConfig, setWpConfig] = useState({
    name: '',
    siteUrl: '',
    username: '',
    applicationPassword: '',
  });

  // Wix state
  const [wixConfig, setWixConfig] = useState({
    name: '',
    siteId: '',
    apiKey: '',
  });

  const handleFtpConnect = () => {
    const connection: FTPConnection = {
      id: crypto.randomUUID(),
      name: ftpConfig.name,
      type: connectionType === 'sftp' ? 'sftp' : 'ftp',
      host: ftpConfig.host,
      port: ftpConfig.port,
      username: ftpConfig.username,
      password: ftpConfig.password,
      secure: ftpConfig.secure,
    };
    if (saveAlways) {
      credentialsService.saveConnection(connection);
      setSaved(credentialsService.getSavedConnections());
    }
    onConnect(connection);
    setIsOpen(false);
  };

  const handleWpConnect = () => {
    const connection: WordPressConnection = {
      id: crypto.randomUUID(),
      name: wpConfig.name,
      type: 'wordpress',
      siteUrl: wpConfig.siteUrl,
      username: wpConfig.username,
      applicationPassword: wpConfig.applicationPassword,
    };
    if (saveAlways) {
      credentialsService.saveConnection(connection);
      setSaved(credentialsService.getSavedConnections());
    }
    onConnect(connection);
    setIsOpen(false);
  };

  const handleWixConnect = () => {
    const connection: WixConnection = {
      id: crypto.randomUUID(),
      name: wixConfig.name,
      type: 'wix',
      siteId: wixConfig.siteId,
      apiKey: wixConfig.apiKey,
    };
    if (saveAlways) {
      credentialsService.saveConnection(connection);
      setSaved(credentialsService.getSavedConnections());
    }
    onConnect(connection);
    setIsOpen(false);
  };

  const handleLoadSaved = (savedConn: SavedConnection) => {
    const connection = credentialsService.getConnection(savedConn.id);
    if (connection) {
      credentialsService.updateLastUsed(savedConn.id);
      onConnect(connection);
      setIsOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    credentialsService.deleteConnection(id);
    setSaved(credentialsService.getSavedConnections());
  };

  const handleExport = () => {
    const data = credentialsService.exportConnections();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezedit-connections-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const count = credentialsService.importConnections(content);
        setSaved(credentialsService.getSavedConnections());
        alert(`Successfully imported ${count} connection(s)`);
      } catch (error) {
        alert('Failed to import connections: ' + (error as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Connect to Remote Source
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect to Remote Source</DialogTitle>
        </DialogHeader>

        {/* Saved Connections Section */}
        {saved.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Saved Connections</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  className="h-8 gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {saved.map((conn) => (
                <Card
                  key={conn.id}
                  className="p-3 flex items-center justify-between hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleLoadSaved(conn)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{conn.name}</span>
                      {conn.type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {conn.type.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(conn.lastUsed).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conn.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Import button when no saved connections */}
        {saved.length === 0 && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Saved Connections
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        )}

        <Tabs value={connectionType} onValueChange={(v) => setConnectionType(v as ConnectionType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ftp">FTP</TabsTrigger>
            <TabsTrigger value="sftp">SFTP</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            <TabsTrigger value="wix">Wix</TabsTrigger>
          </TabsList>

          <TabsContent value="ftp" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Connection Name</label>
              <Input
                placeholder="My FTP Server"
                value={ftpConfig.name}
                onChange={(e) => setFtpConfig({ ...ftpConfig, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Host</label>
              <Input
                placeholder="ftp.example.com"
                value={ftpConfig.host}
                onChange={(e) => setFtpConfig({ ...ftpConfig, host: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Port</label>
              <Input
                type="number"
                placeholder="21"
                value={ftpConfig.port}
                onChange={(e) => setFtpConfig({ ...ftpConfig, port: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                value={ftpConfig.username}
                onChange={(e) => setFtpConfig({ ...ftpConfig, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={ftpConfig.password}
                onChange={(e) => setFtpConfig({ ...ftpConfig, password: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveAlwaysFtp"
                checked={saveAlways}
                onChange={(e) => setSaveAlways(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="saveAlwaysFtp" className="text-sm flex items-center gap-1">
                <Save className="h-3 w-3" />
                Save credentials for future use
              </label>
            </div>
            <Button onClick={handleFtpConnect} className="w-full">
              Connect to FTP
            </Button>
          </TabsContent>

          <TabsContent value="sftp" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Connection Name</label>
              <Input
                placeholder="My SFTP Server"
                value={ftpConfig.name}
                onChange={(e) => setFtpConfig({ ...ftpConfig, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Host</label>
              <Input
                placeholder="sftp.example.com"
                value={ftpConfig.host}
                onChange={(e) => setFtpConfig({ ...ftpConfig, host: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Port</label>
              <Input
                type="number"
                placeholder="22"
                value={ftpConfig.port}
                onChange={(e) => setFtpConfig({ ...ftpConfig, port: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                value={ftpConfig.username}
                onChange={(e) => setFtpConfig({ ...ftpConfig, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={ftpConfig.password}
                onChange={(e) => setFtpConfig({ ...ftpConfig, password: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveAlwaysSftp"
                checked={saveAlways}
                onChange={(e) => setSaveAlways(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="saveAlwaysSftp" className="text-sm flex items-center gap-1">
                <Save className="h-3 w-3" />
                Save credentials for future use
              </label>
            </div>
            <Button onClick={handleFtpConnect} className="w-full">
              Connect to SFTP
            </Button>
          </TabsContent>

          <TabsContent value="wordpress" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Connection Name</label>
              <Input
                placeholder="My WordPress Site"
                value={wpConfig.name}
                onChange={(e) => setWpConfig({ ...wpConfig, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Site URL</label>
              <Input
                placeholder="https://example.com"
                value={wpConfig.siteUrl}
                onChange={(e) => setWpConfig({ ...wpConfig, siteUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                value={wpConfig.username}
                onChange={(e) => setWpConfig({ ...wpConfig, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Application Password</label>
              <Input
                type="password"
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                value={wpConfig.applicationPassword}
                onChange={(e) => setWpConfig({ ...wpConfig, applicationPassword: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Generate at: WordPress Admin → Users → Profile → Application Passwords
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveAlwaysWp"
                checked={saveAlways}
                onChange={(e) => setSaveAlways(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="saveAlwaysWp" className="text-sm flex items-center gap-1">
                <Save className="h-3 w-3" />
                Save credentials for future use
              </label>
            </div>
            <Button onClick={handleWpConnect} className="w-full">
              Connect to WordPress
            </Button>
          </TabsContent>

          <TabsContent value="wix" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Connection Name</label>
              <Input
                placeholder="My Wix Site"
                value={wixConfig.name}
                onChange={(e) => setWixConfig({ ...wixConfig, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Site ID</label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={wixConfig.siteId}
                onChange={(e) => setWixConfig({ ...wixConfig, siteId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                placeholder="Your Wix API key"
                value={wixConfig.apiKey}
                onChange={(e) => setWixConfig({ ...wixConfig, apiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your API key from Wix Developer Console
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveAlwaysWix"
                checked={saveAlways}
                onChange={(e) => setSaveAlways(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="saveAlwaysWix" className="text-sm flex items-center gap-1">
                <Save className="h-3 w-3" />
                Save credentials for future use
              </label>
            </div>
            <Button onClick={handleWixConnect} className="w-full">
              Connect to Wix
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
