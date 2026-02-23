-- VetSoft Extended Schema: Pet care, payments, inventory
-- Run this AFTER 001_initial_schema.sql

-- Add extended pet care fields
alter table pets add column if not exists height numeric default 0;
alter table pets add column if not exists treatment text default '';
alter table pets add column if not exists last_surgery text default '';
alter table pets add column if not exists allergies text default '';
alter table pets add column if not exists medical_notes text default '';

-- Add payment fields to appointments
alter table appointments add column if not exists total_amount numeric default 0;
alter table appointments add column if not exists amount_paid numeric default 0;

-- Inventory: medications and clinic items
create table if not exists inventory (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('medication', 'item')),
  description text default '',
  quantity integer not null default 0,
  unit text default 'unit',
  price numeric not null default 0,
  photo_url text default '',
  sku text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Items sold per appointment (medications/items linked to appointment)
create table if not exists sale_items (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  appointment_id bigint references appointments(id) on delete cascade not null,
  inventory_id bigint references inventory(id) on delete restrict not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  created_at timestamptz default now()
);

-- RLS for new tables
alter table inventory enable row level security;
alter table sale_items enable row level security;

create policy "Users can manage own inventory" on inventory for all using (auth.uid() = user_id);
create policy "Users can manage own sale_items" on sale_items for all using (auth.uid() = user_id);

create index inventory_user_id_idx on inventory(user_id);
create index sale_items_appointment_id_idx on sale_items(appointment_id);
