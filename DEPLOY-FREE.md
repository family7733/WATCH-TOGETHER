# Free hosting and “free domain” (subdomains)

You get **free subdomains** from the host (no separate domain purchase):

- **Frontend:** `https://<your-project>.vercel.app` (Vercel free)
- **Backend:** `https://<your-service>.onrender.com` (Render free)

A fully custom domain (e.g. `movies.com`) is **not** included for free; you’d buy a domain later and attach it in Vercel/Render settings.

---

## 1. Push this folder to GitHub

Create a repo and push the `smart-film-platform` directory (or the whole repo that contains it).  
Render and Vercel both deploy from GitHub.

---

## 2. Backend on Render (free)

1. Go to [render.com](https://render.com) → **New** → **Blueprint**.
2. Connect the GitHub repo and select the branch.
3. Render reads `render.yaml` and creates **smart-film-backend**.
4. In the web service → **Environment**, set:
   - `CORS_ORIGINS` = your Vercel URL, e.g. `https://your-project.vercel.app`  
     (comma-separated if you add more URLs later)
   - `OMDB_API_KEY` = your OMDB key (get one at [omdbapi.com](http://www.omdbapi.com/apikey.aspx))
5. Wait for deploy. Copy the service URL, e.g. `https://smart-film-backend-xxxx.onrender.com`.

**Note:** Free Render apps **sleep after ~15 minutes** of no traffic. First request after sleep can take ~30–60 seconds. That is normal on the free tier.

---

## 3. Frontend on Vercel (free)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the same GitHub repo.
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite (auto)
4. **Environment Variables** (Production):

   | Name | Value |
   |------|--------|
   | `VITE_API_BASE` | `https://YOUR-SERVICE.onrender.com` (no trailing slash) |
   | `VITE_PUBLIC_APP_URL` | `https://YOUR-PROJECT.vercel.app` |
   | `VITE_TMDB_API_KEY` | optional, if your UI uses TMDB |
   | `VITE_TMDB_READ_TOKEN` | optional |

5. Deploy. Open `https://YOUR-PROJECT.vercel.app`.

Watch Together share links use `VITE_PUBLIC_APP_URL`; the app talks to the API at `VITE_API_BASE` (Socket.io + REST).

---

## 4. Order of operations

Deploy **backend first**, copy its URL, then set Vercel env vars and **redeploy** the frontend if you change API URL later.

---

## Files added for you

- `render.yaml` — Render Blueprint for the Node backend under `backend/backend-node`
- `frontend/vercel.json` — SPA fallback so React routes work on refresh
- `frontend/.env.example` / `backend/backend-node/.env.example` — copy locally; never commit real secrets
