-- VetSoft Full Schema - Medical history, vaccines, pricing
-- Run AFTER 001 and 002

-- Ensure extended pet columns exist
alter table pets add column if not exists height numeric default 0;
alter table pets add column if not exists treatment text default '';
alter table pets add column if not exists last_surgery text default '';
alter table pets add column if not exists allergies text default '';
alter table pets add column if not exists medical_notes text default '';

-- Medical record per appointment (historial médico)
create table if not exists medical_records (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  appointment_id bigint references appointments(id) on delete cascade not null,
  pet_id bigint references pets(id) on delete cascade not null,
  symptoms text default '',
  diagnosis text default '',
  treatment text default '',
  notes text default '',
  created_at timestamptz default now()
);

-- Vaccine tracking per pet
create table if not exists vaccines (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pet_id bigint references pets(id) on delete cascade not null,
  name text not null,
  date_administered text not null,
  next_due_date text default '',
  notes text default '',
  created_at timestamptz default now()
);

-- Default prices for appointment types (in settings)
-- We use the settings table with keys like: price_consultation, price_vaccination, etc.

-- RLS for new tables
alter table medical_records enable row level security;
alter table vaccines enable row level security;

create policy "Users can manage own medical_records" on medical_records for all using (auth.uid() = user_id);
create policy "Users can manage own vaccines" on vaccines for all using (auth.uid() = user_id);

create index medical_records_appointment_id_idx on medical_records(appointment_id);
create index medical_records_pet_id_idx on medical_records(pet_id);
create index vaccines_pet_id_idx on vaccines(pet_id);
