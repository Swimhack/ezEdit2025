import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { persist } from 'zustand/middleware';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type FTPCredentials = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure?: boolean;
  passive?: boolean;
  root?: string;
};

export type Site = {
  id: string;
  userId?: string;
  name: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  passive: boolean;
  root?: string;
  url?: string;
  type: 'ftp' | 'sftp';
  createdAt: string;
  updatedAt?: string;
};

type SitesState = {
  sites: Site[];
  isLoading: boolean;
  currentSite: Site | null;
  subscriptionStatus: 'free' | 'pro' | null;
  trialEndsAt: string | null;
  fetchSites: () => Promise<void>;
  addSite: (site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Site>;
  updateSite: (id: string, updates: Partial<Site>) => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
  setCurrentSite: (site: Site | null) => void;
  checkUserSubscription: () => Promise<void>;
  canSaveChanges: () => boolean;
};

const formatSiteFromDB = (site: any): Site => ({
  ...site,
  port: site.port || 21,
  secure: Boolean(site.secure),
  passive: site.passive !== false,
});

export const useSitesStore = create<SitesState>()(
  persist(
    (set, get) => ({
      sites: [],
      isLoading: false, 
      currentSite: null,
      subscriptionStatus: null,
      trialEndsAt: null,
      
      fetchSites: async () => {
        set({ isLoading: true });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            // Use dummy data if not logged in or in development
            const dummySites: Site[] = [
              {
                id: '1',
                name: 'Eastgateministries.com',
                host: '72.167.42.141',
                port: 21,
                user: 'eastgate_ftp',
                pass: '********',
                secure: false,
                passive: true,
                root: 'httpdocs/',
                url: 'http://eastgateministries.com/',
                type: 'ftp',
                createdAt: new Date().toISOString(),
              }
            ];
            set({ sites: dummySites, isLoading: false });
            return;
          }
          
          const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          
          set({ 
            sites: data.map(formatSiteFromDB),
            isLoading: false 
          });
        } catch (error) {
          console.error('Error fetching sites:', error);
          set({ isLoading: false });
        }
      },
      
      addSite: async (siteData) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        const newSite: Omit<Site, 'id'> = {
          ...siteData,
          userId,
          createdAt: new Date().toISOString(),
          port: siteData.port || 21,
          secure: siteData.secure || false,
          passive: siteData.passive !== false,
        };
        
        try {
          if (!userId) {
            // Handle demo mode or not logged in
            const demoSite: Site = {
              ...newSite,
              id: Date.now().toString(),
            } as Site;
            
            set((state) => ({
              sites: [demoSite, ...state.sites],
            }));
            
            return demoSite;
          }
          
          const { data, error } = await supabase
            .from('sites')
            .insert([newSite])
            .select()
            .single();
            
          if (error) throw error;
          
          const createdSite = formatSiteFromDB(data);
          
          set((state) => ({
            sites: [createdSite, ...state.sites],
          }));
          
          return createdSite;
        } catch (error) {
          console.error('Error adding site:', error);
          throw error;
        }
      },
      
      updateSite: async (id, updates) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id;
          
          if (!userId) {
            // Update in local state for demo mode
            set((state) => ({
              sites: state.sites.map((site) =>
                site.id === id ? { ...site, ...updates, updatedAt: new Date().toISOString() } : site
              ),
              // Update currentSite if it matches the updated site
              currentSite: state.currentSite?.id === id 
                ? { ...state.currentSite, ...updates, updatedAt: new Date().toISOString() }
                : state.currentSite
            }));
            return;
          }
          
          const { error } = await supabase
            .from('sites')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
            
          if (error) throw error;
          
          // Update local state
          set((state) => ({
            sites: state.sites.map((site) =>
              site.id === id ? { ...site, ...updates, updatedAt: new Date().toISOString() } : site
            ),
            // Update currentSite if it matches the updated site
            currentSite: state.currentSite?.id === id 
              ? { ...state.currentSite, ...updates, updatedAt: new Date().toISOString() }
              : state.currentSite
          }));
        } catch (error) {
          console.error('Error updating site:', error);
          throw error;
        }
      },
      
      deleteSite: async (id) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id;
          
          if (!userId) {
            // Delete from local state for demo mode
            set((state) => ({
              sites: state.sites.filter((site) => site.id !== id),
              currentSite: state.currentSite?.id === id ? null : state.currentSite,
            }));
            return;
          }
          
          const { error } = await supabase
            .from('sites')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
            
          if (error) throw error;
          
          // Update local state
          set((state) => ({
            sites: state.sites.filter((site) => site.id !== id),
            currentSite: state.currentSite?.id === id ? null : state.currentSite,
          }));
        } catch (error) {
          console.error('Error deleting site:', error);
          throw error;
        }
      },
      
      setCurrentSite: (site) => {
        set({ currentSite: site });
      },
      
      checkUserSubscription: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.id) {
            set({ 
              subscriptionStatus: 'free',
              trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            });
            return;
          }
          
          const { data, error } = await supabase
            .from('subscriptions')
            .select('status, trial_ends_at')
            .eq('user_id', user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') { // PGRST116 is "Zero rows returned"
            throw error;
          }
          
          if (!data) {
            // No subscription found, assume free trial
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial
            
            set({ 
              subscriptionStatus: 'free', 
              trialEndsAt: trialEnd.toISOString() 
            });
          } else {
            set({ 
              subscriptionStatus: data.status,
              trialEndsAt: data.trial_ends_at
            });
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
          // Default to free for safety
          set({ subscriptionStatus: 'free', trialEndsAt: null });
        }
      },
      
      canSaveChanges: () => {
        const { subscriptionStatus } = get();
        return subscriptionStatus === 'pro';
      }
    }),
    {
      name: 'sites-storage',
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);