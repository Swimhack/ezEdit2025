/**
 * EzEdit Supabase Service
 * Handles authentication and database operations using Supabase
 */

class SupabaseService {
  constructor(memoryService) {
    // Store memory service reference
    this.memoryService = memoryService || (window.ezEdit && window.ezEdit.memory);
    
    // Supabase configuration
    this.config = {
      url: '',
      anonKey: '',
      authRedirectUrl: window.location.origin + '/auth-callback.html'
    };
    
    // Load configuration
    this.loadConfig();
    
    // Initialize Supabase client
    this.initializeClient();
  }
  
  /**
   * Load configuration from EzEditConfig and memory service
   */
  loadConfig() {
    // First try to load from global EzEditConfig
    if (window.EzEditConfig && window.EzEditConfig.supabase) {
      if (window.EzEditConfig.supabase.url) {
        this.config.url = window.EzEditConfig.supabase.url;
      }
      
      if (window.EzEditConfig.supabase.anonKey) {
        this.config.anonKey = window.EzEditConfig.supabase.anonKey;
      }
    }
    
    // Then try to load from memory service (which might override the config)
    if (this.memoryService) {
      const supabaseConfig = this.memoryService.getApiKey('supabase');
      if (supabaseConfig) {
        if (supabaseConfig.url) this.config.url = supabaseConfig.url;
        if (supabaseConfig.anonKey) this.config.anonKey = supabaseConfig.anonKey;
      }
    }
    
    // Log configuration status
    if (!this.config.url || !this.config.anonKey) {
      console.warn('Supabase configuration incomplete. Please check EzEditConfig or memory service.');
    }
  }
  
  /**
   * Initialize Supabase client
   */
  initializeClient() {
    // Create Supabase client if supabase-js is loaded
    if (window.supabase) {
      try {
        // Check if we have valid configuration
        if (!this.config.url || !this.config.anonKey) {
          throw new Error('Invalid Supabase configuration. URL or anon key is missing.');
        }
        
        // Create the client
        this.client = supabase.createClient(this.config.url, this.config.anonKey);
        
        // Check if client was created successfully
        if (!this.client) {
          throw new Error('Failed to create Supabase client');
        }
        
        console.log('Supabase client initialized successfully');
        
        // Try to restore session from localStorage if available
        this._restoreSessionFromLocalStorage();
        
      } catch (error) {
        console.error('Error initializing Supabase client:', error);
        // Create a fallback client that logs errors but doesn't crash
        this._createFallbackClient();
      }
    } else {
      console.error('Supabase client not initialized: supabase-js not loaded');
      // Create a fallback client
      this._createFallbackClient();
    }
  }
  
