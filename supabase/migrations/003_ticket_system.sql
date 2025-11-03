-- Ticket System Tables
-- Feature: Ticket submission with platform detection and credential management
-- Created: 2025-01-XX

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  domain TEXT NOT NULL,
  has_existing_website BOOLEAN NOT NULL DEFAULT true,
  detected_platform TEXT CHECK (detected_platform IN ('wordpress', 'shopify', 'wix', 'ftp', 'sftp', 'unknown')),
  platform_confidence NUMERIC CHECK (platform_confidence >= 0 AND platform_confidence <= 1),
  detection_method TEXT CHECK (detection_method IN ('api', 'custom', 'manual')),
  request_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'admin_review', 'quoted', 'customer_accepted', 'in_progress', 'completed', 'cancelled')),
  quoted_price NUMERIC,
  quoted_timeline TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Ticket credentials table (encrypted fields)
CREATE TABLE IF NOT EXISTS ticket_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('ftp', 'sftp', 'wordpress_api', 'shopify_api', 'wix_api')),
  host TEXT, -- encrypted
  port INTEGER,
  username TEXT, -- encrypted
  password TEXT, -- encrypted
  api_key TEXT, -- encrypted
  api_secret TEXT, -- encrypted
  path TEXT,
  encrypted_data JSONB, -- Stores encrypted fields: {host, username, password, api_key, api_secret}
  encrypted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('customer', 'admin')),
  author_email TEXT, -- For customer comments when not logged in
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform detections cache table
CREATE TABLE IF NOT EXISTS platform_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE,
  detected_platform TEXT,
  detection_data JSONB DEFAULT '{}',
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_domain ON tickets(domain);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_submitted_by ON tickets(submitted_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_credentials_ticket_id ON ticket_credentials(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_detections_domain ON platform_detections(domain);
CREATE INDEX IF NOT EXISTS idx_platform_detections_last_checked ON platform_detections(last_checked);

-- Update timestamp trigger for tickets
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security Policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_detections ENABLE ROW LEVEL SECURITY;

-- Tickets policies: Customers can see their own tickets, admins see all
CREATE POLICY "Customers can view own tickets" ON tickets
  FOR SELECT USING (
    customer_email = (SELECT email FROM profiles WHERE id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Public can create tickets" ON tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update tickets" ON tickets
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can delete tickets" ON tickets
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Ticket credentials policies: Only admins can view
CREATE POLICY "Admins can view credentials" ON ticket_credentials
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Public can create credentials with ticket" ON ticket_credentials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update credentials" ON ticket_credentials
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can delete credentials" ON ticket_credentials
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Ticket comments policies: Customers can see non-internal comments for their tickets, admins see all
CREATE POLICY "Users can view ticket comments" ON ticket_comments
  FOR SELECT USING (
    is_internal = false OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND tickets.customer_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Public can create comments" ON ticket_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update comments" ON ticket_comments
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can delete comments" ON ticket_comments
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Platform detections policies: Public read, admins write
CREATE POLICY "Public can view platform detections" ON platform_detections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage platform detections" ON platform_detections
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Comments for documentation
COMMENT ON TABLE tickets IS 'Customer ticket submissions with platform detection and request details';
COMMENT ON TABLE ticket_credentials IS 'Encrypted credentials for accessing customer websites (FTP, API keys, etc.)';
COMMENT ON TABLE ticket_comments IS 'Comments and notes on tickets from customers and admins';
COMMENT ON TABLE platform_detections IS 'Cache for domain platform detection results to reduce API calls';

