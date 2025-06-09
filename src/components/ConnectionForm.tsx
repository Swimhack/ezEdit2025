
import { useState } from 'react';
import { X, Server } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ConnectionFormProps {
  connection?: any;
  onSave: (connection: any) => void;
  onClose: () => void;
  onTest?: (connection: any) => void;
}

const ConnectionForm = ({ connection, onSave, onClose, onTest }: ConnectionFormProps) => {
  const [formData, setFormData] = useState({
    name: connection?.name || '',
    type: connection?.type || 'ftp',
    host: connection?.host || '',
    port: connection?.port || 21,
    username: connection?.username || '',
    password: connection?.password || '',
    rootDirectory: connection?.rootDirectory || '',
    webUrl: connection?.webUrl || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, this would connect to your backend/Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave({
        ...formData,
        id: connection?.id || Date.now(),
        connected: false
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.host || !formData.username) {
      toast({
        title: "Error",
        description: "Please fill in host and username before testing.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      if (onTest) {
        await onTest(formData);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'type' && value === 'sftp' ? { port: 22 } : {}),
      ...(field === 'type' && value === 'ftp' ? { port: 21 } : {})
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {connection ? 'Edit FTP Connection' : 'New FTP Connection'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-[#1597FF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1597FF] focus:border-transparent"
              placeholder="My Website"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FTP Host
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => handleChange('host', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1597FF] focus:border-transparent"
              placeholder="ftp.example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Port
            </label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => handleChange('port', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1597FF] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1597FF] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {connection && "(leave empty to keep current password)"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1597FF] focus:border-transparent"
              placeholder={connection ? "••••••••" : ""}
              required={!connection}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Root Directory (Optional)
            </label>
            <input
              type="text"
              value={formData.rootDirectory}
              onChange={(e) => handleChange('rootDirectory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1597FF] focus:border-transparent"
              placeholder="public_html/"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Web URL (Optional)
            </label>
            <input
              type="url"
              value={formData.webUrl}
              onChange={(e) => handleChange('webUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1597FF] focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex justify-between space-x-3 pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[#1597FF] text-white rounded-md hover:bg-[#1380E0] disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (connection ? 'Update Connection' : 'Save Connection')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionForm;
