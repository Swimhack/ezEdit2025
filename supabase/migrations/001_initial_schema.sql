-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sites table
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain TEXT,
    subdomain TEXT UNIQUE NOT NULL,
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create memberships table
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, site_id)
);

-- Create content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('page', 'post', 'program', 'media')),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    access_level TEXT DEFAULT 'public',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, slug)
);

-- Create AI prompts table for tracking
CREATE TABLE ai_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    result JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_sites_org ON sites(org_id);
CREATE INDEX idx_sites_subdomain ON sites(subdomain);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_site ON memberships(site_id);
CREATE INDEX idx_content_site ON content(site_id);
CREATE INDEX idx_content_slug ON content(site_id, slug);
CREATE INDEX idx_ai_prompts_user ON ai_prompts(user_id);
CREATE INDEX idx_ai_prompts_site ON ai_prompts(site_id);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Users can view organizations they own" ON organizations
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own organizations" ON organizations
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own organizations" ON organizations
    FOR DELETE USING (owner_id = auth.uid());

-- Sites policies
CREATE POLICY "Users can view sites in their organizations" ON sites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = sites.org_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create sites in their organizations" ON sites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = sites.org_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sites in their organizations" ON sites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = sites.org_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sites in their organizations" ON sites
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = sites.org_id
            AND organizations.owner_id = auth.uid()
        )
    );

-- Memberships policies
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Site owners can view site memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sites
            JOIN organizations ON organizations.id = sites.org_id
            WHERE sites.id = memberships.site_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Site owners can manage site memberships" ON memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sites
            JOIN organizations ON organizations.id = sites.org_id
            WHERE sites.id = memberships.site_id
            AND organizations.owner_id = auth.uid()
        )
    );

-- Content policies
CREATE POLICY "Public content is viewable by all" ON content
    FOR SELECT USING (published = true AND access_level = 'public');

CREATE POLICY "Members can view member content" ON content
    FOR SELECT USING (
        published = true AND
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.site_id = content.site_id
            AND memberships.user_id = auth.uid()
            AND memberships.status = 'active'
        )
    );

CREATE POLICY "Site owners can manage content" ON content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sites
            JOIN organizations ON organizations.id = sites.org_id
            WHERE sites.id = content.site_id
            AND organizations.owner_id = auth.uid()
        )
    );

-- AI prompts policies
CREATE POLICY "Users can view own prompts" ON ai_prompts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create prompts" ON ai_prompts
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('avatars', 'avatars', true),
    ('site-assets', 'site-assets', true),
    ('content-media', 'content-media', false)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Site assets are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'site-assets');

CREATE POLICY "Site owners can manage site assets" ON storage.objects
    FOR ALL USING (
        bucket_id = 'site-assets' AND
        EXISTS (
            SELECT 1 FROM sites
            JOIN organizations ON organizations.id = sites.org_id
            WHERE sites.id::text = (storage.foldername(name))[1]
            AND organizations.owner_id = auth.uid()
        )
    );