# Vercel Deployment Instructions

- The website files (`index.html`, `styles.css`, `script.js`, `admin/`, `supabase-client.js`) are served directly from the root directory.
- In your Vercel project settings, set the following Environment Variables:
  - `SUPABASE_URL` = your Supabase URL
  - `SUPABASE_ANON_KEY` = your Supabase anon key
  - `SUPABASE_KEY` = your Supabase service role key (for backend auth/data upserts)
- The included `vercel.json` routes `/api/*` to `api/index.py` serverless functions and serves all static assets directly.
- Deploy by connecting this GitHub repository directly to Vercel.
