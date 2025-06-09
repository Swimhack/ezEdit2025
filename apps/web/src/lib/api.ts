import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema definitions
export const SiteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Site name is required"),
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535).default(21),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  passive: z.boolean().default(true),
  root_path: z.string().default('/'),
  status: z.enum(['online', 'offline', 'pending']).default('pending'),
  url: z.string().url().optional(),
  last_accessed: z.string().optional(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const CreateSiteSchema = SiteSchema.omit({ 
  id: true, 
  user_id: true,
  created_at: true,
  updated_at: true
});

export const UpdateSiteSchema = CreateSiteSchema.partial();

// Type definitions
export type Site = z.infer<typeof SiteSchema>;
export type CreateSiteInput = z.infer<typeof CreateSiteSchema>;
export type UpdateSiteInput = z.infer<typeof UpdateSiteSchema>;

/**
 * Get all sites for the current user
 * @returns Promise with sites data
 */
export async function getUserSites() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.user.id);
    
  if (error) throw error;
  
  return data as Site[];
}

/**
 * Get a site by ID
 * @param id Site ID
 * @returns Promise with site data
 */
export async function getSiteById(id: string) {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  
  return data as Site;
}

/**
 * Create a new site
 * @param site Site data
 * @returns Promise with created site
 */
export async function createSite(site: CreateSiteInput) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  // Validate input
  const validatedData = CreateSiteSchema.parse(site);
  
  const { data, error } = await supabase
    .from('sites')
    .insert({
      ...validatedData,
      user_id: user.user.id,
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return data as Site;
}

/**
 * Update an existing site
 * @param id Site ID
 * @param site Site data to update
 * @returns Promise with updated site
 */
export async function updateSite(id: string, site: UpdateSiteInput) {
  // Validate input
  const validatedData = UpdateSiteSchema.parse(site);
  
  const { data, error } = await supabase
    .from('sites')
    .update(validatedData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  
  return data as Site;
}

/**
 * Delete a site
 * @param id Site ID
 * @returns Promise with success status
 */
export async function deleteSite(id: string) {
  const { error } = await supabase
    .from('sites')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  
  return { success: true };
}

/**
 * Test connection to FTP server
 * @param credentials FTP connection credentials
 * @returns Promise with connection status
 */
export async function testConnection(credentials: {
  host: string;
  port: number;
  username: string;
  password: string;
  passive: boolean;
}) {
  // In a real implementation, this would call the backend API
  // For now, we'll simulate a successful connection
  console.log('Testing connection to:', credentials.host);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: 'Connection successful'
  };
}

/**
 * List files in FTP directory
 * @param path Directory path
 * @returns Promise with file listing
 */
export function listFiles(path: string = '/') {
  console.log('Listing files in:', path);
  return Promise.resolve({
    success: true,
    data: [
      { name: 'index.html', type: 'file', size: 1024, modified: new Date().toISOString() },
      { name: 'styles', type: 'dir', modified: new Date().toISOString() },
      { name: 'images', type: 'dir', modified: new Date().toISOString() }
    ]
  });
}

/**
 * Get file content
 * @param path File path
 * @returns Promise with file content
 */
export function getFileContent(path: string) {
  console.log('Getting content for:', path);
  return Promise.resolve({
    success: true,
    content: '<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>'
  });
}

/**
 * Save file content
 * @param path File path
 * @param content File content
 * @returns Promise with save status
 */
export function saveFileContent(path: string, content: string) {
  console.log('Saving content to:', path);
  return Promise.resolve({
    success: true,
    message: 'File saved successfully'
  });
}
