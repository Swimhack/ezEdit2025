-- Initial schema for ezEdit Supabase integration
-- This migration creates the necessary tables and security policies for authentication and site management

-- Enable pgcrypto extension for password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create profiles table to store user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  plan TEXT DEFAULT 'free-trial',
  trial_days_left INTEGER DEFAULT 7,
  trial_start_date TIMESTAMPTZ DEFAULT now(),
  signup_source TEXT,
  auth_provider TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sites table to store FTP site information
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 21,
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- Will be encrypted
  passive BOOLEAN DEFAULT true,
  root_path TEXT DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscriptions table to store subscription information
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create function to encrypt passwords
CREATE OR REPLACE FUNCTION encrypt_password() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR NEW.password <> OLD.password) THEN
    NEW.password = pgp_sym_encrypt(NEW.password, current_setting('app.settings.jwt_secret'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to encrypt passwords on insert or update
CREATE TRIGGER encrypt_site_password
  BEFORE INSERT OR UPDATE ON public.sites
  FOR EACH ROW EXECUTE PROCEDURE encrypt_password();

-- Create function to decrypt passwords
CREATE OR REPLACE FUNCTION decrypt_password(encrypted_password TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_password::bytea, current_setting('app.settings.jwt_secret'));
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update timestamps
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_sites_timestamp
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_subscriptions_timestamp
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for sites
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

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_sites_user_id ON public.sites (user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX idx_profiles_email ON public.profiles (email);

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE public.sites_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.subscriptions_id_seq TO authenticated;
