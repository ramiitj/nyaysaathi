
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.conversation_status AS ENUM ('open', 'resolved');
CREATE TYPE public.document_status AS ENUM ('pending', 'processing', 'processed', 'failed');
CREATE TYPE public.log_level AS ENUM ('info', 'warning', 'error');

-- 2. User Roles Table (Security Foundation)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Conversations Table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    language TEXT NOT NULL DEFAULT 'en',
    status conversation_status DEFAULT 'open',
    use_for_training BOOLEAN DEFAULT false,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    legal_domain TEXT,
    location_city TEXT,
    location_state TEXT,
    ip_hash TEXT,
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create conversations" ON public.conversations 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Public can update own conversation" ON public.conversations 
  FOR UPDATE TO anon, authenticated 
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "Admins can view all conversations" ON public.conversations 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update conversations" ON public.conversations 
  FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_language ON public.conversations(language);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

-- 4. Messages Table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    audio_url TEXT,
    citations JSONB,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create messages" ON public.messages 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Admins can view all messages" ON public.messages 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- 5. Documents Table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    status document_status DEFAULT 'pending',
    topics_extracted JSONB DEFAULT '[]',
    rules_extracted JSONB DEFAULT '[]',
    chunk_count INTEGER DEFAULT 0,
    processed_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage documents" ON public.documents 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_documents_status ON public.documents(status);

-- 6. Document Embeddings Table (RAG)
CREATE TABLE public.document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage embeddings" ON public.document_embeddings 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read embeddings for RAG" ON public.document_embeddings 
  FOR SELECT TO anon, authenticated 
  USING (true);

CREATE INDEX idx_document_embeddings_document ON public.document_embeddings(document_id);

-- 7. Legal Acts Table
CREATE TABLE public.legal_acts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT,
    year INTEGER,
    sections JSONB,
    is_active BOOLEAN DEFAULT true,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.legal_acts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read legal acts" ON public.legal_acts 
  FOR SELECT TO anon, authenticated 
  USING (true);

CREATE POLICY "Admins can manage legal acts" ON public.legal_acts 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_legal_acts_category ON public.legal_acts(category);

-- 8. System Settings Table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read non-sensitive settings" ON public.system_settings 
  FOR SELECT TO anon, authenticated 
  USING (key NOT LIKE 'secret_%');

CREATE POLICY "Admins can manage all settings" ON public.system_settings 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. System Logs Table
CREATE TABLE public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level log_level DEFAULT 'info',
    action TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON public.system_logs 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs" ON public.system_logs 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs(level);

-- 10. Analytics Events Table
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    language TEXT,
    legal_domain TEXT,
    location_state TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics" ON public.analytics_events 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert events" ON public.analytics_events 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- 11. Dashboard Stats Function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_consultations', (SELECT COUNT(*) FROM conversations),
    'active_today', (SELECT COUNT(*) FROM conversations WHERE DATE(created_at) = CURRENT_DATE),
    'documents_uploaded', (SELECT COUNT(*) FROM documents WHERE status = 'processed'),
    'languages_used', (SELECT COUNT(DISTINCT language) FROM conversations)
  ) INTO result;
  RETURN result;
END;
$$;

-- 12. Analytics Data Function
CREATE OR REPLACE FUNCTION public.get_analytics_data(days_back INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'language_distribution', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', language, 'value', cnt)), '[]'::jsonb)
      FROM (
        SELECT language, COUNT(*) as cnt 
        FROM conversations 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY language 
        ORDER BY cnt DESC 
        LIMIT 6
      ) t
    ),
    'domain_distribution', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', legal_domain, 'value', cnt)), '[]'::jsonb)
      FROM (
        SELECT COALESCE(legal_domain, 'General') as legal_domain, COUNT(*) as cnt 
        FROM conversations 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY legal_domain 
        ORDER BY cnt DESC 
        LIMIT 6
      ) t
    ),
    'daily_consultations', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'consultations', cnt)), '[]'::jsonb)
      FROM (
        SELECT TO_CHAR(created_at, 'Dy') as day, COUNT(*) as cnt 
        FROM conversations 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY DATE(created_at), TO_CHAR(created_at, 'Dy')
        ORDER BY DATE(created_at)
      ) t
    ),
    'state_distribution', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('state', location_state, 'users', cnt)), '[]'::jsonb)
      FROM (
        SELECT COALESCE(location_state, 'Unknown') as location_state, COUNT(*) as cnt 
        FROM conversations 
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY location_state 
        ORDER BY cnt DESC 
        LIMIT 5
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- 13. Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_acts_updated_at BEFORE UPDATE ON public.legal_acts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;

-- 15. Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Admins can upload documents" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view documents" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documents" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
