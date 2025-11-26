-- Allow authenticated users to INSERT their own listings
create policy "Users can create their own listings."
  on public.listings for insert
  with check ( 
    auth.role() = 'authenticated' 
    and 
    contact_email = (select email from auth.users where id = auth.uid())
  );

