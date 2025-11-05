-- ============================================================================
-- Quote Requests Table - Complete Setup
-- ============================================================================
-- This migration creates the quote_requests table and all necessary 
-- dependencies. It can be run independently without requiring other tables.
-- 
-- Run this in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run" or press Ctrl+Enter
-- ============================================================================

-- Step 1: Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create update_updated_at function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT NOT NULL,
    message TEXT NOT NULL,
    customer_email TEXT,
    submitted_by UUID, -- Optional reference to profiles(id) if profiles table exists
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'quoted', 'accepted', 'declined', 'completed')),
    admin_notes TEXT,
    quoted_price NUMERIC(10,2),
    quoted_timeline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Add foreign key constraint only if profiles table exists
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

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_domain ON quote_requests(domain);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_email ON quote_requests(customer_email) WHERE customer_email IS NOT NULL;

-- Step 6: Enable Row Level Security
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage quote requests" ON quote_requests;

-- Allow service role full access (for API operations)
CREATE POLICY "Service role can manage quote requests" ON quote_requests
    FOR ALL USING (true);

-- Allow authenticated users to view their own quote requests (if profiles table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Drop policy if exists
        DROP POLICY IF EXISTS "Users can view own quote requests" ON quote_requests;
        
        -- Create policy for users to view their own requests
        CREATE POLICY "Users can view own quote requests" ON quote_requests
            FOR SELECT USING (
                submitted_by IS NOT NULL AND 
                submitted_by = auth.uid()
            );
    END IF;
END $$;

-- Step 8: Create update trigger
DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER update_quote_requests_updated_at
    BEFORE UPDATE ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Step 9: Add table and column comments for documentation
COMMENT ON TABLE quote_requests IS 'Customer quote requests submitted from the home page quote form';
COMMENT ON COLUMN quote_requests.id IS 'Unique identifier for the quote request';
COMMENT ON COLUMN quote_requests.domain IS 'Customer website domain (e.g., example.com)';
COMMENT ON COLUMN quote_requests.message IS 'Customer message describing needed changes (max 2000 characters)';
COMMENT ON COLUMN quote_requests.customer_email IS 'Optional customer email address';
COMMENT ON COLUMN quote_requests.submitted_by IS 'Optional reference to user who submitted (if authenticated)';
COMMENT ON COLUMN quote_requests.status IS 'Request status: pending, reviewed, quoted, accepted, declined, completed';
COMMENT ON COLUMN quote_requests.admin_notes IS 'Internal admin notes about the quote request';
COMMENT ON COLUMN quote_requests.quoted_price IS 'Quoted price in dollars (e.g., 500.00)';
COMMENT ON COLUMN quote_requests.quoted_timeline IS 'Estimated timeline for completion (e.g., "2-3 weeks")';
COMMENT ON COLUMN quote_requests.created_at IS 'Timestamp when the quote request was created';
COMMENT ON COLUMN quote_requests.updated_at IS 'Timestamp when the quote request was last updated';

-- ============================================================================
-- Verification Queries (optional - uncomment to verify setup)
-- ============================================================================
-- SELECT 'quote_requests table created successfully' AS status;
-- SELECT COUNT(*) AS table_exists FROM pg_tables WHERE tablename = 'quote_requests';
-- SELECT COUNT(*) AS indexes_count FROM pg_indexes WHERE tablename = 'quote_requests';
-- SELECT COUNT(*) AS policies_count FROM pg_policies WHERE tablename = 'quote_requests';

