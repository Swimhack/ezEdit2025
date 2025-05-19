import React, { useState } from 'react';
import { 
  Server, 
  Globe, 
  Lock, 
  Unlock, 
  User, 
  Key, 
  Folder, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  X
} from 'lucide-react';
import clsx from 'clsx';

interface FtpConnectionFormData {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  passive: boolean;
  root: string;
  url: string;
}

interface FtpConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: FtpConnectionFormData;
  onTestConnection: (data: FtpConnectionFormData) => Promise<void>;
  onSubmit: (data: FtpConnectionFormData) => Promise<void>;
  connectionStatus: 'untested' | 'success' | 'error';
  connectionMessage: string;
  isConnecting: boolean;
  isEditing: boolean;
}

export default function FtpConnectionModal({
  isOpen,
  onClose,
  initialData,
  onTestConnection,
  onSubmit,
  connectionStatus,
  connectionMessage,
  isConnecting,
  isEditing
}: FtpConnectionModalProps) {
  const [form, setForm] = useState<FtpConnectionFormData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  
  if (!isOpen) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkboxes
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setForm(prev => ({ ...prev, [name]: target.checked }));
      return;
    }
    
    // Handle number fields
    if (type === 'number') {
      setForm(prev => ({ ...prev, [name]: parseInt(value) || 21 }));
      return;
    }
    
    // Handle text fields
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'protocol') {
      setForm(prev => ({ ...prev, secure: value === 'ftps' }));
      return;
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTestConnection = async () => {
    await onTestConnection(form);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };
  
  const getStatusIcon = () => {
    if (isConnecting) {
      return <RefreshCw className="w-5 h-5 mr-2 flex-shrink-0 animate-spin" />;
    }
    
    if (connectionStatus === 'success') {
      return <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 text-green-600" />;
    }
    
    if (connectionStatus === 'error') {
      return <XCircle className="w-5 h-5 mr-2 flex-shrink-0 text-red-600" />;
    }
    
    return null;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-xl transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
        {/* Modal Header with Title */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit FTP Connection' : 'Add New FTP Connection'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site Information Section */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <h4 className="font-medium text-gray-700">Site Information</h4>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Site Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="My Website"
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#29A8FF] focus:outline-none focus:ring-2 focus:ring-[#29A8FF] focus:ring-opacity-20"
                required
              />
            </div>
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                Web URL (Optional)
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="url"
                  name="url"
                  placeholder="https://example.com"
                  value={form.url}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-[#29A8FF] focus:outline-none focus:ring-2 focus:ring-[#29A8FF] focus:ring-opacity-20"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Used for site previewing</p>
            </div>
          </div>
          
          {/* Connection Settings Section */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <h4 className="font-medium text-gray-700">Connection Settings</h4>
            
            <div>
              <label htmlFor="host" className="block text-sm font-medium text-gray-700">
                FTP Host
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Server className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="host"
                  name="host"
                  placeholder="ftp.example.com or 192.168.1.1"
                  value={form.host}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-[#29A8FF] focus:outline-none focus:ring-2 focus:ring-[#29A8FF] focus:ring-opacity-20"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                  Port
                </label>
                <input
                  type="number"
                  id="port"
                  name="port"
                  placeholder="21"
                  value={form.port}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#29A8FF] focus:outline-none focus:ring-2 focus:ring-[#29A8FF] focus:ring-opacity-20"
                />
              </div>
              
              <div>
                <label htmlFor="protocol" className="block text-sm font-medium text-gray-700">
                  Protocol
                </label>
                <div className="relative mt-1">
                  <select
                    id="protocol"
                    name="protocol"
                    value={form.secure ? 'ftps' : 'ftp'}
                    onChange={handleSelectChange}
                    className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-[#29A8FF] focus:outline-none focus:ring-2 focus:ring-[#29A8FF] focus:ring-opacity-20 bg-white"
                  >
                    <option value="ftp">FTP (Insecure)</option>
                    <option value="ftps">FTPS (Secure)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    {form.secure ? 
                      <Lock className="h-4 w-4 text-green-500" /> : 
                      <Unlock className="h-4 w-4 text-amber-500" />
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Authentication Section */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <h4 className="font-medium text-gray-700">Authentication</h4>
            
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="user"
                  name="user"
                  placeholder="username"
                  value={form.user}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-[#29A8FF] focus:outline-none focus:ring-2 focus:ring-[#29A8FF] focus:ring-opacity-20"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="pass" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="pass"
                  name="pass"
                  placeholder={isEditing ? "Leave empty to keep current password" : "password"}
                  value={form.pass}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-[#29A8FF] focus:outline-none focus:ring-2 focus:ring-[#29A8FF] focus:ring-opacity-20"
                />
                <button 
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">Leave empty to keep the current password</p>
              )}
            </div>
          </div>
          
          {/* Advanced Settings */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <h4 className="font-medium text-gray-700">Advanced Settings</h4>
            
            <div>
              <label htmlFor="root" className="block text-sm font-medium text-gray-700">
                Root Directory (Optional)
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Folder className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="root"
                  name="root"
                  placeholder="/httpdocs"
                  value={form.root}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-[#29A8FF] focus:outline-none focus:ring-2 focus:ring-[#29A8FF] focus:ring-opacity-20"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Starting directory when connecting</p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="passive"
                name="passive"
                checked={form.passive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-[#29A8FF] focus:ring-[#29A8FF]"
              />
              <label htmlFor="passive" className="ml-2 block text-sm text-gray-700">
                Use passive mode (recommended for most connections)
              </label>
              <div className="ml-1 group relative">
                <span className="text-gray-400 cursor-help">(?)</span>
                <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 w-64 bg-gray-800 text-white text-xs rounded p-2 mb-2">
                  Passive mode is usually required when behind NAT or firewalls. Most modern FTP connections use this mode.
                </div>
              </div>
            </div>
          </div>
          
          {/* Connection Test Results */}
          {connectionStatus !== 'untested' && (
            <div 
              className={clsx(
                "p-4 rounded-lg flex items-start",
                connectionStatus === 'success' ? "bg-green-50" : "bg-red-50"
              )}
            >
              {getStatusIcon()}
              <div>
                <p className={clsx(
                  "font-medium",
                  connectionStatus === 'success' ? "text-green-800" : "text-red-800"
                )}>
                  {connectionStatus === 'success' ? 'Connection successful!' : 'Connection failed'}
                </p>
                <p className={clsx(
                  "text-sm",
                  connectionStatus === 'success' ? "text-green-700" : "text-red-700"
                )}>
                  {connectionMessage}
                </p>
              </div>
            </div>
          )}
          
          {/* Form Actions */}
          <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-between pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose}
              className="flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button 
                type="button" 
                onClick={handleTestConnection}
                disabled={isConnecting || !form.host}
                className="flex items-center justify-center rounded-md border border-[#29A8FF] bg-white px-4 py-2 text-sm font-medium text-[#29A8FF] shadow-sm hover:bg-[#E6F6FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
              
              <button 
                type="submit"
                disabled={!form.name || !form.host}
                className="flex items-center justify-center rounded-md bg-[#29A8FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0076CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? 'Update Connection' : 'Add Connection'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
