-- Create Storage Bucket for Listing Images
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true);

-- Policy: Anyone can view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'listings' );

-- Policy: Authenticated users can upload images
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'listings' and auth.role() = 'authenticated' );

