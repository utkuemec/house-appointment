-- Add listing_type column with a default of 'rent' for existing rows
alter table public.listings add column if not exists listing_type text check (listing_type in ('rent', 'sale')) default 'rent';

