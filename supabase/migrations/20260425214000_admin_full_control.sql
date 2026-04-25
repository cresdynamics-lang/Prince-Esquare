-- Promote configured account to admin and tighten control policies.

-- 1) Ensure princeesquare@gmail.com has admin role.
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) = 'princeesquare@gmail.com'
on conflict (user_id, role) do nothing;

-- 2) Core management tables: admins only for write operations.
-- Categories
drop policy if exists "Staff manage categories" on public.categories;
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Products
drop policy if exists "Staff manage products" on public.products;
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Product images
drop policy if exists "Staff manage product images" on public.product_images;
drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images" on public.product_images
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Variants
drop policy if exists "Staff manage variants" on public.product_variants;
drop policy if exists "Admins manage variants" on public.product_variants;
create policy "Admins manage variants" on public.product_variants
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Orders
drop policy if exists "Staff manage orders" on public.orders;
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Contact messages
drop policy if exists "Staff update messages" on public.contact_messages;
drop policy if exists "Admins update messages" on public.contact_messages;
create policy "Admins update messages" on public.contact_messages
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Promo codes
drop policy if exists "Staff manage promos" on public.promo_codes;
drop policy if exists "Admins manage promos" on public.promo_codes;
create policy "Admins manage promos" on public.promo_codes
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- User role management (already admin-only in base migration; keep explicit)
drop policy if exists "Admins manage roles" on public.user_roles;
create policy "Admins manage roles" on public.user_roles
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));
