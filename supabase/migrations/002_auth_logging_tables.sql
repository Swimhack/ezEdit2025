-- Authentication Error Resolution and Application Logging Tables
-- Feature: 005-failed-to-fetch
-- Created: 2025-09-18

-- Add role column to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'developer', 'admin', 'superadmin'));

-- Add authentication tracking fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_locked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Authentication Requests Table
CREATE TABLE IF NOT EXISTS authentication_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  correlation_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('password', 'oauth_google')),
  operation TEXT NOT NULL CHECK (operation IN ('login', 'signup', 'password_reset')),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  session_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER, -- milliseconds
  success BOOLEAN NOT NULL,
  error_code TEXT,
  error_message TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Log Entries Table
CREATE TABLE IF NOT EXISTS error_log_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  correlation_id UUID NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  error_type TEXT,
  error_code TEXT,
  stack_trace TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id UUID,
  route TEXT,
  method TEXT,
  source TEXT CHECK (source IN ('frontend', 'backend', 'database', 'external')),
  context JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authentication Log Entries Table (Security Audit Trail)
CREATE TABLE IF NOT EXISTS authentication_log_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  correlation_id UUID NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event TEXT NOT NULL CHECK (event IN ('login_attempt', 'login_success', 'login_failure', 'logout', 'password_change', 'account_lockout')),
  method TEXT NOT NULL CHECK (method IN ('password', 'oauth_google', 'magic_link')),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  location TEXT,
  device_fingerprint TEXT,
  session_id UUID,
  duration INTEGER, -- milliseconds
  failure_reason TEXT,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log Access Sessions Table (Audit trail for log access)
CREATE TABLE IF NOT EXISTS log_access_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_key_id UUID, -- Reference to API keys if implemented
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  access_type TEXT NOT NULL CHECK (access_type IN ('session', 'api_key', 'token')),
  log_type TEXT CHECK (log_type IN ('error', 'authentication', 'access', 'performance')),
  filters JSONB DEFAULT '{}',
  record_count INTEGER DEFAULT 0,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  duration INTEGER, -- milliseconds
  exported BOOLEAN DEFAULT FALSE,
  export_format TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys Table (for external log access)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  role TEXT NOT NULL CHECK (role IN ('developer', 'admin', 'superadmin')),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_requests_correlation_id ON authentication_requests(correlation_id);
CREATE INDEX IF NOT EXISTS idx_auth_requests_user_timestamp ON authentication_requests(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_requests_timestamp ON authentication_requests(timestamp);

CREATE INDEX IF NOT EXISTS idx_error_logs_correlation_id ON error_log_entries(correlation_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_level_timestamp ON error_log_entries(level, timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_timestamp ON error_log_entries(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_log_entries(timestamp);

CREATE INDEX IF NOT EXISTS idx_auth_logs_user_event ON authentication_log_entries(user_id, event, timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON authentication_log_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_logs_correlation_id ON authentication_log_entries(correlation_id);

CREATE INDEX IF NOT EXISTS idx_log_access_user_type ON log_access_sessions(user_id, log_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_log_access_timestamp ON log_access_sessions(timestamp);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- Row Level Security Policies

-- Authentication Requests: Users can see their own, admins see all
DROP POLICY IF EXISTS "Users can view own auth requests" ON authentication_requests;
CREATE POLICY "Users can view own auth requests" ON authentication_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Error Logs: Role-based access
DROP POLICY IF EXISTS "Role-based error log access" ON error_log_entries;
CREATE POLICY "Role-based error log access" ON error_log_entries
  FOR SELECT USING (
    CASE
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin' THEN true
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' THEN true
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer' THEN
        user_id = auth.uid() OR user_id IS NULL
      ELSE user_id = auth.uid()
    END
  );

-- Authentication Logs: Admins and own logs only
DROP POLICY IF EXISTS "Auth logs access policy" ON authentication_log_entries;
CREATE POLICY "Auth logs access policy" ON authentication_log_entries
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Log Access Sessions: Users can see their own access
DROP POLICY IF EXISTS "Users can view own log access" ON log_access_sessions;
CREATE POLICY "Users can view own log access" ON log_access_sessions
  FOR SELECT USING (user_id = auth.uid());

-- API Keys: Users can manage their own keys
DROP POLICY IF EXISTS "Users can manage own API keys" ON api_keys;
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (user_id = auth.uid());

-- Enable RLS on all tables
ALTER TABLE authentication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE authentication_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_access_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create cleanup function for log retention
CREATE OR REPLACE FUNCTION cleanup_expired_logs()
RETURNS void AS $$
BEGIN
  -- Authentication logs: 12 months
  DELETE FROM authentication_requests
  WHERE timestamp < NOW() - INTERVAL '12 months';

  DELETE FROM authentication_log_entries
  WHERE timestamp < NOW() - INTERVAL '12 months';

  -- Error logs: 90 days (6 months for critical errors)
  DELETE FROM error_log_entries
  WHERE timestamp < NOW() - INTERVAL '90 days'
  AND level NOT IN ('error', 'fatal');

  DELETE FROM error_log_entries
  WHERE timestamp < NOW() - INTERVAL '6 months'
  AND level IN ('error', 'fatal');

  -- Access logs: 12 months
  DELETE FROM log_access_sessions
  WHERE timestamp < NOW() - INTERVAL '12 months';

  -- Cleanup revoked API keys older than 1 year
  DELETE FROM api_keys
  WHERE revoked_at IS NOT NULL
  AND revoked_at < NOW() - INTERVAL '12 months';

  RAISE NOTICE 'Log cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_logs() TO authenticated;

-- Insert function to track authentication events
CREATE OR REPLACE FUNCTION track_authentication_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Track password changes
  IF TG_OP = 'UPDATE' AND OLD.password_changed_at IS DISTINCT FROM NEW.password_changed_at THEN
    INSERT INTO authentication_log_entries (
      user_id, correlation_id, event, method, ip_address, user_agent
    ) VALUES (
      NEW.id, uuid_generate_v4(), 'password_change', 'password',
      COALESCE(current_setting('request.headers.x-forwarded-for', true), '127.0.0.1'),
      current_setting('request.headers.user-agent', true)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for authentication events
DROP TRIGGER IF EXISTS track_auth_events ON profiles;
CREATE TRIGGER track_auth_events
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION track_authentication_event();

-- Comments for documentation
COMMENT ON TABLE authentication_requests IS 'Tracks all authentication attempts with error context and correlation IDs';
COMMENT ON TABLE error_log_entries IS 'Application error logs with structured data and sanitization';
COMMENT ON TABLE authentication_log_entries IS 'Security audit trail for authentication events';
COMMENT ON TABLE log_access_sessions IS 'Audit trail for accessing application logs';
COMMENT ON TABLE api_keys IS 'API keys for external log access with role-based permissions';

COMMENT ON FUNCTION cleanup_expired_logs() IS 'Automated log cleanup based on retention policies (12mo auth, 90d errors)';
COMMENT ON FUNCTION track_authentication_event() IS 'Automatically tracks authentication events to audit log';