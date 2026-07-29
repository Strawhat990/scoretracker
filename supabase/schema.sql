-- ============================================================
-- MBA Grade Tracker — Supabase Schema
-- Device-based, account-less auth with 6-digit cross-device sync
-- ============================================================

-- 1. PROFILES
-- A profile represents one "dataset" of marks. Multiple devices can
-- point at the same profile once they've been linked via a sync code.
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  created_date date not null default current_date,
  created_time varchar(5) not null default to_char(now(), 'HH24:MI'),
  name text,
  reg_no text
);

-- 2. DEVICES
-- Every browser/device that opens the app gets a row here the first
-- time it loads, generated from a locally-stored device id (uuid).
create table if not exists devices (
  device_id uuid primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists devices_profile_id_idx on devices(profile_id);

-- 3. SYNC CODES
-- Short-lived 6-digit codes used to link a second device to an
-- existing profile. Codes expire after 10 minutes and are single-use.
create table if not exists sync_codes (
  code text primary key check (char_length(code) = 6),
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  used_at timestamptz
);

create index if not exists sync_codes_profile_id_idx on sync_codes(profile_id);

-- 4. SUBJECTS
-- Seeded once with the 6 Trimester-1 subjects. Kept in its own table
-- (rather than hardcoded) so codes/names can be edited without a
-- frontend redeploy, and so future trimesters can be added.
create table if not exists subjects (
  code text primary key,           -- e.g. 'MBA131'
  short_name text not null,        -- e.g. 'A/C'
  full_name text not null,         -- e.g. 'Financial Accounting for Managers'
  sort_order int not null default 0
);

insert into subjects (code, short_name, full_name, sort_order) values
  ('MBA131', 'A/C',  'Financial Accounting for Managers',        1),
  ('MBA132', 'ME',   'Managerial Economics',                     2),
  ('MBA133', 'MM',   'Marketing Management',                     3),
  ('MBA134', 'SFB',  'Statistics for Business',                  4),
  ('MBA135', 'OB',   'Organizational Behaviour',                 5),
  ('MBA136', 'MDBS', 'Management of Digital Business Systems',   6)
on conflict (code) do nothing;

-- 5. MARKS
-- One row per (profile, subject). Raw inputs are stored; totals are
-- computed application-side (see lib/grading.ts) so the scaling rule
-- (End Sem /50 -> /30) lives in one place and is easy to audit/change.
create table if not exists marks (
  profile_id uuid not null references profiles(id) on delete cascade,
  subject_code text not null references subjects(code) on delete cascade,
  cia1 numeric(4,1),              -- out of 15
  cia2 numeric(4,1),              -- out of 25 (mid sem)
  class_participation numeric(4,1), -- out of 15
  mcq1 numeric(4,1),              -- Optional MCQ inputs for specific subjects
  mcq2 numeric(4,1),
  mcq3 numeric(4,1),
  mcq4 numeric(4,1),
  mcq5 numeric(4,1),
  cia3 numeric(4,1),              -- out of 15
  end_sem numeric(4,1),           -- out of 50 (raw, scaled to /30 in app)
  updated_at timestamptz not null default now(),
  primary key (profile_id, subject_code)
);

-- ============================================================
-- Row Level Security
-- This app has no real user auth, so access is gated entirely by
-- knowledge of a device_id / profile_id (treated like a bearer
-- token). The anon key is used client-side. Because there's no
-- auth.uid() to key off, RLS here is intentionally permissive for
-- the anon role and the app is responsible for only ever querying
-- by a profile_id it legitimately holds (from local storage).
-- If you need stronger guarantees, put these calls behind a
-- server route (see lib/supabase.ts comments) instead of calling
-- Supabase directly from the browser.
-- ============================================================

alter table profiles enable row level security;
alter table devices enable row level security;
alter table sync_codes enable row level security;
alter table subjects enable row level security;
alter table marks enable row level security;

create policy "anon full access - profiles" on profiles
  for all using (true) with check (true);

create policy "anon full access - devices" on devices
  for all using (true) with check (true);

create policy "anon full access - sync_codes" on sync_codes
  for all using (true) with check (true);

create policy "anon read - subjects" on subjects
  for select using (true);

create policy "anon full access - marks" on marks
  for all using (true) with check (true);

-- ============================================================
-- Helper function: link a device to a profile via a 6-digit code.
-- Called via supabase.rpc('redeem_sync_code', { p_code, p_device_id })
-- Returns the profile_id the device is now linked to, or null if
-- the code is invalid/expired/used.
-- ============================================================
create or replace function redeem_sync_code(p_code text, p_device_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_profile_id uuid;
begin
  select profile_id into v_profile_id
  from sync_codes
  where code = p_code
    and used_at is null
    and expires_at > now();

  if v_profile_id is null then
    return null;
  end if;

  update sync_codes set used_at = now() where code = p_code;

  update devices
  set profile_id = v_profile_id, last_seen_at = now()
  where device_id = p_device_id;

  return v_profile_id;
end;
$$;

-- ============================================================
-- Helper function: generate a fresh, unused 6-digit code for a
-- profile. Called via supabase.rpc('create_sync_code', { p_profile_id })
-- ============================================================
create or replace function create_sync_code(p_profile_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := lpad(floor(random() * 1000000)::text, 6, '0');
    select exists(
      select 1 from sync_codes
      where code = v_code and expires_at > now() and used_at is null
    ) into v_exists;
    exit when not v_exists;
  end loop;

  insert into sync_codes (code, profile_id) values (v_code, p_profile_id);
  return v_code;
end;
$$;