  /**
   * Create a fallback client that doesn't crash when methods are called
   * @private
   */
  _createFallbackClient() {
    // Create a minimal client that logs errors but doesn't crash
    this.client = {
      auth: {
        signInWithPassword: async () => {
          console.error('Supabase client not properly initialized. Authentication not available.');
          return { data: null, error: { message: 'Supabase client not initialized' } };
        },
        signOut: async () => {
          console.error('Supabase client not properly initialized. Authentication not available.');
          return { error: { message: 'Supabase client not initialized' } };
        },
        getSession: async () => {
          console.error('Supabase client not properly initialized. Authentication not available.');
          return { data: { session: null }, error: null };
        }
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase client not initialized' } })
          })
        })
      })
    };
  }
  
  /**
   * Restore session from localStorage if available
   * @private
   */
  _restoreSessionFromLocalStorage() {
    try {
      // Check if we have auth data in localStorage
      const authData = localStorage.getItem('ezEditAuth');
      
      if (authData) {
        // Parse auth data
        const parsedAuthData = JSON.parse(authData);
        
        // Check if we have session data
        if (parsedAuthData && parsedAuthData.session) {
          // Set session in Supabase client
          this.client.auth.setSession(parsedAuthData.session);
        }
      }
    } catch (error) {
      console.error('Error restoring session from localStorage:', error);
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - Whether user is authenticated
   */
  isAuthenticated() {
    try {
      const session = this.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }
  
  /**
   * Get current session
   * @returns {Object|null} - Current session or null if not authenticated
   */
  getSession() {
    try {
      if (!this.client) return null;
      
      // Try to get session from localStorage first (for faster access)
      const authData = localStorage.getItem('ezEditAuth');
      
      if (authData) {
        const parsedAuthData = JSON.parse(authData);
        
        if (parsedAuthData && parsedAuthData.session) {
          return parsedAuthData.session;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }
  
  /**
   * Get current session asynchronously - this is the preferred method
   * @returns {Promise<Object|null>} - Current session or null if not authenticated
   */
  async getSessionAsync() {
    try {
      if (!this.client) return null;
      
      const { data, error } = await this.client.auth.getSession();
      
      if (error) throw error;
      
      return data.session;
    } catch (error) {
      console.error('Error getting session async:', error);
      return null;
    }
  }
  
  /**
   * Get current user
   * @returns {Object|null} - Current user or null if not authenticated
   */
  getUser() {
    const session = this.getSession();
    return session ? session.user : null;
  }
  
  /**
   * Sign up with email and password
   * @param {Object} userData - User data
   * @param {string} userData.email - Email
   * @param {string} userData.password - Password
   * @param {Object} userData.metadata - Additional user metadata
   * @returns {Promise<Object>} - Sign up result
   */
  async signUp(userData) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    try {
      // Sign up with email and password
      const { data, error } = await this.client.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: userData.metadata || {} }
      });
      
      if (error) throw error;
      
      const { user, session } = data;
      
      // Store auth data in localStorage
      if (session) {
        localStorage.setItem('ezEditAuth', JSON.stringify({ user, session }));
      }
      
      // Create user profile in profiles table
      if (user) {
        try {
          await this._createUserProfile(user.id, userData.metadata || {});
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw here, we still want to return the user
        }
      }
      
      return { user, session, success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error.message || 'Failed to sign up', success: false };
    }
  }
  
  /**
   * Sign in with email and password (legacy method)
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise<Object>} - Sign in result
   * @deprecated Use signInWithPassword instead
   */
  async signIn(email, password) {
    return this.signInWithPassword(email, password);
  }
  
  /**
   * Sign in with email and password
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise<Object>} - Sign in result
   */
  async signInWithPassword(email, password) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    try {
      // Sign in with email and password
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      const { user, session } = data;
      
      // Store auth data in localStorage
      if (session) {
        localStorage.setItem('ezEditAuth', JSON.stringify({ user, session }));
      }
      
      // Get user profile from profiles table
      let profile = null;
      
      try {
        const { data: profileData } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        profile = profileData;
      } catch (profileError) {
        console.error('Error getting user profile:', profileError);
      }
      
      return { user, session, profile, success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error.message || 'Failed to sign in', success: false };
    }
  }
  
  /**
   * Sign in with a third-party provider (Google, GitHub, etc.)
   * @param {string} provider - Provider name (github, google, etc.)
   * @param {Object} options - Additional options for OAuth
   * @param {string} options.redirectTo - URL to redirect to after authentication
   * @param {string} options.scopes - Scopes to request from the provider
   * @returns {Promise<Object>} - OAuth sign in result
   */
  async signInWithProvider(provider, options = {}) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    try {
      const { redirectTo, scopes } = options;
      
      // Default scopes for Google
      const defaultScopes = {
        google: 'email profile'
      };
      
      const oauthOptions = {
        provider,
        options: {}
      };
      
      // Add redirect URL if provided or use default
      oauthOptions.options.redirectTo = redirectTo || window.location.origin + '/auth-callback.html';
      
      // Add scopes if provided or use defaults for Google
      if (provider === 'google') {
        oauthOptions.options.scopes = scopes || defaultScopes.google;
      }
      
      // Store the provider in localStorage for session recovery
      localStorage.setItem('ezEditSocialProvider', provider);
      
      const { data, error } = await this.client.auth.signInWithOAuth(oauthOptions);
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Sign in with provider error:', error);
      return { error: error.message || `Failed to sign in with ${provider}` };
    }
  }
  
  /**
   * Sign in with magic link
   * @param {string} email - Email
   * @returns {Promise<Object>} - Magic link result
   */
  async signInWithMagicLink(email) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    try {
      const { data, error } = await this.client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: this.config.authRedirectUrl
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Magic link error:', error);
      throw error;
    }
  }
  
  /**
   * Reset password
   * @param {string} email - Email
   * @param {Object} options - Options for password reset
   * @param {string} options.redirectTo - URL to redirect to after password reset
   * @returns {Promise} - Supabase response
   */
  async resetPassword(email, options = {}) {
    try {
      const { redirectTo } = options;
      const resetOptions = {};
      
      if (redirectTo) {
        resetOptions.redirectTo = redirectTo;
      }
      
      const { data, error } = await this.client.auth.resetPasswordForEmail(email, resetOptions);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
  
  /**
   * Sign out
   * @returns {Promise<Object>} - Sign out result
   */
  async signOut() {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    try {
      const { error } = await this.client.auth.signOut();
      
      if (error) throw error;
      
      // Clear local storage auth data
      localStorage.removeItem('ezEditAuth');
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error.message || 'Failed to sign out', success: false };
    }
  }
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} - Update result
   */
  async updateProfile(profileData) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Update user metadata
      const { error: metadataError } = await this.client.auth.updateUser({
        data: profileData
      });
      
      if (metadataError) throw metadataError;
      
      // Update profile in profiles table
      const { data, error } = await this.client
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          updated_at: new Date()
        });
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  /**
   * Get user sites
   * @returns {Promise<Array>} - User sites
   */
  async getSites() {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await this.client
        .from('sites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Get sites error:', error);
      throw error;
    }
  }
  
  /**
   * Get site by ID
   * @param {string} siteId - Site ID
   * @returns {Promise<Object>} - Site
   */
  async getSite(siteId) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await this.client
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Get site error:', error);
      throw error;
    }
  }
  
  /**
   * Add site
   * @param {Object} site - Site data
   * @returns {Promise<Object>} - Created site
   */
  async addSite(site) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    
    try {
      const siteData = {
        ...site,
        user_id: user.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { data, error } = await this.client
        .from('sites')
        .insert([siteData]);
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Add site error:', error);
      throw error;
    }
  }
  
  /**
   * Update site
   * @param {string} siteId - Site ID
   * @param {Object} site - Site data
   * @returns {Promise<Object>} - Updated site
   */
  async updateSite(siteId, site) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await this.client
        .from('sites')
        .update({
          ...site,
          updated_at: new Date()
        })
        .eq('id', siteId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Update site error:', error);
      throw error;
    }
  }
  
  /**
   * Delete site
   * @param {string} siteId - Site ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteSite(siteId) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error } = await this.client
        .from('sites')
        .delete()
        .eq('id', siteId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Delete site error:', error);
      throw error;
    }
  }
  
  /**
   * Create user profile in the profiles table
   * @param {string} userId - User ID
   * @param {Object} metadata - User metadata
   * @returns {Promise<Object>} - Created profile
   * @private
   */
  async _createUserProfile(userId, metadata) {
    if (!this.client) throw new Error('Supabase client not initialized');
    if (!userId) throw new Error('User ID is required');
    
    try {
      // Check if profile already exists
      const { data: existingProfile } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        console.log('User profile already exists, skipping creation');
        return existingProfile;
      }
      
      // Create new profile
      const { data, error } = await this.client
        .from('profiles')
        .insert([
          {
            id: userId,
            first_name: metadata?.firstName || '',
            last_name: metadata?.lastName || '',
            email: metadata?.email || '',
            avatar_url: '',
            plan: 'free-trial',
            trial_days_left: 7,
            signup_source: metadata?.signupSource || 'direct',
            trial_start_date: metadata?.trialStartDate || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Create user profile error:', error);
      throw error;
    }
  }
  
  /**
   * Update user subscription
   * @param {Object} subscription - Subscription data
   * @returns {Promise<Object>} - Updated subscription
   */
  async updateSubscription(subscription) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const user = this.getUser();
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Update profile with subscription data
      const { data, error } = await this.client
        .from('profiles')
        .update({
          plan: subscription.plan,
          trial_days_left: subscription.trialDaysLeft,
          subscription_id: subscription.subscriptionId,
          subscription_status: subscription.status,
          updated_at: new Date()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local storage auth data
      const authData = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
      if (authData.user) {
        authData.user.plan = subscription.plan;
        authData.user.trialDaysLeft = subscription.trialDaysLeft;
        localStorage.setItem('ezEditAuth', JSON.stringify(authData));
      }
      
      return data[0];
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  }
}

// Export the SupabaseService class
window.SupabaseService = SupabaseService;
