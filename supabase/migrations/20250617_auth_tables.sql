-- Create profiles table to store user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free-trial',
  trial_days_left INTEGER DEFAULT 7,
  subscription_id TEXT,
  subscription_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sites table to store FTP site information
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 21,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  passive BOOLEAN DEFAULT TRUE,
  secure BOOLEAN DEFAULT FALSE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deployments table to track Digital Ocean deployments
CREATE TABLE IF NOT EXISTS public.deployments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'droplet', 'app', 'space'
  name TEXT NOT NULL,
  resource_id TEXT NOT NULL, -- Digital Ocean resource ID
  status TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create files table to track edited files
CREATE TABLE IF NOT EXISTS public.files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  path TEXT NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, path)
);

-- Create RLS policies
-- Profiles: Users can only read/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Sites: Users can only CRUD their own sites
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sites"
  ON public.sites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sites"
  ON public.sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites"
  ON public.sites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites"
  ON public.sites FOR DELETE
  USING (auth.uid() = user_id);

-- Deployments: Users can only CRUD their own deployments
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deployments"
  ON public.deployments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployments"
  ON public.deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments"
  ON public.deployments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deployments"
  ON public.deployments FOR DELETE
  USING (auth.uid() = user_id);

-- Files: Users can only CRUD their own files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own files"
  ON public.files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON public.files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON public.files FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to encrypt FTP passwords
CREATE OR REPLACE FUNCTION encrypt_password() RETURNS TRIGGER AS $$
BEGIN
  -- Only encrypt if the password is being set or changed
  IF TG_OP = 'INSERT' OR NEW.password <> OLD.password THEN
    -- Use pgcrypto extension to encrypt password with a secret key
    -- In a real implementation, you would use a secure key management system
    NEW.password = pgp_sym_encrypt(NEW.password, current_setting('app.settings.jwt_secret'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically encrypt passwords
CREATE TRIGGER encrypt_site_password
  BEFORE INSERT OR UPDATE ON public.sites
  FOR EACH ROW EXECUTE PROCEDURE encrypt_password();

-- Create function to decrypt FTP passwords
CREATE OR REPLACE FUNCTION decrypt_password(encrypted_password TEXT) RETURNS TEXT AS $$
BEGIN
  -- Use pgcrypto extension to decrypt password with the same secret key
  RETURN pgp_sym_decrypt(encrypted_password::bytea, current_setting('app.settings.jwt_secret'));
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
