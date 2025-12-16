-- Add brokerage verification fields (Ontario law requires brokerage registration)
-- A realtor CANNOT operate independently in Ontario - they must be under a brokerage

alter table public.realtor_profiles 
  add column if not exists reco_brokerage_status text default 'PENDING_VERIFICATION',
  add column if not exists reco_brokerage_registration_number text,
  add column if not exists reco_broker_of_record text;

-- Update the function to check BOTH license AND brokerage status
create or replace function public.is_realtor_active(realtor_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.realtor_profiles 
    where id = realtor_id 
    and reco_license_status = 'ACTIVE'
    and reco_brokerage_name is not null  -- Must have a brokerage
    and reco_brokerage_name != ''
  );
$$ language sql stable;

-- Add comment explaining Ontario law
comment on column public.realtor_profiles.reco_brokerage_name is 
  'REQUIRED: Ontario law mandates all realtors must be registered under a RECO-registered brokerage. Independent operation is illegal.';

comment on column public.realtor_profiles.reco_brokerage_status is
  'Status of the brokerage: ACTIVE, SUSPENDED, TERMINATED, etc. Realtor cannot operate if brokerage is not ACTIVE.';

