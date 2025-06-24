/**
 * EzEdit Configuration
 * Contains application configuration and environment variables
 * 
 * IMPORTANT: In a production environment, sensitive values should be:
 * 1. Stored as environment variables on the server
 * 2. Never exposed to the client directly
 * 3. Accessed only through secure API endpoints
 */

const EzEditConfig = {
  // API endpoints
  api: {
    base: '/api.php',
    ftp: '/api.php?action=ftp',
    ai: '/api.php?action=ai'
  },
  
  // Feature flags
  features: {
    aiAssistant: true,
    livePreview: true,
    collaborativeEditing: false, // Coming soon
    ftpSftp: true,
    darkMode: true
  },
  
  // Default editor settings
  editor: {
    theme: 'vs',
    darkTheme: 'vs-dark',
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    minimap: false,
    lineNumbers: true,
    formatOnSave: true
  },
  
  // Subscription plans
  plans: {
    freeTrial: {
      name: 'Free Trial',
      durationDays: 7,
      features: {
        viewAndPreview: true,
        saveAndPublish: false,
        maxSites: 3,
        aiQueries: 10
      }
    },
    pro: {
      name: 'Pro',
      price: 50,
      billingPeriod: 'month',
      features: {
        viewAndPreview: true,
        saveAndPublish: true,
        maxSites: Infinity,
        aiQueries: Infinity,
        teamMembers: 3
      }
    },
    oneTime: {
      name: 'Single Site',
      price: 500,
      billingPeriod: 'one-time',
      features: {
        viewAndPreview: true,
        saveAndPublish: true,
        maxSites: 1,
        aiQueries: 50,
        teamMembers: 0
      }
    }
  },
  
  // Memory keys
  memoryKeys: {
    apiKeys: 'ezEdit_apiKeys',
    userPreferences: 'ezEdit_preferences',
    recentSites: 'ezEdit_recentSites',
    editorState: 'ezEdit_editorState',
    authState: 'ezEditAuth'
  },
  
  // Default API keys (these would normally be stored securely)
  // IMPORTANT: These are placeholders and should be replaced with actual keys in a secure manner
  apiKeys: {
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
    supabase: {
      url: 'https://natjhcqynqziccsnwim.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdGpoY3F5bnF6aWNjc3Nud2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MzE0MTksImV4cCI6MjA2MTEwNzQxOX0.Gz1qQoD1Yxky5eIh2hyB_-mwd-HbFqSkh6jL54Aew4w'
    }
  }
};

// Make config available globally
window.EzEditConfig = EzEditConfig;
