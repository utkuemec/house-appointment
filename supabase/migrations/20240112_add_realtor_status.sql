-- Add status column to track realtor assignment state
alter table public.listings 
add column if not exists realtor_status text 
check (realtor_status in ('pending', 'accepted', 'declined')) 
default null;


