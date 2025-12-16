-- Ensure tenants can view/select the appointments they just created
create policy "Tenants can see their own appointments"
  on public.appointments for select
  using ( auth.uid() = tenant_user_id );

-- Ensure the insert policy is permissive enough (already correct, but good to verify)
-- drop policy "Tenants can insert appointments." on public.appointments;
-- create policy "Tenants can insert appointments."
--   on public.appointments for insert
--   with check ( auth.uid() = tenant_user_id );

