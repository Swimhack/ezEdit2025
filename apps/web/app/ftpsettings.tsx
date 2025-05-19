import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const demoSites = [
  {
    id: '1',
    name: 'Eastqa... (Eastgateministries.com)',
    host: '72.167.42.141',
    username: 'eastgate_ftp',
    root: 'httpdocs/',
    url: 'http://eastgateministries.com/',
  },
];

export default function FtpSettings() {
  const [form, setForm] = useState({ name: '', host: '', port: '21', username: '', password: '', root: '', url: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleEdit(site: typeof demoSites[0]) {
    setForm({
      name: site.name,
      host: site.host,
      port: '21',
      username: site.username,
      password: '',
      root: site.root,
      url: site.url,
    });
    setEditingId(site.id);
  }

  function handleClear() {
    setForm({ name: '', host: '', port: '21', username: '', password: '', root: '', url: '' });
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">FTP Settings</h1>
          <form className="bg-white rounded-lg shadow border border-gray-100 p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Name</label>
              <input name="name" className="w-full border rounded px-3 py-2" placeholder="Site Name" value={form.name} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">FTP Host</label>
              <input name="host" className="w-full border rounded px-3 py-2" placeholder="FTP Host" value={form.host} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Port</label>
              <input name="port" className="w-full border rounded px-3 py-2" placeholder="21" value={form.port} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input name="username" className="w-full border rounded px-3 py-2" placeholder="Username" value={form.username} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input name="password" type="password" className="w-full border rounded px-3 py-2" placeholder="Password" value={form.password} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Root Directory (Optional)</label>
              <input name="root" className="w-full border rounded px-3 py-2" placeholder="httpdocs/" value={form.root} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Web URL (Optional)</label>
              <input name="url" className="w-full border rounded px-3 py-2" placeholder="http://yoursite.com/" value={form.url} onChange={handleChange} />
            </div>
            <div className="md:col-span-2 flex gap-2 mt-2">
              <Button type="button" variant="outline" className="flex-1">Test Connection</Button>
              <Button type="button" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">{editingId ? 'Update Connection' : 'Add Site'}</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleClear}>Clear</Button>
            </div>
          </form>
          <h2 className="text-xl font-bold mb-4">Saved Sites</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {demoSites.map(site => (
              <div key={site.id} className="bg-white rounded-lg shadow border border-gray-100 p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg truncate">{site.name}</div>
                    <div className="text-gray-500 text-sm">Host: {site.host}</div>
                    <div className="text-gray-500 text-sm">Username: {site.username}</div>
                    <div className="text-gray-500 text-sm">Root: {site.root}</div>
                    <a href={site.url} className="text-blue-500 text-sm truncate" target="_blank" rel="noopener noreferrer">{site.url}</a>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(site)}>Edit</Button>
                    <Button size="sm" variant="outline">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="w-64 min-h-[calc(100vh-56px)] bg-gray-900 text-white flex flex-col py-8 px-4 gap-4">
      <div className="font-bold text-lg mb-6">Dashboard</div>
      <nav className="flex flex-col gap-2">
        <a href="/dashboard" className="py-2 px-3 rounded hover:bg-gray-800">Dashboard</a>
        <a href="/mysites" className="py-2 px-3 rounded hover:bg-gray-800">My Sites</a>
        <a href="/ftpsettings" className="py-2 px-3 rounded hover:bg-gray-800">Settings</a>
      </nav>
    </aside>
  );
} 