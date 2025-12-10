-- Security Fix: Clean up misleading RLS policies and clarify architecture
-- The application uses edge functions with service role keys for user data access
-- RLS policies should reflect this architecture accurately

-- ==========================================
-- Phase 1: Clean up misleading conversation policies
-- ==========================================
-- These policies reference app.session_id which is never set by the client
-- User conversations are accessed via edge functions, not direct DB queries

DROP POLICY IF EXISTS "Public can read own conversation" ON conversations;
DROP POLICY IF EXISTS "Public can update own conversation" ON conversations;

-- Add comment to clarify architecture
COMMENT ON TABLE conversations IS 'User conversations accessed via edge functions (service role). Direct DB access restricted to admins only.';

-- ==========================================
-- Phase 2: Add comment to clarify messages architecture
-- ==========================================
-- Messages are returned in edge function responses, not queried directly by users

COMMENT ON TABLE messages IS 'Messages accessed via edge function responses only. Direct DB access restricted to admins for moderation/analytics.';

-- ==========================================
-- Phase 3: Fix user_files RLS policies
-- ==========================================
-- Drop misleading validation-based policies that rely on unused config parameters

DROP POLICY IF EXISTS "Users can read own files with validation" ON user_files;
DROP POLICY IF EXISTS "Users can update own files with validation" ON user_files;
DROP POLICY IF EXISTS "Users can delete own files with validation" ON user_files;

-- User files are now stored locally (IndexedDB) and processed via edge functions
-- Only admins need direct DB access for monitoring

CREATE POLICY "Only admins can read user files"
ON user_files FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update user files"
ON user_files FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete user files"
ON user_files FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment to clarify architecture
COMMENT ON TABLE user_files IS 'User files stored locally in browser (IndexedDB). Metadata tracked here for admin analytics. Direct DB access restricted to admins.';

-- ==========================================
-- Phase 4: Add comment to user_visitors
-- ==========================================

COMMENT ON TABLE user_visitors IS 'Anonymous visitor tracking for analytics. Visitors created via edge functions. Direct read access restricted to admins.';