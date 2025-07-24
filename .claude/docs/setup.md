# EzEdit.co Development Setup

## Prerequisites

### Server Requirements
- PHP 8.0 or higher
- Web server (Apache/Nginx)
- FTP extension enabled
- SSL/TLS support recommended

### External Services
- Supabase account and project
- Claude API key (Anthropic)
- Domain with SSL certificate

## Environment Configuration

### Required Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI Configuration
CLAUDE_API_KEY=your_claude_api_key

# Application Configuration
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost

# Security
SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_encryption_key
```

### Supabase Setup
1. Create new Supabase project
2. Set up authentication providers
3. Create user profiles table
4. Configure RLS policies

### Database Schema
```sql
-- User profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FTP connections table
CREATE TABLE ftp_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    port INTEGER DEFAULT 21,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Development Workflow

### Local Development
1. Clone repository
2. Set up environment variables
3. Configure web server
4. Test FTP functionality
5. Verify Supabase connection

### Deployment
1. Upload files to production server
2. Set environment variables
3. Configure web server
4. Test all functionality
5. Monitor logs for issues

## File Structure
```
/
├── .claude/              # Documentation and configuration
├── public/               # Web accessible files
│   ├── index.php        # Main entry point
│   ├── editor.php       # Code editor interface
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript files
│   └── api/             # API endpoints
├── config/              # Configuration files
└── docs/                # Additional documentation
```