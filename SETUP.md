# NexaTelix — panel setup (one time)

1. **Supabase → SQL Editor**: run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_messaging.sql` (both are safe to re-run).
2. **Supabase → Authentication → Providers → Email**: turn off "Confirm email" (or leave on if you want verification).
   **Authentication → URL Configuration**: Site URL `https://nexatelix.com`; Redirect URLs `https://nexatelix.com/**` and `http://localhost:3000/**`.
3. **Env vars** — put these in `.env.local` *and* in Vercel → nexatelix → Settings → Environment Variables (yourself; never paste keys in chat):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://nexatelix.com`,
   `UPSTREAM_BASE_URL`, `UPSTREAM_API_KEY`, `DLR_SECRET` (any long random string).
4. Sign up on the site with mulaniom2216@gmail.com, then in the SQL Editor run:
   `update public.profiles set role = 'admin' where email = 'mulaniom2216@gmail.com';`
5. Open `/admin/settings` → fill UPI / bank / USDT. Open `/admin/routes` → set your selling prices per country.
6. Double-click **Publish NexaTelix.bat**.

Daily use: `/admin/topups` approve payments · `/admin/senders` approve sender IDs · `/admin/users/<client>` custom prices, routes, credit.
