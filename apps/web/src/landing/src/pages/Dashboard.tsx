
import { useState } from 'react';
import { Globe, Plus, Settings, LogOut, LayoutDashboard, ExternalLink, MoreVertical, Edit } from 'lucide-react';
import ConnectionForm from '@/components/ConnectionForm';
import FileExplorer from '@/components/FileExplorer';
import CodeEditor from '@/components/CodeEditor';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [connections, setConnections] = useState([
    {
      id: 1,
      name: 'Eastgate Ministries',
      host: '72.167.42.141',
      port: 21,
      type: 'ftp',
      username: 'eastgate_ftp',
      rootDirectory: 'httpdocs/',
      webUrl: 'http://eastgateministries.com/',
      connected: true
    }
  ]);
  const [activeConnection, setActiveConnection] = useState(connections[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNewConnection = () => {
    setEditingConnection(null);
    setShowConnectionForm(true);
  };

  const handleEditConnection = (connection) => {
    setEditingConnection(connection);
    setShowConnectionForm(true);
  };

  const handleConnectionSaved = (connection) => {
    if (editingConnection) {
      setConnections(connections.map(c => c.id === editingConnection.id ? { ...connection, id: editingConnection.id } : c));
      toast({
        title: "Connection updated",
        description: "Your connection has been updated successfully.",
      });
    } else {
      setConnections([...connections, { ...connection, id: Date.now() }]);
      toast({
        title: "Connection saved",
        description: "Your connection has been saved successfully.",
      });
    }
    setShowConnectionForm(false);
    setEditingConnection(null);
  };

  const handleTestConnection = async (connection) => {
    toast({
      title: "Testing connection...",
      description: "Please wait while we test your connection.",
    });
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Connection successful",
      description: "Your FTP connection is working properly.",
    });
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#1597FF] to-white rounded-lg flex items-center justify-center border border-gray-200">
            <span className="text-white font-bold text-sm">Ez</span>
          </div>
          <span className="text-xl font-bold text-[#0A0E18]">EzEdit.co</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4">
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              activeTab === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('sites')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              activeTab === 'sites' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe size={18} />
            <span>My Sites</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
              activeTab === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTopNav = () => (
    <header className="bg-white border-b border-gray-200 ml-64">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Docs</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md">
              <LayoutDashboard size={16} />
              <span className="text-sm font-medium">Dashboard</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-md">
              <span className="text-sm font-medium">👑 Admin</span>
            </div>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <LogOut size={16} />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const renderMainContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My FTP Sites</h1>
            <button
              onClick={handleNewConnection}
              className="flex items-center space-x-2 bg-[#1597FF] text-white px-4 py-2 rounded-md hover:bg-[#1380E0]"
            >
              <Plus size={16} />
              <span>Add Site</span>
            </button>
          </div>

          {/* Trial Mode Banner */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <span className="font-semibold">Free Trial Mode:</span> You can browse and edit files, but saving changes requires a premium subscription.
            </p>
          </div>

          {/* Sites List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection) => (
              <div key={connection.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {connection.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditConnection(connection)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Host:</span> {connection.host}</p>
                  {connection.webUrl && (
                    <div className="flex items-center space-x-1">
                      <ExternalLink size={14} />
                      <a 
                        href={connection.webUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1597FF] hover:text-[#1380E0] truncate"
                      >
                        {connection.webUrl.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    connection.connected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {connection.connected ? 'Connected' : 'Disconnected'}
                  </div>
                  <button
                    onClick={() => setActiveConnection(connection)}
                    className="text-[#1597FF] hover:text-[#1380E0] text-sm font-medium"
                  >
                    Open Editor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {activeTab === 'sites' ? 'My Sites' : 'Settings'}
        </h1>
        <p className="text-gray-600">This section is coming soon...</p>
      </div>
    );
  };

  // If a connection is active and we're in editor mode, show the file explorer and editor
  if (activeConnection && activeTab === 'editor') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {renderSidebar()}
        <div className="flex-1 ml-64">
          {renderTopNav()}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 h-[calc(100vh-120px)]">
            {/* File Explorer */}
            <div className="lg:col-span-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <FileExplorer 
                connection={activeConnection}
                onFileSelect={setSelectedFile}
              />
            </div>

            {/* Code Editor */}
            <div className="lg:col-span-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <CodeEditor 
                file={selectedFile}
                connection={activeConnection}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {renderSidebar()}
      <div className="flex-1 ml-64">
        {renderTopNav()}
        <main className="min-h-[calc(100vh-80px)]">
          {renderMainContent()}
        </main>
      </div>

      {/* Connection Form Modal */}
      {showConnectionForm && (
        <ConnectionForm
          connection={editingConnection}
          onSave={handleConnectionSaved}
          onClose={() => {
            setShowConnectionForm(false);
            setEditingConnection(null);
          }}
          onTest={handleTestConnection}
        />
      )}
    </div>
  );
};

export default Dashboard;
