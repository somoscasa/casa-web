-- ============================================================
-- CASA — Phase 2/3/4 schema (Supabase)
-- Run in Supabase SQL editor. Idempotent-ish: safe to re-run.
-- ============================================================

create extension if not exists pgcrypto;

-- Clientes
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text,
  created_at timestamptz default now()
);

-- Eventos
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  type text check (type in ('boda', 'quince')),
  date date,
  package text,
  status text default 'pendiente',
  deposit_paid boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Galerías
-- Generador de códigos únicos de 4 dígitos (1000–9999) para galleries.access_token.
-- Reintenta si el código aleatorio ya está tomado.
create or replace function generate_unique_access_token()
returns text
language plpgsql
as $$
declare
  new_code text;
  attempt int := 0;
begin
  loop
    new_code := lpad((1000 + floor(random() * 9000))::text, 4, '0');
    if not exists (select 1 from galleries where access_token = new_code) then
      return new_code;
    end if;
    attempt := attempt + 1;
    if attempt >= 100 then
      raise exception 'No quedan códigos de 4 dígitos disponibles';
    end if;
  end loop;
end;
$$;

create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  title text,
  access_token text unique default generate_unique_access_token(),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Fotos
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references galleries(id) on delete cascade,
  storage_path text not null,
  original_filename text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Reservas (Fase 3)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  amount_total numeric,
  amount_deposit numeric,
  payment_id text,
  payment_status text default 'pending',
  created_at timestamptz default now()
);

-- Pedidos tienda (Fase 4)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  items jsonb,
  total numeric,
  payment_id text,
  payment_status text default 'pending',
  shipping_status text default 'pending',
  created_at timestamptz default now()
);

-- Mensajes de contacto (Fase 1 — opcional)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  event_date date,
  event_type text,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Storage bucket for client photos (Fase 2)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- ============================================================
-- RLS — tighten before production. Disabled here for setup.
-- ============================================================
-- alter table clients   enable row level security;
-- alter table events    enable row level security;
-- alter table galleries enable row level security;
-- alter table photos    enable row level security;
-- alter table bookings  enable row level security;
-- alter table orders    enable row level security;
-- alter table messages  enable row level security;
