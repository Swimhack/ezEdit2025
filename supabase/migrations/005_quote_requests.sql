-- Quote Requests Table
-- Stores customer quote requests submitted from the home page

-- Ensure uuid-ossp extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT NOT NULL,
    message TEXT NOT NULL,
    customer_email TEXT,
    submitted_by UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'quoted', 'accepted', 'declined', 'completed')),
    admin_notes TEXT,
    quoted_price NUMERIC(10,2),
    quoted_timeline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint only if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Add foreign key constraint if profiles table exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'quote_requests_submitted_by_fkey'
        ) THEN
            ALTER TABLE quote_requests 
            ADD CONSTRAINT quote_requests_submitted_by_fkey 
            FOREIGN KEY (submitted_by) REFERENCES profiles(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_domain ON quote_requests(domain);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Service role can manage all quote requests
DROP POLICY IF EXISTS "Service role can manage quote requests" ON quote_requests;
CREATE POLICY "Service role can manage quote requests" ON quote_requests
    FOR ALL USING (true);

-- Ensure update_updated_at function exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER update_quote_requests_updated_at
    BEFORE UPDATE ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Comments for documentation
COMMENT ON TABLE quote_requests IS 'Customer quote requests submitted from the home page';
COMMENT ON COLUMN quote_requests.domain IS 'Customer website domain';
COMMENT ON COLUMN quote_requests.message IS 'Customer message describing needed changes';
COMMENT ON COLUMN quote_requests.status IS 'Request status: pending, reviewed, quoted, accepted, declined, completed';
