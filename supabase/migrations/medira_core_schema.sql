-- Medication AI — full backend schema (applied to project bjxhnkwgtnkxyotzdzcw).
-- Reproducible: run this on a fresh project to recreate the database.

-- ===== enums =====
create type public.med_form    as enum ('tablet','capsule','syrup','injection','cream','drops','other');
create type public.dose_slot   as enum ('morning','afternoon','night','custom');
create type public.dose_status as enum ('pending','taken','skipped');
create type public.med_source  as enum ('scan','manual');
create type public.contact_kind as enum ('doctor','family','other');

-- ===== tables =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, age int, gender text,
  breakfast time default '08:00', lunch time default '13:00', dinner time default '19:30',
  default_tune text default 'chime', snooze_min int not null default 30,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text, raw_json jsonb, doctor text, clinic text, med_count int default 0,
  scanned_at timestamptz not null default now()
);

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prescription_id uuid references public.prescriptions(id) on delete set null,
  name text not null, strength text, form public.med_form not null default 'tablet',
  instruction text, color text, icon text default 'pill',
  per_day text not null default '', times text[] not null default '{}',
  duration_text text, stock_weeks numeric, course_day int, course_total int,
  source public.med_source not null default 'manual', reminders_on boolean not null default true,
  tune text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.doses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  due_at timestamptz not null, slot public.dose_slot not null default 'custom',
  status public.dose_status not null default 'pending', taken_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.sos_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text, relation text, phone text, kind public.contact_kind not null default 'family',
  is_primary boolean not null default false, sort int default 0,
  created_at timestamptz not null default now()
);

create table public.scan_events (   -- service-role only (rate limit + usage log)
  id uuid primary key default gen_random_uuid(),
  user_id uuid, identity text not null, ok boolean not null default true,
  med_count int default 0, ms int, created_at timestamptz not null default now()
);

-- ===== indexes =====
create index doses_user_due on public.doses (user_id, due_at);
create index doses_med on public.doses (medicine_id);
create index medicines_user_active on public.medicines (user_id, active);
create index prescriptions_user_time on public.prescriptions (user_id, scanned_at desc);
create index sos_user on public.sos_contacts (user_id, sort);
create index scan_events_identity_time on public.scan_events (identity, created_at desc);

-- ===== triggers =====
create or replace function public.set_updated_at() returns trigger language plpgsql
  set search_path = public as $fn$ begin new.updated_at = now(); return new; end; $fn$;
create trigger trg_profiles_updated  before update on public.profiles  for each row execute function public.set_updated_at();
create trigger trg_medicines_updated before update on public.medicines for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql
  security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, phone, full_name)
  values (new.id, new.phone, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end; $fn$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.set_updated_at()  from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- ===== RLS =====
alter table public.profiles      enable row level security;
alter table public.medicines     enable row level security;
alter table public.prescriptions enable row level security;
alter table public.doses         enable row level security;
alter table public.sos_contacts  enable row level security;
alter table public.scan_events   enable row level security;  -- no policy: service-role only

create policy "own profile"       on public.profiles      for all using ((select auth.uid()) = id)      with check ((select auth.uid()) = id);
create policy "own medicines"     on public.medicines     for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own prescriptions" on public.prescriptions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own doses"         on public.doses         for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own sos"           on public.sos_contacts  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ===== storage bucket (private, per-user folder) =====
insert into storage.buckets (id, name, public) values ('prescriptions','prescriptions', false) on conflict (id) do nothing;
create policy "user uploads own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'prescriptions' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "user reads own files" on storage.objects for select to authenticated
  using (bucket_id = 'prescriptions' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "user deletes own files" on storage.objects for delete to authenticated
  using (bucket_id = 'prescriptions' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- ===== adherence view (RLS-respecting) =====
create view public.v_adherence_14d with (security_invoker = true) as
select user_id,
       count(*) filter (where status = 'taken') as taken,
       count(*) filter (where status in ('taken','skipped')) as accounted,
       count(*) as total
from public.doses
where due_at >= now() - interval '14 days' and due_at <= now()
group by user_id;
