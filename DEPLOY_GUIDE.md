# Deploy GifVault on Render — Single GitHub Repo Guide

## Exact GitHub Repo Structure
Upload your files so they look EXACTLY like this:

```
gifvault/                        ← root of your GitHub repo
│
├── render.yaml                  ← tells Render about both services
│
├── backend/                     ← Flask API
│   ├── app.py
│   ├── requirements.txt
│   └── Procfile
│
└── frontend/                    ← React app
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts
        ├── index.css
        ├── components/
        │   └── Layout.tsx
        └── pages/
            ├── Home.tsx
            ├── Upload.tsx
            ├── View.tsx
            └── Admin.tsx
```

---

## Step-by-Step Deploy on Render (from phone)

### Part 1 — Create GitHub Repo
1. Open https://github.com on your phone
2. Tap "+" → "New repository"
3. Name it: `gifvault`
4. Set to Public
5. Tap "Create repository"

### Part 2 — Upload Files (from phone)
1. Open your repo on GitHub
2. Tap "Add file" → "Upload files"
3. Upload backend files first:
   - Go into the `backend/` folder path
   - Upload: app.py, requirements.txt, Procfile
4. Then upload frontend files:
   - Go into `frontend/src/pages/` path
   - Upload all .tsx page files
   - Repeat for each subfolder
5. Upload `render.yaml` to the ROOT of the repo

**Tip:** GitHub mobile lets you create folders by typing
`backend/app.py` as the filename — it creates the folder automatically.

### Part 3 — Deploy on Render
1. Go to https://render.com
2. Sign up / log in (free)
3. Click "New +" → "Blueprint"
4. Connect your GitHub account
5. Select your `gifvault` repo
6. Render reads `render.yaml` and shows 2 services:
   - `gifvault-backend` (Python web service)
   - `gifvault-frontend` (Static site)
7. Click "Apply"

### Part 4 — Set the API URL
After backend deploys, Render gives it a URL like:
`https://gifvault-backend.onrender.com`

1. Go to your `gifvault-frontend` service on Render
2. Click "Environment"
3. Set: `VITE_API_URL` = `https://gifvault-backend.onrender.com`
4. Click "Save" — frontend will auto-redeploy

### Part 5 — Done!
Your site will be live at:
`https://gifvault-frontend.onrender.com`

---

## Important Notes

### Free Tier Limitation
Render free tier "sleeps" after 15 mins of inactivity.
First request after sleep takes ~30 seconds to wake up.
**Solution:** Upgrade to $7/month Starter plan to keep it awake.

### File Uploads on Free Tier
The `disk` storage in render.yaml (for uploaded files) requires
Render's paid tier ($7/month). On free tier, use URL uploads only.

### CORS
The backend already has CORS enabled for all origins (`*`).
No changes needed.

---

## Local Testing First (Optional)
```bash
# Terminal 1
cd backend
pip install -r requirements.txt
python app.py

# Terminal 2
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```
