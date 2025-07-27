-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'single', 'unlimited');
CREATE TYPE connection_protocol AS ENUM ('ftp', 'sftp');
CREATE TYPE file_type AS ENUM ('file', 'directory');
CREATE TYPE change_type AS ENUM ('create', 'update', 'delete');
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FTP Connections table
CREATE TABLE IF NOT EXISTS public.ftp_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 21,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    protocol connection_protocol DEFAULT 'ftp',
    is_active BOOLEAN DEFAULT true,
    last_connected TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File nodes table (for file tree structure)
CREATE TABLE IF NOT EXISTS public.file_nodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    connection_id UUID REFERENCES public.ftp_connections(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    type file_type NOT NULL,
    size BIGINT,
    modified TIMESTAMP WITH TIME ZONE NOT NULL,
    parent_id UUID REFERENCES public.file_nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(connection_id, path)
);

-- Edit history table
CREATE TABLE IF NOT EXISTS public.edit_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    connection_id UUID REFERENCES public.ftp_connections(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    change_type change_type NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    language TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    context JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ftp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- FTP Connections policies
CREATE POLICY "Users can manage own FTP connections" ON public.ftp_connections
    FOR ALL USING (auth.uid() = user_id);

-- File nodes policies
CREATE POLICY "Users can access files from own connections" ON public.file_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ftp_connections
            WHERE ftp_connections.id = file_nodes.connection_id
            AND ftp_connections.user_id = auth.uid()
        )
    );

-- Edit history policies
CREATE POLICY "Users can view own edit history" ON public.edit_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own edit history" ON public.edit_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Conversations policies
CREATE POLICY "Users can manage own conversations" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id);

-- AI Messages policies
CREATE POLICY "Users can access messages from own conversations" ON public.ai_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
            AND ai_conversations.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ftp_connections_user_id ON public.ftp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_file_nodes_connection_id ON public.file_nodes(connection_id);
CREATE INDEX IF NOT EXISTS idx_file_nodes_parent_id ON public.file_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_nodes_path ON public.file_nodes(path);
CREATE INDEX IF NOT EXISTS idx_edit_history_user_id ON public.edit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_connection_id ON public.edit_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_timestamp ON public.edit_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ftp_connections_updated_at BEFORE UPDATE ON public.ftp_connections
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_file_nodes_updated_at BEFORE UPDATE ON public.file_nodes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();