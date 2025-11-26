-- Make source_url unique to prevent duplicate listings from external sources
alter table public.listings add constraint listings_source_url_key unique (source_url);

