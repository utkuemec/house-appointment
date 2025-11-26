-- Add unique constraint to phone number in profiles
alter table public.profiles add constraint profiles_phone_key unique (phone);

