-- Add RECO verification fields to realtor_profiles
alter table public.realtor_profiles 
  add column if not exists reco_registration_number text unique,
  add column if not exists reco_license_status text default 'PENDING_VERIFICATION',
  add column if not exists reco_license_type text,
  add column if not exists reco_brokerage_name text,
  add column if not exists reco_verified_at timestamp with time zone,
  add column if not exists reco_verification_source text default 'RECO Public Register',
  add column if not exists reco_last_checked timestamp with time zone,
  add column if not exists reco_full_name text;

-- Create index on RECO registration number for fast lookups
create unique index if not exists idx_realtor_reco_number 
  on public.realtor_profiles(reco_registration_number) 
  where reco_registration_number is not null;

-- Add verification status enum comment for clarity
comment on column public.realtor_profiles.reco_license_status is 
  'Status values: PENDING_VERIFICATION, ACTIVE, SUSPENDED, TERMINATED, EXPIRED, REVOKED, NOT_FOUND, VERIFICATION_FAILED';

-- Function to check if a realtor can operate (only ACTIVE status)
create or replace function public.is_realtor_active(realtor_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.realtor_profiles 
    where id = realtor_id 
    and reco_license_status = 'ACTIVE'
  );
$$ language sql stable;

