-- VetSoft - Appointment attachments (PDFs, images for medical studies)
-- Run AFTER 001, 002, 003
-- Create bucket 'appointment-attachments' in Supabase Dashboard → Storage if not exists

create table if not exists appointment_attachments (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  appointment_id bigint references appointments(id) on delete cascade not null,
  file_url text not null,
  file_name text not null,
  file_type text default '',
  created_at timestamptz default now()
);

alter table appointment_attachments enable row level security;

create policy "Users can manage own appointment_attachments"
  on appointment_attachments for all using (auth.uid() = user_id);

create index appointment_attachments_appointment_id_idx on appointment_attachments(appointment_id);
