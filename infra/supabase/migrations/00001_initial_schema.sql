-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create websites table
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(website_id, path)
);

-- Create edits table
CREATE TABLE IF NOT EXISTS edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE edits ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Websites policies
CREATE POLICY "Users can view their own websites" ON websites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own websites" ON websites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own websites" ON websites
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own websites" ON websites
  FOR DELETE USING (auth.uid() = user_id);

-- Pages policies
CREATE POLICY "Users can view pages of their websites" ON pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = pages.website_id
      AND websites.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create pages for their websites" ON pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = pages.website_id
      AND websites.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update pages of their websites" ON pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = pages.website_id
      AND websites.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete pages of their websites" ON pages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = pages.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Edits policies
CREATE POLICY "Users can view edits of their pages" ON edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN websites ON websites.id = pages.website_id
      WHERE pages.id = edits.page_id
      AND websites.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create edits for their pages" ON edits
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM pages
      JOIN websites ON websites.id = pages.website_id
      WHERE pages.id = edits.page_id
      AND websites.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own edits" ON edits
  FOR UPDATE USING (
    auth.uid() = user_id
  );
CREATE POLICY "Users can delete their own edits" ON edits
  FOR DELETE USING (
    auth.uid() = user_id
  );
