/*
  # Add Storage Policies for Image Uploads

  1. Changes
    - Create storage bucket if it doesn't exist
    - Enable RLS on storage.objects
    - Add policies for authenticated users to:
      - Upload images to their folder
      - View/download their uploaded images
      - Update their uploaded images
      - Delete their uploaded images

  2. Security
    - All policies are scoped to authenticated users
    - Users can only access files in their own folder structure
*/

-- Create storage buckets for images if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('seed-images', 'seed-images', true),
  ('supplier-images', 'supplier-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('seed-images', 'supplier-images') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to view/download their own images
CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id IN ( 'seed-images', 'supplier-images') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to update their own images
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id IN ('seed-images', 'supplier-images') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id IN ( 'seed-images', 'supplier-images') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Alternative simpler policies if you want all authenticated users to access all images
-- (comment out the above policies and uncomment these if preferred)

/*
-- Allow authenticated users to upload any image
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('images', 'seed-images', 'supplier-images'));

-- Allow authenticated users to view any image
CREATE POLICY "Authenticated users can view images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id IN ('images', 'seed-images', 'supplier-images'));

-- Allow authenticated users to update any image
CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id IN ('images', 'seed-images', 'supplier-images'));

-- Allow authenticated users to delete any image
CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id IN ('images', 'seed-images', 'supplier-images'));
*/
