
# Live Cricket – Functional MVP (SQLite)

## Backend (NestJS + Prisma + Socket.IO)
- Endpoints
  - `POST /api/matches/start` → { teamA, teamB, oversPerSide } → creates match with 4‑digit `code`
  - `POST /api/matches/:code/commentary` → { over, ball, event, runsBat?, runsExtra?, wicket?, notes? }
  - `GET  /api/matches` → list
  - `GET  /api/matches/:code` → match + commentary
- Realtime: Socket.IO namespace `/ws`
  - Join room: emit `join` with `{ matchCode }`
  - Server emits `commentary:new` on new entry

### Run
```bash
cd backend
npm i
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```
Set `DATABASE_URL="file:./dev.db"` in `.env` (already present).

## Frontend (Vite + React)
```bash
cd frontend
npm i
# optional env:
# VITE_API_URL=http://localhost:3000/api
# VITE_WS_URL=http://localhost:3000
npm run dev
```

Open `http://localhost:5173`, start a match, pick it, and add commentary.
