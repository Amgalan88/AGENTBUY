# 🚀 Production Deployment Checklist - AgentBuy

## ⚠️ ЗААВАЛ ХИЙХ (Security & Configuration)

### 1. JWT_SECRET өөрчлөх ⚠️ КРИТИКЛ
```bash
# Backend дээр шинэ JWT_SECRET үүсгэх:
cd backend
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Үүссэн утгыг .env файлд тавих:
# JWT_SECRET=үүссэн-утга
```
**Яагаад:** Production дээр default JWT_SECRET ашиглах боломжгүй!

### 2. Environment Variables - Backend

Backend сервер дээр `.env` файл үүсгэх:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://amgalan:amgalan112233@cluster0.fbocqjz.mongodb.net/agentbuy

# JWT Secret Key (ЗААВАЛ ӨӨРЧЛӨХ!)
JWT_SECRET=<урт-санамсаргүй-тэмдэгт-мөр-64+тэмдэгт>

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dn5fzzxis
CLOUDINARY_API_KEY=731682522556299
CLOUDINARY_API_SECRET=01gBrlS1wtexb-uQd4UGFx7l0Jo
CLOUDINARY_FOLDER=agentbuy
```

### 3. Environment Variables - Frontend

Vercel/Netlify эсвэл hosting provider дээр:

```env
NEXT_PUBLIC_API_URL=https://api.agentbuy.mn
NEXT_PUBLIC_SOCKET_URL=https://api.agentbuy.mn
```

**Анхаар:** 
- `NEXT_PUBLIC_` prefix заавал байх ёстой (Next.js requirement)
- Backend URL нь production domain байх ёстой

---

## 🔒 Security Configuration

### 4. MongoDB Atlas Network Access

1. MongoDB Atlas → Network Access
2. "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
   Эсвэл production серверийн IP нэмэх (илүү аюулгүй)

### 5. Cloudinary Domain Whitelist

1. Cloudinary Dashboard → Settings → Security
2. "Allowed fetch domains" хэсэгт:
   - `agentbuy.mn`
   - `www.agentbuy.mn`
   - `*.agentbuy.mn`
   - `localhost` (development-д)

**Яагаад:** Cloudinary-ийн зургууд зөвхөн whitelisted domain-уудад харагдана.

### 6. SSL/HTTPS Configuration

**Backend:**
- HTTPS дээр ажиллах ёстой (`https://api.agentbuy.mn`)
- SSL certificate суух (Let's Encrypt, Cloudflare, эсвэл hosting provider)
- Cookie settings зөв ажиллахын тулд HTTPS заавал хэрэгтэй

**Frontend:**
- HTTPS дээр ажиллах ёстой (`https://agentbuy.mn`)

---

## 🖥️ Backend Server Setup

### 7. Dependencies суулгах

```bash
cd backend
npm install --production
```

### 8. PM2 ашиглах (Process Manager)

```bash
# PM2 суулгах
npm install -g pm2

# Backend серверийг PM2-оор ажиллуулах
cd backend
pm2 start ecosystem.config.js --env production

# PM2 processes хадгалах (сервер restart хийсний дараа автоматаар эхлэнэ)
pm2 save

# System startup-д автоматаар эхлэхийг тохируулах
pm2 startup
# (Командын гаргасан зааврыг дагана уу)
```

**PM2 Configuration (`backend/ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [{
    name: "agentbuy-backend",
    script: "src/server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000,
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
  }],
};
```

### 9. Backend Logs

```bash
# Logs харах
pm2 logs agentbuy-backend

# Real-time logs
pm2 logs agentbuy-backend --lines 50

# Log files:
# - backend/logs/out.log (standard output)
# - backend/logs/err.log (errors)
```

---

## 🌐 Frontend Deployment

### 10. Vercel Deployment

```bash
cd frontend
vercel

# Эсвэл Vercel Dashboard дээр GitHub repo-оос deploy хийх
```

**Vercel Settings:**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 11. Frontend Environment Variables (Vercel)

Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://api.agentbuy.mn
NEXT_PUBLIC_SOCKET_URL = https://api.agentbuy.mn
```

**Анхаар:** Environment variable өөрчилсний дараа redeploy хийх хэрэгтэй!

---

## ✅ Testing Checklist

Production deployment-ийн дараа дараах зүйлсийг шалгах:

### Backend:
- [ ] Health check: `curl https://api.agentbuy.mn/` → "AGENTBUY Backend API"
- [ ] MongoDB холбогдсон эсэх: Backend logs шалгах
- [ ] PM2 ажиллаж байгаа эсэх: `pm2 list`
- [ ] SSL certificate зөв суусан эсэх: Browser дээр 🔒 icon харагдах

### Frontend:
- [ ] Frontend ажиллаж байгаа эсэх: `https://agentbuy.mn`
- [ ] API холболт: Browser Console → Network tab → API requests амжилттай эсэх
- [ ] Socket.io холболт: Browser Console → WebSocket connection байгаа эсэх

### Authentication:
- [ ] Login ажиллаж байгаа эсэх
- [ ] Register ажиллаж байгаа эсэх
- [ ] Cookie зөв set хийгдэж байгаа эсэх: Browser DevTools → Application → Cookies
- [ ] "Намайг сана" checkbox ажиллаж байгаа эсэх (cookie expiry шалгах)

### Features:
- [ ] Захиалга үүсгэх ажиллаж байгаа эсэх
- [ ] Зураг upload хийх ажиллаж байгаа эсэх (Cloudinary)
- [ ] Real-time updates ажиллаж байгаа эсэх (Socket.io)
- [ ] Карт систем ажиллаж байгаа эсэх

---

## 🔧 Troubleshooting

### Backend ажиллахгүй байвал:

```bash
# PM2 status шалгах
pm2 status

# Logs харах
pm2 logs agentbuy-backend --lines 100

# Серверийг дахин эхлүүлэх
pm2 restart agentbuy-backend

# Серверийг бүрмөсөн дахин эхлүүлэх
pm2 delete agentbuy-backend
pm2 start ecosystem.config.js --env production
pm2 save
```

### MongoDB холбогдож чадахгүй байвал:

1. MongoDB Atlas → Network Access → IP whitelist шалгах
2. MongoDB connection string шалгах (`.env` файлд)
3. Backend logs шалгах: `pm2 logs agentbuy-backend`

### CORS алдаа гарвал:

1. Backend `.env` файлд `CLIENT_URL` зөв тохируулсан эсэх шалгах
2. Frontend `NEXT_PUBLIC_API_URL` зөв тохируулсан эсэх шалгах
3. Backend `server.js` дээр `ALLOWED_ORIGINS` array-д frontend URL байгаа эсэх шалгах

### Cloudinary зураг харагдахгүй байвал:

1. Cloudinary Dashboard → Settings → Security → Domain whitelist шалгах
2. Backend `.env` файлд Cloudinary credentials зөв эсэх шалгах
3. Browser Console → Network tab → Cloudinary requests шалгах

### Socket.io ажиллахгүй байвал:

1. Frontend `NEXT_PUBLIC_SOCKET_URL` зөв тохируулсан эсэх шалгах
2. Backend Socket.io ажиллаж байгаа эсэх шалгах (Backend logs)
3. Browser Console → Network tab → WebSocket connection байгаа эсэх шалгах

---

## 📊 Monitoring

### PM2 Monitoring:

```bash
# Real-time monitoring
pm2 monit

# Process info
pm2 info agentbuy-backend

# CPU, Memory usage
pm2 list
```

### Logs Analysis:

```bash
# Error logs харах
tail -f backend/logs/err.log

# All logs харах
tail -f backend/logs/out.log
```

---

## 🎯 Priority Order

### Одоо хийх (Deploy-ийн өмнө):
1. ✅ JWT_SECRET өөрчлөх
2. ✅ MongoDB Network Access
3. ✅ Cloudinary Domain Whitelist
4. ✅ Environment Variables тохируулах

### Deploy хийх:
5. ✅ Backend PM2 setup
6. ✅ Frontend deploy (Vercel)
7. ✅ SSL/HTTPS суух

### Deploy-ийн дараа:
8. ✅ Testing (дээрх checklist)
9. ✅ Monitoring setup
10. ✅ Logs шалгах

---

## 📝 Important Notes

1. **JWT_SECRET**: Production дээр default утга ашиглахгүй!
2. **HTTPS**: Cookie ажиллахын тулд HTTPS заавал хэрэгтэй
3. **CORS**: Backend болон Frontend domain-ууд хоёулаа CORS-д багтсан байх ёстой
4. **Environment Variables**: Frontend дээр `NEXT_PUBLIC_` prefix заавал байх ёстой
5. **PM2**: Production дээр process manager (PM2) ашиглах нь зөвлөмжтэй
6. **Logs**: Production дээр logs-ийг тогтмол шалгах

---

## 🆘 Support

Хэрэв асуудал гарвал:
1. Backend logs: `pm2 logs agentbuy-backend`
2. Frontend logs: Vercel Dashboard → Logs
3. Browser Console: F12 → Console, Network tabs
4. MongoDB Atlas: Connection monitoring

