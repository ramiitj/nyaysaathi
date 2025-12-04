-- Create user_visitors table for tracking unique visitors
CREATE TABLE public.user_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash TEXT NOT NULL UNIQUE,
  ip_hash TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  location_data JSONB DEFAULT '{}'::jsonb,
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_visit_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  visit_count INTEGER DEFAULT 1,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add visitor_id to conversations table
ALTER TABLE public.conversations ADD COLUMN visitor_id UUID REFERENCES public.user_visitors(id);

-- Create index for fast fingerprint lookups
CREATE INDEX idx_user_visitors_fingerprint ON public.user_visitors(fingerprint_hash);
CREATE INDEX idx_conversations_visitor_id ON public.conversations(visitor_id);

-- Enable RLS
ALTER TABLE public.user_visitors ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_visitors
CREATE POLICY "Public can create visitor records"
ON public.user_visitors
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update own visitor record"
ON public.user_visitors
FOR UPDATE
USING (true);

CREATE POLICY "Public can read own visitor record"
ON public.user_visitors
FOR SELECT
USING (true);

CREATE POLICY "Admins can view all visitors"
ON public.user_visitors
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage visitors"
ON public.user_visitors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_user_visitors_updated_at
BEFORE UPDATE ON public.user_visitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();