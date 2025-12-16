-- Update unique constraint handling in profiles
-- Drop the strict constraint first to avoid issues with incomplete signups
alter table public.profiles drop constraint if exists profiles_phone_key;

-- Re-add it but ensure it ignores nulls (if not already)
alter table public.profiles add constraint profiles_phone_key unique (phone);

-- IMPORTANT: Update the trigger to handle conflicts gracefully (UPSERT logic)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, phone, city)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city'
  )
  on conflict (id) do update
  set 
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    city = excluded.city;
  return new;
end;
$$ language plpgsql security definer;

