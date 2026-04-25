-- Ensure admin credentials are validated from database state (roles + profile username).

-- 1) Make sure configured admin user has admin role.
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) = 'princeesquare@gmail.com'
on conflict (user_id, role) do nothing;

-- 2) Ensure username in DB profile is "Admin" so login username can be validated.
update public.profiles p
set display_name = 'Admin'
from auth.users u
where p.user_id = u.id
  and lower(u.email) = 'princeesquare@gmail.com';
