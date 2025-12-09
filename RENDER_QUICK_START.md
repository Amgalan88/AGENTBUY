# ⚡ Render Quick Start Guide

## 🚀 5 минут дээр Deploy хийх:

### 1. GitHub дээр push хийх (30 секунд)
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Render Dashboard дээр (3 минут)

1. **render.com** дээр нэвтрэх
2. **"New +"** → **"Web Service"**
3. GitHub repo сонгох
4. **Settings:**
   ```
   Name: agentbuy-backend
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```
5. **Environment Variables нэмэх:**
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://amgalan:amgalan112233@cluster0.fbocqjz.mongodb.net/agentbuy
   JWT_SECRET=<үүсгэх-шаардлагатай>
   CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn,https://agentbuy.onrender.com
   CLOUDINARY_CLOUD_NAME=dn5fzzxis
   CLOUDINARY_API_KEY=731682522556299
   CLOUDINARY_API_SECRET=01gBrlS1wtexb-uQd4UGFx7l0Jo
   CLOUDINARY_FOLDER=agentbuy
   ```
6. **"Create Web Service"** дарна

### 3. JWT_SECRET үүсгэх (30 секунд)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Үүссэн утгыг Render Dashboard → Environment Variables → JWT_SECRET дээр тавих

### 4. Deploy хүлээх (1-2 минут)
- Build процесс ажиллана
- Deploy амжилттай бол "Live" статус харагдана

### 5. Frontend Deploy (Vercel) (2 минут)
```bash
cd frontend
vercel --prod
```

**Environment Variables (Vercel):**
```
NEXT_PUBLIC_API_URL=https://agentbuy-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://agentbuy-backend.onrender.com
```

---

## ✅ Бэлэн!

- Backend: `https://agentbuy-backend.onrender.com`
- Frontend: `https://agentbuy.vercel.app` (эсвэл таны domain)

---

**Дэлгэрэнгүй заавар:** `RENDER_DEPLOY.md` файлыг үзнэ үү

