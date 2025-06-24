/**
 * EzEdit Memory Service
 * Handles persistent storage of API keys, user preferences, and application state
 */

class MemoryService {
  constructor() {
    this.storageKey = 'ezEdit_memory';
    this.memory = this.loadMemory();
    
    // Default API keys (these would normally be stored securely)
    this.defaultKeys = {
      stripe: {
        publicKey: 'pk_test_your_stripe_key',
        priceIds: {
          oneTimeSite: 'price_oneTimeSite_$500',
          subPro: 'price_subPro_$100'
        }
      },
      resend: {
        apiKey: 'resend_api_key',
        fromEmail: 'noreply@ezedit.co'
      },
      openai: {
        apiKey: 'sk_openai_key',
        model: 'gpt-4'
      },
      digitalocean: {
        token: 'dop_v1_564c24ad179e903daf4b094b6f6fca57631431571ca54f618c9b8ef104cccf06'
      },
      supabase: {
        url: 'https://natjhcqynqziccsnwim.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdGpoY3F5bnF6aWNjc3Nud2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MzE0MTksImV4cCI6MjA2MTEwNzQxOX0.Gz1qQoD1Yxky5eIh2hyB_-mwd-HbFqSkh6jL54Aew4w'
      },
      ftp: {
        demoHost: 'ftp.test.rebex.net',
        demoUser: 'demo',
        demoPassword: 'password'
      }
    };
    
    // Initialize memory with defaults if empty
    this.initializeMemory();
  }

  /**
   * Load memory from localStorage
   * @returns {Object} - Memory object
   */
  loadMemory() {
    try {
      const memoryString = localStorage.getItem(this.storageKey);
      return memoryString ? JSON.parse(memoryString) : {};
    } catch (error) {
      console.error('Error loading memory:', error);
      return {};
    }
  }

  /**
   * Save memory to localStorage
   */
  saveMemory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.memory));
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  }

  /**
   * Initialize memory with defaults if empty
   */
  initializeMemory() {
    // Initialize API keys if not present
    if (!this.memory.apiKeys) {
      this.memory.apiKeys = this.defaultKeys;
    }
    
    // Initialize user preferences if not present
    if (!this.memory.preferences) {
      this.memory.preferences = {
        theme: 'light',
        editorFontSize: 14,
        editorTabSize: 2,
        editorWordWrap: true,
        aiAssistantEnabled: true,
        autoSaveEnabled: false,
        autoSaveInterval: 5 // minutes
      };
    }
    
    // Initialize recent sites if not present
    if (!this.memory.recentSites) {
      this.memory.recentSites = [];
    }
    
    // Initialize editor state if not present
    if (!this.memory.editorState) {
      this.memory.editorState = {
        lastOpenedFile: null,
        lastOpenedSite: null,
        expandedFolders: []
      };
    }
    
    // Save initialized memory
    this.saveMemory();
  }

  /**
   * Get API key
   * @param {string} service - Service name (stripe, resend, openai)
   * @returns {Object} - API key object
   */
  getApiKey(service) {
    return this.memory.apiKeys[service] || this.defaultKeys[service];
  }

  /**
   * Set API key
   * @param {string} service - Service name (stripe, resend, openai)
   * @param {Object} keyData - API key data
   */
  setApiKey(service, keyData) {
    this.memory.apiKeys[service] = keyData;
    this.saveMemory();
  }

  /**
   * Get user preference
   * @param {string} preference - Preference name
   * @returns {any} - Preference value
   */
  getPreference(preference) {
    return this.memory.preferences[preference];
  }

  /**
   * Set user preference
   * @param {string} preference - Preference name
   * @param {any} value - Preference value
   */
  setPreference(preference, value) {
    this.memory.preferences[preference] = value;
    this.saveMemory();
  }

  /**
   * Get all user preferences
   * @returns {Object} - All preferences
   */
  getAllPreferences() {
    return this.memory.preferences;
  }

  /**
   * Set all user preferences
   * @param {Object} preferences - All preferences
   */
  setAllPreferences(preferences) {
    this.memory.preferences = preferences;
    this.saveMemory();
  }

  /**
   * Add recent site
   * @param {Object} site - Site object
   */
  addRecentSite(site) {
    // Remove if already exists
    this.memory.recentSites = this.memory.recentSites.filter(s => s.id !== site.id);
    
    // Add to beginning of array
    this.memory.recentSites.unshift(site);
    
    // Limit to 10 recent sites
    if (this.memory.recentSites.length > 10) {
      this.memory.recentSites = this.memory.recentSites.slice(0, 10);
    }
    
    this.saveMemory();
  }

  /**
   * Get recent sites
   * @returns {Array} - Recent sites
   */
  getRecentSites() {
    return this.memory.recentSites;
  }

  /**
   * Set editor state
   * @param {Object} state - Editor state
   */
  setEditorState(state) {
    this.memory.editorState = { ...this.memory.editorState, ...state };
    this.saveMemory();
  }

  /**
   * Get editor state
   * @returns {Object} - Editor state
   */
  getEditorState() {
    return this.memory.editorState;
  }

  /**
   * Clear all memory
   */
  clearMemory() {
    localStorage.removeItem(this.storageKey);
    this.memory = {};
    this.initializeMemory();
  }
}

// Export the MemoryService class
window.MemoryService = MemoryService;
