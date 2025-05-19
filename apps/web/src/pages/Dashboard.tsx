import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteCard from '../components/SiteCard';
import { useSitesStore, type Site } from '../stores/sites';
import { ftpService } from '../api/ftp';
import AppLayout from '../layout/AppLayout';
import FtpConnectionModal from '../components/modals/FtpConnectionModal';

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

export default function Dashboard() {
  // Mock data to match the image
  const mockSites: Site[] = [
    {
      id: '1',
      name: 'Eastgateministries.com',
      host: '72.167.42.141',
      type: 'ftp',
      url: 'http://eastgateministries.com',
      user: 'eastgate_ftp',
      pass: '',
      port: 21,
      secure: false,
      passive: true,
      root: 'httpdocs/',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  const { sites = mockSites, addSite, updateSite } = useSitesStore() || {};
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', host: '', user: '', pass: '', port: 21, root: '', url: '', secure: false, passive: true });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [connectionMessage, setConnectionMessage] = useState('');
  const navigate = useNavigate();

  const testConnection = async () => {
    if (!form.host) {
      setConnectionStatus('error');
      setConnectionMessage('Host is required');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('untested');
    setConnectionMessage('');

    try {
      const result = await ftpService.testConnection({
        host: form.host,
        port: form.port || 21,
        user: form.user || 'anonymous',
        pass: form.pass || '',
        secure: form.secure,
        passive: form.passive
      });

      if (result.success) {
        setConnectionStatus('success');
        setConnectionMessage('Connection successful!');
      } else {
        setConnectionStatus('error');
        setConnectionMessage(result.error || 'Connection failed. Please check your credentials.');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const submit = async () => {
    if (!form.name || !form.host) return;
    
    try {
      if (form.id) {
        // Update existing site
        await updateSite(form.id, {
          name: form.name,
          host: form.host,
          user: form.user || 'anonymous',
          pass: form.pass || undefined, // Only update password if provided
          port: form.port || 21,
          secure: form.secure,
          passive: form.passive,
          root: form.root || '/',
          url: form.url || '',
        });
      } else {
        // Add new site
        await addSite({
          name: form.name,
          host: form.host,
          user: form.user || 'anonymous',
          pass: form.pass || '',
          port: form.port || 21,
          secure: form.secure,
          passive: form.passive,
          root: form.root || '/',
          url: form.url || '',
          type: 'ftp'
        });
      }
      
      setShowModal(false);
      setForm({ id: '', name: '', host: '', user: '', pass: '', port: 21, root: '', url: '', secure: false, passive: true });
      setConnectionStatus('untested');
      setConnectionMessage('');
    } catch (error) {
      console.error('Error saving site:', error);
      setConnectionStatus('error');
      setConnectionMessage('Failed to save site configuration');
    }
  };

  const handleEditSite = (e: React.MouseEvent | null, siteId: string) => {
    if (e) e.stopPropagation();
    
    // Find the site by ID
    const siteToEdit = sites.find(site => site.id === siteId);
    
    if (siteToEdit) {
      // Populate form with site data
      setForm({
        id: siteId,
        name: siteToEdit.name || '',
        host: siteToEdit.host || '',
        user: siteToEdit.user || '',  // Use stored username if available
        pass: '', // We don't store password in state for security
        port: siteToEdit.port || 21,
        root: siteToEdit.root || '/',
        url: siteToEdit.url || '',
        secure: Boolean(siteToEdit.secure),
        passive: siteToEdit.passive !== false
      });
    }
    
    // Reset connection status
    setConnectionStatus('untested');
    setConnectionMessage('');
    
    setShowModal(true);
  };

  return (
    <AppLayout>
      {/* Page header with Add Site button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My FTP Sites</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your FTP connections and edit your websites</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#29A8FF] text-white px-4 py-2 rounded-md flex items-center justify-center hover:bg-[#0076CC] transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29A8FF] sm:w-auto w-full"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Site
        </button>
      </div>

      {/* Trial notification banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-amber-800 font-medium">Free Trial Mode</h3>
              <p className="text-amber-700 text-sm mt-1">You can browse and edit files, but saving changes requires a premium subscription. Your trial expires in 7 days.</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      {/* Site cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site: Site) => (
          <SiteCard
            key={site.id}
            site={site}
            onOpen={(id) => navigate(`/explorer/${id}`)}
            onEdit={(id) => handleEditSite(null, id)}
          />
        ))}
      </div>

      {/* FTP Connection Modal */}
      <FtpConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={form}
        onTestConnection={async (data: FtpConnectionFormData) => {
          setForm(data);
          await testConnection();
        }}
        onSubmit={async (data: FtpConnectionFormData) => {
          setForm(data);
          await submit();
        }}
        connectionStatus={connectionStatus}
        connectionMessage={connectionMessage}
        isConnecting={testingConnection}
        isEditing={Boolean(form.id)}
      />
    </AppLayout>
  );
}