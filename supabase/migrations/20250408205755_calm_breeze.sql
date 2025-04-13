/*
  # Update Suppliers RLS Policies

  1. Changes
    - Enable RLS on suppliers table if not already enabled
    - Add policies for authenticated users if they don't exist:
      - Create new suppliers
      - View their own suppliers
      - Update their own suppliers
      - Delete their own suppliers

  2. Security
    - All policies are scoped to the user's own data
    - Policies ensure users can only access and modify their own suppliers
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'suppliers' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Create policy
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'suppliers' 
    AND policyname = 'Users can create suppliers'
  ) THEN
    CREATE POLICY "Users can create suppliers"
    ON suppliers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- View policy
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'suppliers' 
    AND policyname = 'Users can view their own suppliers'
  ) THEN
    CREATE POLICY "Users can view their own suppliers"
    ON suppliers FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'suppliers' 
    AND policyname = 'Users can update their own suppliers'
  ) THEN
    CREATE POLICY "Users can update their own suppliers"
    ON suppliers FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'suppliers' 
    AND policyname = 'Users can delete their own suppliers'
  ) THEN
    CREATE POLICY "Users can delete their own suppliers"
    ON suppliers FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;