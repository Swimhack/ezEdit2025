import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  UserSchema, 
  WebsiteSchema, 
  PageSchema, 
  EditSchema 
} from '../../packages/shared/src/types';

// Define the Supabase client type
export type SupabaseClient = ReturnType<typeof createClient>;

// Define the RPC functions
export const rpcFunctions = {
  // User functions
  getUserById: async (client: SupabaseClient, id: string) => {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return UserSchema.parse(data);
  },

  // Website functions
  getWebsitesByUserId: async (client: SupabaseClient, userId: string) => {
    const { data, error } = await client
      .from('websites')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return z.array(WebsiteSchema).parse(data);
  },

  createWebsite: async (client: SupabaseClient, website: Omit<z.infer<typeof WebsiteSchema>, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await client
      .from('websites')
      .insert(website)
      .select()
      .single();
    
    if (error) throw error;
    return WebsiteSchema.parse(data);
  },

  // Page functions
  getPagesByWebsiteId: async (client: SupabaseClient, websiteId: string) => {
    const { data, error } = await client
      .from('pages')
      .select('*')
      .eq('website_id', websiteId);
    
    if (error) throw error;
    return z.array(PageSchema).parse(data);
  },

  getPageByPath: async (client: SupabaseClient, websiteId: string, path: string) => {
    const { data, error } = await client
      .from('pages')
      .select('*')
      .eq('website_id', websiteId)
      .eq('path', path)
      .single();
    
    if (error) throw error;
    return PageSchema.parse(data);
  },

  createPage: async (client: SupabaseClient, page: Omit<z.infer<typeof PageSchema>, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await client
      .from('pages')
      .insert(page)
      .select()
      .single();
    
    if (error) throw error;
    return PageSchema.parse(data);
  },

  // Edit functions
  getEditsByPageId: async (client: SupabaseClient, pageId: string) => {
    const { data, error } = await client
      .from('edits')
      .select('*')
      .eq('page_id', pageId);
    
    if (error) throw error;
    return z.array(EditSchema).parse(data);
  },

  createEdit: async (client: SupabaseClient, edit: Omit<z.infer<typeof EditSchema>, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await client
      .from('edits')
      .insert(edit)
      .select()
      .single();
    
    if (error) throw error;
    return EditSchema.parse(data);
  },

  updateEditStatus: async (client: SupabaseClient, id: string, status: z.infer<typeof EditSchema>['status']) => {
    const { data, error } = await client
      .from('edits')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return EditSchema.parse(data);
  },

  publishEdit: async (client: SupabaseClient, editId: string) => {
    // Start a transaction
    const { error: txError } = await client.rpc('begin_transaction');
    if (txError) throw txError;

    try {
      // Get the edit
      const { data: editData, error: editError } = await client
        .from('edits')
        .select('*')
        .eq('id', editId)
        .single();
      
      if (editError) throw editError;
      const edit = EditSchema.parse(editData);

      // Update the page content
      const { error: pageError } = await client
        .from('pages')
        .update({ 
          content: edit.content,
          updated_at: new Date()
        })
        .eq('id', edit.pageId);
      
      if (pageError) throw pageError;

      // Update the edit status
      const { data: updatedEditData, error: updateError } = await client
        .from('edits')
        .update({ 
          status: 'published',
          updated_at: new Date()
        })
        .eq('id', editId)
        .select()
        .single();
      
      if (updateError) throw updateError;

      // Commit the transaction
      const { error: commitError } = await client.rpc('commit_transaction');
      if (commitError) throw commitError;

      return EditSchema.parse(updatedEditData);
    } catch (error) {
      // Rollback the transaction
      await client.rpc('rollback_transaction');
      throw error;
    }
  }
};

// Export the RPC function types
export type RpcFunctions = typeof rpcFunctions;
