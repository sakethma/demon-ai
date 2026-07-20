-- Enable the pgvector extension for storing and querying vector embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Conversations Table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TYPE role_type AS ENUM ('user', 'assistant', 'system', 'tool');

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role role_type NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory Nodes Table (Long Term Context)
CREATE TABLE public.memory_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept TEXT NOT NULL,
    embedding vector(768), -- Assuming 768 dimensions for standard embedding models
    metadata JSONB,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime Configuration
-- Allow clients to listen to changes on these tables for instant cross-device sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_nodes;

-- Row Level Security (RLS)
-- For a local-first/single-user desktop app context, we might keep it open or require anon key.
-- Assuming single-tenant or authenticated usage, we'd normally lock this down.
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_nodes ENABLE ROW LEVEL SECURITY;

-- Creating basic policies (assuming single-user local proxy usage for now)
CREATE POLICY "Allow all access" ON public.conversations FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.memory_nodes FOR ALL USING (true);
