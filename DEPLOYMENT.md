# 🚀 Deployment Guide: Adaptive Learning Platform

This guide covers the top deployment options for your Adaptive Learning Platform.

---

## 🌟 Architecture Note: Unified vs Decoupled Deployment

This codebase is configured to support **both**:
1. **Unified Deployment (Recommended / Fastest)**: A single Node.js service builds the React frontend into static assets and serves both the Frontend UI and the Backend API on the same domain and port (`PORT=5000` or `$PORT`). **Zero CORS issues, zero multi-domain headaches.**
2. **Decoupled Deployment**: Host the React frontend on **Vercel / Netlify** and the Express API backend on **Render / Railway / Fly.io**.

---

## ⚡ Option 1: Render.com (Free Tier & Easiest)

Render provides free hosting for web services with automatic GitHub deployment.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of adaptive learning platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/adaptive-learning-platform.git
   git push -u origin main
   ```
2. **Log in to [Render.com](https://render.com)** and click **"New +"** $\to$ **"Web Service"**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name**: `adaptive-learning-platform`
   - **Region**: Closest to your users (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. **Environment Variables**:
   Click **"Add Environment Variable"**:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: *(enter any secure random string)*
6. Click **"Deploy Web Service"**.
   Render will run `npm install`, build the client Vite assets, start the Express backend, and give you a public HTTPS URL (e.g. `https://adaptive-learning-platform.onrender.com`)!

---

## 🚂 Option 2: Railway.app (Fastest 1-Click Deploy)

Railway automatically detects the root `package.json` and provisions the container.

### Steps:
1. Push your repository to GitHub.
2. Go to [Railway.app](https://railway.app) and click **"New Project"**.
3. Select **"Deploy from GitHub repo"** and choose your repository.
4. Railway will automatically detect the build and start commands from `package.json`:
   - Build: `npm run build`
   - Start: `npm start`
5. Under the service **Variables** tab, add:
   - `JWT_SECRET`: `your-secure-random-secret-key`
   - `NODE_ENV`: `production`
6. Under **Settings** $\to$ **Networking**, click **"Generate Domain"** to receive your live URL!

---

## 🐳 Option 3: Docker / VPS (DigitalOcean, AWS EC2, GCP, Ubuntu VPS)

If you have your own Linux server or cloud droplet, use Docker to run the entire platform with one command.

### 1. Prerequisites
Install Docker and Docker Compose on your server:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
```

### 2. Clone and Run
```bash
git clone https://github.com/<your-username>/adaptive-learning-platform.git
cd adaptive-learning-platform
docker compose up -d --build
```

### 3. Verify
Your application is now running on port `5000` with data stored persistently in Docker volume `app-data`.

You can place Nginx in front for free SSL via Certbot:
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🌐 Option 4: Decoupled (Vercel Frontend + Render Backend)

If you prefer hosting the React frontend on Vercel and the backend on Render:

### Backend (Render):
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Get backend URL: `https://your-api.onrender.com`

### Frontend (Vercel):
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- In `client/src/utils/api.js`, update `API_BASE` to `https://your-api.onrender.com/api/v1` or set via `VITE_API_URL` environment variable.

---

## 🔐 Production Environment Variables Checklist

| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `PORT` | The port the HTTP server listens on | `5000` (or assigned by cloud provider) |
| `NODE_ENV` | Sets execution mode | `production` |
| `JWT_SECRET` | Secret key used to sign and verify student/mentor auth tokens | Any 64+ char random string |
| `DATABASE_URL` | *(Optional)* PostgreSQL connection string if migrating to managed Cloud Postgres | `postgresql://user:pass@host:5432/dbname` |
