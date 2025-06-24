/**
 * EzEdit Mock Supabase Client
 * Simulates Supabase authentication for local testing without network requests
 */

class MockSupabaseClient {
  constructor() {
    this.auth = {
      // Mock sign in with password
      signInWithPassword: async ({ email, password }) => {
        console.log('Mock signInWithPassword called with:', { email, password });
        
        // Simulate successful login for test@example.com/password123
        if (email === 'test@example.com' && password === 'password123') {
          const mockUser = {
            id: 'mock-user-id-123',
            email: email,
            user_metadata: {
              firstName: 'Test',
              lastName: 'User'
            }
          };
          
          const mockSession = {
            access_token: 'mock-token-' + Date.now(),
            expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          };
          
          // Store in localStorage for persistence
          localStorage.setItem('ezEditAuth', JSON.stringify({
            isAuthenticated: true,
            user: {
              id: mockUser.id,
              email: mockUser.email,
              firstName: mockUser.user_metadata.firstName,
              lastName: mockUser.user_metadata.lastName,
              plan: 'free-trial',
              trialDaysLeft: 7
            },
            token: mockSession.access_token,
            expiresAt: mockSession.expires_at
          }));
          
          return {
            data: {
              user: mockUser,
              session: mockSession
            },
            error: null
          };
        } else {
          // Simulate login failure
          return {
            data: { user: null, session: null },
            error: {
              message: 'Invalid login credentials'
            }
          };
        }
      },
      
      // Mock sign out
      signOut: async () => {
        console.log('Mock signOut called');
        localStorage.removeItem('ezEditAuth');
        return { error: null };
      },
      
      // Mock get session
      getSession: async () => {
        console.log('Mock getSession called');
        const authData = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
        
        if (authData.token && authData.expiresAt > Date.now()) {
          return {
            data: {
              session: {
                access_token: authData.token,
                expires_at: authData.expiresAt
              }
            },
            error: null
          };
        }
        
        return {
          data: { session: null },
          error: null
        };
      },
      
      // Mock sign up
      signUp: async ({ email, password, options }) => {
        console.log('Mock signUp called with:', { email, password, options });
        
        // Always simulate successful signup
        const mockUser = {
          id: 'new-user-id-' + Date.now(),
          email: email,
          user_metadata: options?.data || {}
        };
        
        const mockSession = {
          access_token: 'mock-token-' + Date.now(),
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        // Store in localStorage
        localStorage.setItem('ezEditAuth', JSON.stringify({
          isAuthenticated: true,
          user: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.user_metadata.firstName || 'New',
            lastName: mockUser.user_metadata.lastName || 'User',
            plan: 'free-trial',
            trialDaysLeft: 7
          },
          token: mockSession.access_token,
          expiresAt: mockSession.expires_at
        }));
        
        return {
          data: {
            user: mockUser,
            session: mockSession
          },
          error: null
        };
      },
      
      // Mock update user
      updateUser: async (updates) => {
        console.log('Mock updateUser called with:', updates);
        
        const authData = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
        if (!authData.user) {
          return {
            data: { user: null },
            error: { message: 'User not authenticated' }
          };
        }
        
        // Update user data
        const updatedUser = {
          ...authData.user,
          ...updates.data
        };
        
        // Update localStorage
        authData.user = updatedUser;
        localStorage.setItem('ezEditAuth', JSON.stringify(authData));
        
        return {
          data: { user: updatedUser },
          error: null
        };
      }
    };
    
    // Mock database operations
    this.from = (table) => {
      return {
        select: (columns) => {
          return {
            eq: (column, value) => {
              return {
                single: async () => {
                  console.log(`Mock database query: SELECT ${columns} FROM ${table} WHERE ${column} = ${value}`);
                  
                  // Mock profile data
                  if (table === 'profiles') {
                    return {
                      data: {
                        id: 'mock-user-id-123',
                        first_name: 'Test',
                        last_name: 'User',
                        plan: 'free-trial',
                        trial_days_left: 7
                      },
                      error: null
                    };
                  }
                  
                  // Mock sites data
                  if (table === 'sites') {
                    return {
                      data: [
                        {
                          id: 'mock-site-1',
                          name: 'My Test Site',
                          host: 'ftp.test.rebex.net',
                          username: 'demo',
                          password: 'password',
                          port: 21,
                          passive: true
                        }
                      ],
                      error: null
                    };
                  }
                  
                  return { data: null, error: null };
                }
              };
            },
            
            // For general queries
            async execute() {
              console.log(`Mock database query: SELECT ${columns} FROM ${table}`);
              
              if (table === 'profiles') {
                return {
                  data: {
                    count: 1
                  },
                  error: null
                };
              }
              
              return { data: [], error: null };
            }
          };
        },
        
        // Count query
        select: (countParam, options) => {
          if (countParam === 'count') {
            return {
              async execute() {
                console.log(`Mock count query on ${table}`);
                return { data: { count: 1 }, error: null };
              }
            };
          }
          
          return { data: null, error: null };
        }
      };
    };
  }
}

// Export mock Supabase creator
window.mockSupabase = {
  createClient: (url, key) => {
    console.log('Creating mock Supabase client instead of connecting to:', url);
    return new MockSupabaseClient();
  }
};
