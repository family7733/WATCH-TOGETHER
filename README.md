# SHADOW STUDIO

Monorepo for a full-stack movie recommendation app.

## Quick start (Docker)

1. Create a `.env` in `backend/` if needed (JWT, TMDB_API_KEY).
2. Run:

```bash
docker-compose up --build
```

Backend runs at `http://localhost:8000` with docs at `/docs`.

Frontend (Vite) runs at `http://localhost:5173` (when started locally).

## Services

- Backend: FastAPI with ML model loader at `backend/`
- Frontend: React app at `frontend/` (to be added)
- DB: PostgreSQL 15

## Deploy

- Backend: Render/Heroku with PostgreSQL add-on
- Frontend: Vercel/Netlify

## Local development

- Backend: `uvicorn app.main:app --reload` inside `backend`
- Frontend: `npm install && npm run dev` inside `frontend`


