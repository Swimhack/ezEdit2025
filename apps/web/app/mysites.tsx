import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';

const demoSites = [
  {
    id: '1',
    name: 'Eastqa... (Eastgateministries.com)',
    host: '72.167.42.141',
    url: 'http://eastgateministries.com/',
  },
];

export default function MySites() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">My Sites</h1>
          <div className="grid md:grid-cols-2 gap-6">
            {demoSites.map(site => (
              <div key={site.id} className="bg-white rounded-lg shadow border border-gray-100 p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg truncate">{site.name}</div>
                    <div className="text-gray-500 text-sm">Host: {site.host}</div>
                    <a href={site.url} className="text-blue-500 text-sm truncate" target="_blank" rel="noopener noreferrer">{site.url}</a>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
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