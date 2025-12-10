-- Add SELECT policy so users can read their own conversations by session_id
CREATE POLICY "Public can read own conversation" 
ON public.conversations 
FOR SELECT 
USING (session_id = current_setting('app.session_id', true));