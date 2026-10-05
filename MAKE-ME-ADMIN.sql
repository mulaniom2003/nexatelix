-- After you sign up on the live site with your Gmail, paste this into Supabase > SQL Editor > Run.
-- It makes your account the admin.
update public.profiles set role = 'admin' where email = 'mulaniom2216@gmail.com';
