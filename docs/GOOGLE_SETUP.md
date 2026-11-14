# Google Cloud setup (real Gmail + Sign in with Google)

> For ROADMAP task **G6.1** (Aryan). About 15 minutes. You need a Google account; a personal one is fine.
> The spec for the code side is BACKEND §11. Google renames these console pages from time to time: if a label differs, look for the closest match. In the newer console, the OAuth pages are grouped under **Google Auth Platform** (Branding, Audience, Clients, Data access).

## 1. Create the project
1. Open <https://console.cloud.google.com/> and sign in.
2. Use the project picker at the top → **New project** → name it `relay-prototype` → **Create**, and make sure it's selected.

## 2. Turn on the Gmail API
**APIs & Services → Library** → search "Gmail API" → **Enable**.

## 3. Consent screen (Branding + Audience)
1. **Google Auth Platform → Branding** (older console: *OAuth consent screen*) → **Get started**.
2. App name `Relay`; support email = your email; developer contact = your email.
3. **Audience: External**. Leave the publishing status as **Testing**. Don't submit for verification.
4. **Audience → Test users → Add users**: add every Gmail address that should be able to connect (yours, plus any you'll use in the demo video). Up to 100.

## 4. Scopes (Data access)
Add:
- `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` (Sign in with Google)
- `https://www.googleapis.com/auth/gmail.readonly` (shows as *restricted*; that's expected in Testing mode)

## 5. OAuth client (Clients)
1. **Clients → Create client** (older console: *Credentials → Create credentials → OAuth client ID*). Type: **Web application**, name `relay-web`.
2. **Authorized JavaScript origins**: `http://localhost:5173`, plus later the deployed web URL (e.g. `https://<your-app>.vercel.app`).
3. **Authorized redirect URIs**: `http://localhost:4000/api/oauth/google/callback`, plus later `https://<your-api>.onrender.com/api/oauth/google/callback`.
4. **Create**, then copy the **Client ID** and **Client secret**.

## 6. Fill `server/.env` (never commit it)
```
REAL_GMAIL=true
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
GOOGLE_REDIRECT_URI=http://localhost:4000/api/oauth/google/callback
WEB_URL=http://localhost:5173
TOKEN_ENC_KEY=<run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
GMAIL_IMPORT_LIMIT=50
GMAIL_POLL_SECONDS=60
```
On Render/Vercel, set the same values with the deployed URLs.

## 7. What to expect
- When you connect, Google shows **"Google hasn't verified this app"**. Click **Continue**. This is normal in Testing mode.
- Accounts that aren't on the test-user list get blocked. The app shows a friendly error and offers the demo inbox.
- In Testing mode, Google refresh tokens expire after about **7 days**. If Gmail stops syncing, use **Reconnect** in Settings → Accounts. Do this right before recording the demo video.
- Revoke access any time at <https://myaccount.google.com/permissions>.

## 8. Before recording the video
- Connect with a Gmail that has some realistic mail (or send it a few test emails), so the AI labels look meaningful.
- Real email content is sent to Groq for classification. Use an inbox you're comfortable sharing that way.
