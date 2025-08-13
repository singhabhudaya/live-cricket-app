

# 🏏 Live Cricket App

A real-time cricket match management and score tracking app built with **NestJS**, **Prisma**, and a modern **React** frontend.
It allows starting matches, updating scores ball-by-ball, and viewing live commentary — all in a beautiful UI.

---

##  Features

* **Start new matches** with team names.
* **Live score tracking** with over-by-over updates.
* **Ball-by-ball commentary** feed.
* **Real-time UI updates** with smooth transitions.
* **Responsive design** for mobile & desktop.
* **CORS-configured backend** to work with deployed frontend.

---

##  Screenshots

### Match List & Scoreboard

![Match View](./match-view.png)

---

##  Tech Stack

**Frontend:** React, Tailwind CSS
**Backend:** NestJS, Prisma, PostgreSQL
**Hosting:** Netlify (frontend) + Render (backend)

---

##  Installation & Setup

### Backend

```bash
# Clone repository
git clone <backend-repo-url>
cd backend

# Install dependencies
npm ci --include=dev

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start server
npm run start:prod
```

---

### Frontend

```bash
# Clone repository
git clone <frontend-repo-url>
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

##  Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
CORS_ORIGINS=https://your-frontend-domain.com
PORT=3000
```

---

##  Deployment Commands

**Build Command**

```bash
npm ci --include=dev && npx prisma generate && npm run build
```

**Start Command**

```bash
bash -c "mkdir -p /data && npx prisma migrate deploy && node dist/main.js"
```



