-- ContextAI Database Schema - Auth Fields Migration
-- Adds authentication capabilities to agents table

-- Add password_hash column to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make email unique and not null for authentication
ALTER TABLE agents 
ALTER COLUMN email SET NOT NULL;

ALTER TABLE agents 
ADD CONSTRAINT agents_email_unique UNIQUE (email);

-- Create index on email for faster login lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
