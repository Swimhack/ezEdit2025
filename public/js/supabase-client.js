/**
 * EzEdit.co Supabase Client Configuration
 * Handles Supabase authentication and database operations
 */

class SupabaseClient {
    constructor() {
        // These will be loaded from server-side config
        this.supabaseUrl = null;
        this.supabaseKey = null;
        this.client = null;
        this.user = null;
        
        this.initializeConfig();
    }
    
    async initializeConfig() {
        try {
            // Load Supabase configuration from server
            const response = await fetch('/api/config.php');
            const config = await response.json();
            
            if (config.supabase_url && config.supabase_anon_key) {
                this.supabaseUrl = config.supabase_url;
                this.supabaseKey = config.supabase_anon_key;
                
                // Initialize Supabase client
                this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
                
                // Check current user
                await this.getCurrentUser();
                
                // Set up auth state listener
                this.setupAuthListener();
                
                console.log('Supabase client initialized successfully');
            } else {
                console.warn('Supabase configuration not available');
            }
        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
        }
    }
    
    async getCurrentUser() {
        if (!this.client) return null;
        
        try {
            const { data: { user }, error } = await this.client.auth.getUser();
            if (error) throw error;
            
            this.user = user;
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
    
    setupAuthListener() {
        if (!this.client) return;
        
        this.client.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN') {
                this.user = session?.user || null;
                this.onSignIn(session);
            } else if (event === 'SIGNED_OUT') {
                this.user = null;
                this.onSignOut();
            }
        });
    }
    
    async signUp(email, password, metadata = {}) {
        if (!this.client) throw new Error('Supabase client not initialized');
        
        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        
        if (error) throw error;
        return data;
    }
    
    async signIn(email, password) {
        if (!this.client) throw new Error('Supabase client not initialized');
        
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    }
    
    async signOut() {
        if (!this.client) throw new Error('Supabase client not initialized');
        
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
    }
    
    async resetPassword(email) {
        if (!this.client) throw new Error('Supabase client not initialized');
        
        const { data, error } = await this.client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password.php`
        });
        
        if (error) throw error;
        return data;
    }
    
    // Database operations
    async getFTPConnections() {
        if (!this.client || !this.user) throw new Error('User not authenticated');
        
        const { data, error } = await this.client
            .from('ftp_connections')
            .select('*')
            .eq('user_id', this.user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
    
    async saveFTPConnection(connection) {
        if (!this.client || !this.user) throw new Error('User not authenticated');
        
        const connectionData = {
            ...connection,
            user_id: this.user.id,
            updated_at: new Date().toISOString()
        };
        
        if (connection.id) {
            // Update existing connection
            const { data, error } = await this.client
                .from('ftp_connections')
                .update(connectionData)
                .eq('id', connection.id)
                .eq('user_id', this.user.id)
                .select();
            
            if (error) throw error;
            return data[0];
        } else {
            // Create new connection
            const { data, error } = await this.client
                .from('ftp_connections')
                .insert([connectionData])
                .select();
            
            if (error) throw error;
            return data[0];
        }
    }
    
    async deleteFTPConnection(connectionId) {
        if (!this.client || !this.user) throw new Error('User not authenticated');
        
        const { error } = await this.client
            .from('ftp_connections')
            .delete()
            .eq('id', connectionId)
            .eq('user_id', this.user.id);
        
        if (error) throw error;
    }
    
    // Event handlers (override in your app)
    onSignIn(session) {
        console.log('User signed in:', session);
        // Redirect to dashboard or update UI
        if (window.location.pathname.includes('/auth/')) {
            window.location.href = '/dashboard.html';
        }
    }
    
    onSignOut() {
        console.log('User signed out');
        // Clear session and redirect to home
        if (!window.location.pathname.includes('/auth/') && 
            !window.location.pathname.includes('/index.html') &&
            window.location.pathname !== '/') {
            window.location.href = '/index.html';
        }
    }
    
    // Utility methods
    isAuthenticated() {
        return !!this.user;
    }
    
    getUser() {
        return this.user;
    }
    
    getClient() {
        return this.client;
    }
}

// Global instance
window.supabaseClient = new SupabaseClient();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseClient;
}