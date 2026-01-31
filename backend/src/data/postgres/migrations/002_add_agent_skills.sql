-- Add missing skills column to agents table

ALTER TABLE agents ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
