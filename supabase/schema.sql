-- ... existing code ...

create policy "Tenants can insert appointments."
  on public.appointments for insert
  with check ( auth.uid() = tenant_user_id );

-- NEW: Allow Landlords to UPDATE appointments (Accept/Reject)
create policy "Landlords can update appointments for their listings."
  on public.appointments for update
  using ( exists (
    select 1 from public.listings
    join public.profiles on profiles.email = listings.contact_email
    where listings.id = appointments.listing_id
    and profiles.id = auth.uid()
  ));

-- TRIGGER: Handle New User Creation (Sync auth.users -> public.profiles)
-- ... existing code ...
