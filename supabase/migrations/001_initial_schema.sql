-- VetSoft Supabase Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- Clients table: stores pet owner information
-- user_id links data to the authenticated user (RLS)
create table clients (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text not null default '',
  notes text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pets table: stores pet/patient information
create table pets (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id bigint references clients(id) on delete cascade not null,
  name text not null,
  species text not null check (species in ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other')),
  breed text not null default '',
  gender text not null check (gender in ('male', 'female', 'unknown')),
  birth_date text not null default '',
  weight numeric not null default 0,
  color text not null default '',
  microchip_id text not null default '',
  photo_url text not null default '',
  notes text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Appointments table: stores vet appointments
create table appointments (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pet_id bigint references pets(id) on delete cascade not null,
  client_id bigint references clients(id) on delete cascade not null,
  date text not null,
  time text not null,
  duration integer not null default 30,
  type text not null check (type in ('consultation', 'vaccination', 'surgery', 'grooming', 'emergency', 'follow-up')),
  status text not null check (status in ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')),
  veterinarian text not null default '',
  notes text not null default '',
  google_calendar_event_id text,
  email_sent boolean default false,
  reminder_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Settings table: app configuration per user
create table settings (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value text not null default '',
  unique(user_id, key)
);

-- Row Level Security (RLS): users can only access their own data
alter table clients enable row level security;
alter table pets enable row level security;
alter table appointments enable row level security;
alter table settings enable row level security;

-- RLS policies for clients
create policy "Users can view own clients" on clients for select using (auth.uid() = user_id);
create policy "Users can insert own clients" on clients for insert with check (auth.uid() = user_id);
create policy "Users can update own clients" on clients for update using (auth.uid() = user_id);
create policy "Users can delete own clients" on clients for delete using (auth.uid() = user_id);

-- RLS policies for pets
create policy "Users can view own pets" on pets for select using (auth.uid() = user_id);
create policy "Users can insert own pets" on pets for insert with check (auth.uid() = user_id);
create policy "Users can update own pets" on pets for update using (auth.uid() = user_id);
create policy "Users can delete own pets" on pets for delete using (auth.uid() = user_id);

-- RLS policies for appointments
create policy "Users can view own appointments" on appointments for select using (auth.uid() = user_id);
create policy "Users can insert own appointments" on appointments for insert with check (auth.uid() = user_id);
create policy "Users can update own appointments" on appointments for update using (auth.uid() = user_id);
create policy "Users can delete own appointments" on appointments for delete using (auth.uid() = user_id);

-- RLS policies for settings
create policy "Users can view own settings" on settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on settings for update using (auth.uid() = user_id);
create policy "Users can delete own settings" on settings for delete using (auth.uid() = user_id);

-- Indexes for common queries
create index clients_user_id_idx on clients(user_id);
create index clients_email_idx on clients(email);
create index pets_user_id_idx on pets(user_id);
create index pets_client_id_idx on pets(client_id);
create index appointments_user_id_idx on appointments(user_id);
create index appointments_date_idx on appointments(date);
create index appointments_client_id_idx on appointments(client_id);
create index appointments_pet_id_idx on appointments(pet_id);
create index settings_user_id_idx on settings(user_id);
