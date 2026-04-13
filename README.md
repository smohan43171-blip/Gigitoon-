# GifVault — Phase 1

Full-stack GIF/Image/Video gallery with Flask backend + React frontend.

## Project Structure
```
gifvault/
├── backend/          ← Flask + SQLite API
│   ├── app.py
│   ├── requirements.txt
│   └── Procfile
└── frontend/         ← React + Vite + Tailwind
    ├── src/
    │   ├── pages/Home.tsx      ← Gallery with working filters
    │   ├── pages/Upload.tsx    ← File + URL upload
    │   ├── pages/View.tsx      ← Media detail + likes
    │   ├── pages/Admin.tsx     ← Approve/reject/sponsor
    │   ├── components/Layout.tsx
    │   ├── api.ts              ← All API calls
    │   └── App.tsx
    └── package.json
```

## 🚀 Deploy in 10 Minutes

### Step 1 — Deploy Backend (Railway - Free)
1. Push `backend/` folder to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Railway auto-detects Python
4. After deploy, copy your URL: `https://your-app.up.railway.app`

### Step 2 — Deploy Frontend (Vercel - Free)
1. Push `frontend/` folder to a GitHub repo (or same repo)
2. Go to https://vercel.com → New Project → Import repo
3. Framework: Vite
4. Add env variable: `VITE_API_URL=https://your-app.up.railway.app`
5. Deploy!

## 🔧 Local Development
```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
python app.py   # runs on :5000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev     # runs on :5173
```

## ✅ What's Fixed (vs old broken version)
- ✅ "All" filter now shows everything
- ✅ Videos show only videos, GIFs show only GIFs, Images show only images
- ✅ Subcategory pills (Anime, Realistic, etc.) actually filter
- ✅ Tag cloud filters work
- ✅ Data persists in SQLite (no more vanishing on refresh)
- ✅ Real file upload (drag & drop) + URL upload both work
- ✅ Admin panel: approve/reject/sponsor content

## 📋 Phase 2 (Next)
- User accounts + login
- Free vs Premium tiers
- Creator dashboard + earnings
- Payment integration (Stripe)
