-- Add columns for advanced filtering
alter table public.listings add column if not exists bedrooms integer;
alter table public.listings add column if not exists bathrooms numeric;
alter table public.listings add column if not exists sqft integer;

