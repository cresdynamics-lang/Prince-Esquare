-- Booking system: customer booking requests + admin management.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  service text not null,
  booking_date date not null,
  booking_time text not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Anyone can create bookings" on public.bookings;
create policy "Anyone can create bookings"
on public.bookings
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins view bookings" on public.bookings;
create policy "Admins view bookings"
on public.bookings
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage bookings" on public.bookings;
create policy "Admins manage bookings"
on public.bookings
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete bookings" on public.bookings;
create policy "Admins delete bookings"
on public.bookings
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists trg_bookings_updated on public.bookings;
create trigger trg_bookings_updated
before update on public.bookings
for each row execute function public.update_updated_at_column();
