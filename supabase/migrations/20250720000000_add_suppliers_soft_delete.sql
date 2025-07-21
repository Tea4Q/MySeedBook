/*
  # Add soft delete support to suppliers table

  1. Changes
    - Add deleted_at column to suppliers table
    - Update existing queries to filter out soft-deleted suppliers by default

  2. Notes
    - This allows suppliers to be soft-deleted instead of hard-deleted
    - Maintains referential integrity while allowing "deletion" of suppliers
    - Consistent with seeds table soft delete approach
*/

-- Add deleted_at column to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Create index for better performance when filtering soft-deleted suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at ON suppliers(deleted_at);

-- Update RLS policies to exclude soft-deleted suppliers by default
DROP POLICY IF EXISTS "Users can view their own suppliers" ON suppliers;
CREATE POLICY "Users can view their own suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Note: Other policies (insert, update, delete) remain unchanged
-- as they already check user ownership
