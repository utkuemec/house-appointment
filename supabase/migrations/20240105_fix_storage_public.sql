-- Ensure the 'listings' bucket is public
update storage.buckets
set public = true
where id = 'listings';

-- Drop existing policies to avoid conflicts if re-running
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;

-- Allow ANYONE to view images in the 'listings' bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'listings' );

-- Allow AUTHENTICATED users to upload images
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'listings' and auth.role() = 'authenticated' );

