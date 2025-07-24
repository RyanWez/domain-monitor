-- Create domain groups table
CREATE TABLE IF NOT EXISTS domain_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add group_id to domains table
ALTER TABLE domains ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES domain_groups(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_domains_group_id ON domains(group_id);