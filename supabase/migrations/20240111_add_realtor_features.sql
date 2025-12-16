-- Create Realtor Profiles table
create table if not exists public.realtor_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  license_number text not null,
  license_url text not null,
  is_verified boolean default false,
  hourly_rate numeric,
  broker_since date,
  languages text[],
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.realtor_profiles enable row level security;

-- Policies
create policy "Realtor profiles are viewable by everyone."
  on public.realtor_profiles for select
  using ( true );

create policy "Users can create their own realtor profile."
  on public.realtor_profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own realtor profile."
  on public.realtor_profiles for update
  using ( auth.uid() = id );

-- Add assigned_realtor column to listings
alter table public.listings add column if not exists assigned_realtor_id uuid references public.realtor_profiles(id);

-- Create Storage Bucket for Licenses (Private)
insert into storage.buckets (id, name, public)
values ('licenses', 'licenses', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own license
create policy "Authenticated Upload License"
  on storage.objects for insert
  with check ( bucket_id = 'licenses' and auth.role() = 'authenticated' );

-- Allow users to read their own license (and maybe admins, but for now owner is enough)
create policy "Owners read own license"
  on storage.objects for select
  using ( bucket_id = 'licenses' and auth.uid() = owner );


