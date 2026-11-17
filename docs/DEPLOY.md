# Deploy

The web app is on **Vercel** (`/web`). The API (`/server`) is a long-running Node process: it holds Socket.io connections and runs the Gmail poller, so it needs a host that keeps a server process alive (not serverless functions). The database is **MongoDB Atlas** (free M0).

## API on Railway (current, since 2026-11-17)

Render's free plan suspended `relay-server` on 2026-11-17 after the workspace used its 750 free instance hours (three services shared them). Railway runs the same server with no code changes; `railway.json` at the repo root holds the build and start config.

Cost: Railway's trial gives a one-time $5 credit for 30 days with no card; afterwards the Free plan gives $1 of usage a month. This server idles at roughly 100–150 MB, which fits the trial comfortably.

### 1. Create the service
1. Sign in at https://railway.com with GitHub.
2. **New Project → Deploy from GitHub repo →** `aryanchettripkt-eng/humanity_founder`.
3. Leave **Root Directory** empty (the repo root). Railway reads `railway.json`, installs with `npm ci`, and starts with `npm start` (which runs the `server` workspace).

### 2. Set variables (service → Variables → Raw Editor)
Copy them from the suspended Render service (Render dashboard → relay-server → Environment should still show them while it is suspended). Do **not** set `PORT`; Railway provides it.

```
NODE_ENV=production
MONGODB_URI=<same Atlas connection string as on Render>
JWT_SECRET=<same value as on Render, so existing sign-ins keep working>
CORS_ORIGIN=https://web-one-zeta-74.vercel.app
WEB_URL=https://web-one-zeta-74.vercel.app
DEMO_MODE=true
AI_PROVIDER=groq
GROQ_API_KEY=<your Groq key>
GMAIL_IMPORT_LIMIT=20
```
Only if real Gmail / Google sign-in was on: also `REAL_GMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENC_KEY` (same values), and `GOOGLE_REDIRECT_URI=https://<railway-domain>/api/oauth/google/callback`.

### 3. Get a public URL
Current: `https://relayserver-production-ab0bdc31.up.railway.app`.

Service → **Settings → Networking → Generate Domain**. You get `https://<name>.up.railway.app`. Check `https://<name>.up.railway.app/api/health` returns `{"data":{"ok":true,...}}`.

### 4. Point the web app at it (Vercel)
Vercel project → **Settings → Environment Variables** (Production):
- `VITE_API_URL=https://<name>.up.railway.app/api`
- `VITE_SOCKET_URL=https://<name>.up.railway.app`

Then **Deployments → latest → Redeploy** (Vite bakes these in at build time, so a redeploy is required).

### 5. Atlas and Google
- Atlas → **Network Access**: Railway has no fixed IPs, so `0.0.0.0/0` must be allowed (it already is if Render worked).
- If Google sign-in is on: Google Cloud Console → Credentials → OAuth client → add the new callback URL to **Authorized redirect URIs**.

## Going back to Render later
Render's free hours reset on the 1st of each month. 750 hours covers one service running all month, so if only `relay-server` stays on the free plan (suspend or delete `oceanscope-backend` and `the-dead-zone`), it would not run out again. Switching back is only steps 4 and 5 with the Render URL.
