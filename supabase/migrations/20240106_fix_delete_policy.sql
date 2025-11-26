-- Allow Landlords to DELETE their own listings
create policy "Landlords can delete their own listings."
  on public.listings for delete
  using ( contact_email = (select email from public.profiles where id = auth.uid()) );

