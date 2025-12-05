-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move vector extension to extensions schema
ALTER EXTENSION vector SET SCHEMA extensions;

-- Move pg_trgm extension to extensions schema  
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Update search_path to include extensions schema for all roles
ALTER DATABASE postgres SET search_path TO public, extensions;