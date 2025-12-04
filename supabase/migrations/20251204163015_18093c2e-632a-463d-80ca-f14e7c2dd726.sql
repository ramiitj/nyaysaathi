-- Create storage bucket for user-uploaded files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user_files', 'user_files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user_files bucket
CREATE POLICY "Anyone can upload user files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user_files');

CREATE POLICY "Anyone can read user files" ON storage.objects
  FOR SELECT USING (bucket_id = 'user_files');

CREATE POLICY "Anyone can delete user files" ON storage.objects  
  FOR DELETE USING (bucket_id = 'user_files');

-- Create user_files table to track uploads
CREATE TABLE public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES public.user_visitors(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  analysis_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_files
CREATE POLICY "Public can insert user files" ON public.user_files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read user files" ON public.user_files
  FOR SELECT USING (true);

CREATE POLICY "Public can update own user files" ON public.user_files
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete user files" ON public.user_files
  FOR DELETE USING (true);

CREATE POLICY "Admins can manage all user files" ON public.user_files
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));