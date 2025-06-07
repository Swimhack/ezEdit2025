import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../components/ui/container';
import { Button } from '../components/ui/button';
import { SiteCard } from '../components/dashboard/SiteCard';
import { AddSiteModal } from '../components/dashboard/AddSiteModal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { LayoutDashboard, Home, Settings, LogOut, Plus, Camera, Image } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/toast';

// Type for FTP Site
interface Site {
  id: string;
  name: string;
  host: string;
  url?: string;
  status?: 'online' | 'offline' | 'pending';
  lastAccessed?: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Site state with initial mock data
  const [sites, setSites] = useState([
    {
      id: '1',
      name: 'Eastgateministries.com',
      host: '72.167.42.141',
      url: 'http://eastgateministries.com',
      status: 'online' as const,
      lastAccessed: '2025-06-01 14:30',
    }
  ]);
  
  useEffect(() => {
    // Here we would fetch the user's sites from Supabase
    // This is where we would load the real data from the database
    const loadUserSites = async () => {
      if (!user) return;
      
      try {
        // In a real implementation, this would fetch from Supabase
        // const { data, error } = await supabase
        //   .from('sites')
        //   .select('*')
        //   .eq('user_id', user.id);
        
        // if (error) throw error;
        // setSites(data || []);
        
        // For now we're just using the mock data
      } catch (error) {
        console.error('Error loading sites:', error);
        toast({
          title: "Error loading sites",
          description: "There was a problem loading your sites",
          variant: "destructive"
        });
      }
    };
    
    loadUserSites();
  }, [user]);
  
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive"
        });
        console.error('Logout error:', error);
      } else {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
          variant: "default"
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const [addSiteModalOpen, setAddSiteModalOpen] = useState(false);

  const handleAddSite = () => {
    setAddSiteModalOpen(true);
  };

  const handleSiteAdded = () => {
    // Refresh sites list after a new site is added
    toast({
      title: "Site added",
      description: "Your new site has been added successfully",
      variant: "success"
    });
    
    // In a real implementation, we would fetch the updated sites list
    // For now, we're just using the mock data
  };
  
  const handleEditSite = (siteId: string) => {
    // Open edit dialog/modal
    toast({
      title: "Feature coming soon",
      description: "The site editing feature will be available soon",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sky-50">
      <header className="border-b border-sky-100 sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md shadow-sm">
        <Container>
          <div className="flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-blue-500 to-sky-500 text-white font-bold rounded-md p-1.5 text-xl shadow-md">Ez</div>
                <span className="text-2xl font-medium">Edit.co</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <Link to="/#features" className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600">
                Features
              </Link>
              <Link to="/#pricing" className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600">
                Pricing
              </Link>
              <Link to="/#docs" className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600">
                Docs
              </Link>
            </nav>
            
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">Dashboard</Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" size="sm" className="border-sky-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300">Admin</Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-red-50 hover:text-red-600" 
                onClick={handleLogout}
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoading ? 'Logging out...' : 'Log out'}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </Container>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-sky-100 h-[calc(100vh-4rem)] p-4 space-y-2 bg-white/80">
          <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 rounded-md bg-gradient-to-r from-blue-500 to-sky-500 text-white font-medium shadow-sm">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/sites" className="flex items-center gap-2 px-4 py-3 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Home className="h-5 w-5" />
            <span>My Sites</span>
          </Link>
          <Link to="/screenshot-demo" className="flex items-center gap-2 px-4 py-3 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Camera className="h-5 w-5" />
            <span>Screenshot Tool</span>
          </Link>
          <Link to="/settings" className="flex items-center gap-2 px-4 py-3 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">My FTP Sites</h1>
            <Button 
              onClick={handleAddSite} 
              className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" /> 
              Add Site
            </Button>
          </div>
          
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 shadow-md rounded-xl">
            <CardContent className="p-4">
              <p className="text-amber-800 dark:text-amber-300">
                <span className="font-medium">Free Trial Mode:</span> You can browse and edit files, but saving changes requires a premium subscription.
              </p>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sites.map(site => (
              <SiteCard
                key={site.id}
                id={site.id}
                name={site.name}
                host={site.host}
                status={site.status || 'pending'}
                lastAccessed={site.lastAccessed}
                onEdit={() => handleEditSite(site.id)}
              />
            ))}
          </div>
          {/* Add Site Modal */}
          <AddSiteModal 
            open={addSiteModalOpen} 
            onClose={() => setAddSiteModalOpen(false)} 
            onSiteAdded={handleSiteAdded}
          />
        </main>
      </div>
    </div>
  );
}