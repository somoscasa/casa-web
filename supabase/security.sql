-- Locks every table against the public (anon) key.
-- The website reads and writes only through the server's service role key,
-- which bypasses RLS, so no policies are needed.
alter table public.clients          enable row level security;
alter table public.events           enable row level security;
alter table public.galleries        enable row level security;
alter table public.photos           enable row level security;
alter table public.collections      enable row level security;
alter table public.photo_favorites  enable row level security;
alter table public.gallery_views    enable row level security;
alter table public.bookings         enable row level security;
alter table public.orders           enable row level security;
alter table public.messages         enable row level security;
