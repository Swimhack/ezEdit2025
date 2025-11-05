-- Create contact_submissions table for pitch deck contact forms
-- Drop table if it exists with wrong schema (safely recreate)
DROP TABLE IF EXISTS contact_submissions CASCADE;

CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    investor_type TEXT CHECK (investor_type IN ('angel', 'vc', 'strategic', 'family_office', 'other')),
    message TEXT,
interested_sections JSONB DEFAULT '[]',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    followup_status TEXT DEFAULT 'pending' CHECK (followup_status IN ('pending', 'contacted', 'responded', 'closed', 'spam')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON contact_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_followup_status ON contact_submissions(followup_status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_investor_type ON contact_submissions(investor_type);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow service role to insert (for API submissions)
CREATE POLICY "Service role can insert contact submissions" ON contact_submissions
    FOR INSERT 
    WITH CHECK (true);

-- Allow service role to read all submissions (for admin dashboard)
CREATE POLICY "Service role can read all contact submissions" ON contact_submissions
    FOR SELECT 
    USING (true);

-- Allow service role to update submissions (for admin updates)
CREATE POLICY "Service role can update contact submissions" ON contact_submissions
    FOR UPDATE 
    USING (true);

-- Create update timestamp trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update timestamp trigger
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

