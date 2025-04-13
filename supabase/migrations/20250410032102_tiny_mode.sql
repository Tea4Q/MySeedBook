/*
  # Reset and Update Seed Inventory System

  1. Changes
    - Drop existing seed data
    - Add new constraints and indexes
    - Update RLS policies

  2. Security
    - Enable RLS on seeds table
    - Add policies for authenticated users
*/

-- First, safely remove existing seed data
TRUNCATE TABLE seeds;

-- Add missing constraints if they don't exist
DO $$ 
BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'seeds_supplier_id_fkey'
  ) THEN
    ALTER TABLE seeds
    ADD CONSTRAINT seeds_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL;
  END IF;

  -- Add user_id foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'seeds_user_id_fkey'
  ) THEN
    ALTER TABLE seeds
    ADD CONSTRAINT seeds_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies
CREATE POLICY "Users can view their own seeds"
ON seeds FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seeds"
ON seeds FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seeds"
ON seeds FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seeds"
ON seeds FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seeds_user_id ON seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_seeds_supplier_id ON seeds(supplier_id);
CREATE INDEX IF NOT EXISTS idx_seeds_name ON seeds(name);
