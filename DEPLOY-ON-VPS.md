# NexaTelix — run it live on a VPS

**For: Om + your VPS-savvy friend.** Plain steps on the left, the exact commands to run on the right.
Assumes an **Ubuntu 22.04 / 24.04** VPS. If the VPS is a different OS, tell Claude.

## What runs where (important)
- **VPS** = where the website + panel + admin + API run (replaces Vercel). Gives you one fixed IP.
- **Supabase** = your database + client logins + file storage. Still required, even with a VPS.
- **Partner panel** = actually delivers the SMS. You call it from the VPS; you give the partner your VPS IP to whitelist.

So the order is: (1) make the Supabase database, (2) set up the VPS to run the app, (3) connect the partner.

---

## Part A — Supabase (the database) — do this once
Same as before; the VPS does not replace it.
1. **supabase.com** → sign in → **New project** (name, region near your customers, set a DB password, Free plan).
2. **SQL Editor → New query** → paste all of **`RUN-THIS-IN-SUPABASE.sql`** → **Run**.
3. **Authentication → Providers → Email** → turn **off "Confirm email"**.
4. **Authentication → URL Configuration** → Site URL `https://nexatelix.com`; Redirect URLs `https://nexatelix.com/**` (and `http://localhost:3000/**` for testing).
5. Keep three values from **Project Settings → API** ready for Part B step 5: the **Project URL**, the **anon** key, and the **service_role** key.

---

## Part B — the VPS (run the app)

### 1. Get a VPS
Any provider: Hetzner / DigitalOcean / Vultr / Contabo. **Ubuntu 24.04**, **2 GB RAM** (the build needs memory). Note its **public IP**.

### 2. Point your domain at it (at Porkbun, where nexatelix.com lives)
Add two DNS records:
```
A    @      <VPS_IP>
A    www    <VPS_IP>
```
Give it a few minutes to take effect.

### 3. Log in and prepare the server
```bash
ssh root@<VPS_IP>
apt update && apt -y upgrade

# 2 GB swap so the build never runs out of memory
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Node.js 22 LTS + git
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git
node -v   # should print v22.x
```

### 4. Put the NexaTelix code on the server
The code is already in your **private** GitHub repo: **`https://github.com/mulaniom2003/nexatelix`** (branch `master`).
Because it's private, the clone needs a one-time login (a token, not your GitHub password). On the VPS:
```bash
# First make a token: github.com -> Settings -> Developer settings ->
# Personal access tokens -> Tokens (classic) -> Generate new token,
# tick the "repo" box, Generate, and copy it.
git clone https://github.com/mulaniom2003/nexatelix.git /opt/nexatelix
# Username = mulaniom2003    Password = paste the token
cd /opt/nexatelix
```
(Alternative, no token: upload the folder with WinSCP, skipping `node_modules` and `.next`.)

### 5. Add your keys
```bash
cd /opt/nexatelix
nano .env.local
```
Paste (fill in your real values from Supabase; leave UPSTREAM blank until you have the partner key):
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service_role-key
NEXT_PUBLIC_SITE_URL=https://nexatelix.com
DLR_SECRET=any-long-random-text-123456
CONTACT_TO=mulaniom2216@gmail.com
UPSTREAM_BASE_URL=
UPSTREAM_API_KEY=
```
Save: `Ctrl+O`, `Enter`, `Ctrl+X`.

### 6. Build it
```bash
npm ci
npm run build
```

### 7. Keep it running forever (pm2)
```bash
npm i -g pm2
pm2 start npm --name nexatelix -- start   # serves on port 3000
pm2 save
pm2 startup                               # then run the command it prints
```

### 8. HTTPS + domain (Caddy — gets the SSL certificate automatically)
```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```
Put this in `/etc/caddy/Caddyfile` (replace the file contents):
```
nexatelix.com, www.nexatelix.com {
    reverse_proxy localhost:3000
}
```
Then:
```bash
systemctl reload caddy
```
Caddy fetches a free HTTPS certificate on its own once DNS (step 2) points here.

### 9. Firewall
```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

**Your site is now live at https://nexatelix.com.** Open it, **Sign up** with your Gmail, then in Supabase SQL Editor run **`MAKE-ME-ADMIN.sql`** to become admin.

---

## Part C — connect the partner (when you have the API key + their certificate)
The VPS makes this the easy part.

1. Save the partner's certificate on the server, e.g. `/opt/nexatelix/partner.pem`.
2. Tell Node to trust it + add the partner keys, using a pm2 config so the setting loads before the app starts. Create `/opt/nexatelix/ecosystem.config.js`:
```js
module.exports = {
  apps: [{
    name: "nexatelix",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    cwd: "/opt/nexatelix",
    env: {
      NODE_ENV: "production",
      PORT: "3000",
      NODE_EXTRA_CA_CERTS: "/opt/nexatelix/partner.pem"
    }
  }]
}
```
Add the partner values to `.env.local`:
```
UPSTREAM_BASE_URL=https://<partner-panel-address>
UPSTREAM_API_KEY=<your-partner-api-key>
```
Restart under the new config:
```bash
cd /opt/nexatelix
pm2 delete nexatelix
pm2 start ecosystem.config.js
pm2 save
```
3. **Give the partner your VPS IP** so they whitelist it.
4. In `/admin/settings` fill UPI/bank/USDT; in `/admin/routes` set your selling prices. Send a test SMS.

---

## Updating the site later
```bash
cd /opt/nexatelix
git pull          # or re-upload changed files
npm ci
npm run build
pm2 restart nexatelix
```

## Notes
- The old `Publish NexaTelix.bat` / `Set keys NexaTelix.bat` were for Vercel. On a VPS you don't need them — this runbook replaces them.
- `NODE_EXTRA_CA_CERTS` is why the VPS handles the partner's self-signed cert cleanly: it trusts exactly that one certificate, nothing else — no insecure global TLS switch.
