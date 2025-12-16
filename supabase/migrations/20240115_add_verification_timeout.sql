-- Update verification status comment to include new statuses
comment on column public.realtor_profiles.reco_license_status is 
  'Status values: PENDING_VERIFICATION, ACTIVE, SUSPENDED, TERMINATED, EXPIRED, REVOKED, NOT_FOUND, VERIFICATION_FAILED, VERIFICATION_TIMEOUT, NO_BROKERAGE, UNKNOWN';

-- Add index for quick lookup of pending verifications (for auto-reject cron)
create index if not exists idx_pending_verification 
  on public.realtor_profiles(created_at) 
  where reco_license_status = 'PENDING_VERIFICATION';

