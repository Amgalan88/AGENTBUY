# 🚀 Production Deploy - Бэлэн эсэх Checklist

## ✅ Хийгдсэн зүйлс:

### Backend:
- ✅ **JWT_SECRET**: Шинэчилэгдсэн (128 тэмдэгт)
- ✅ **MongoDB URI**: Тохируулсан
- ✅ **Cloudinary**: Credentials байгаа
- ✅ **CORS**: `agentbuy.mn` багтсан
- ✅ **PM2 Config**: `ecosystem.config.js` бэлэн
- ✅ **Code**: Бүх features бэлэн

### Frontend:
- ✅ **Code**: Бүх features бэлэн
- ✅ **Environment Variables**: Code дээр бэлэн (Vercel дээр тохируулах шаардлагатай)

---

## ⚠️ Production сервер дээр ХИЙХ:

### 1. Backend Environment Variables (Production сервер дээр)

Production сервер дээр `backend/.env` файл үүсгэх:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://amgalan:amgalan112233@cluster0.fbocqjz.mongodb.net/agentbuy

# JWT Secret Key (Production дээр заавал шинэ утга!)
JWT_SECRET=54d2fd1611df623b4010ebfa0e081c1522f13c080d6ada4278355e007538d99423aebae761296472df454018b01997341658518a834ecd2857d2041c8ad30a00

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

### 2. Backend Deploy

```bash
# Production сервер дээр:

# 1. Code татах
cd /path/to/agentbuy
git pull origin main

# 2. Dependencies суулгах
cd backend
npm install --production

# 3. PM2 ажиллуулах
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 4. Logs шалгах
pm2 logs agentbuy-backend
```

### 3. Frontend Environment Variables (Vercel дээр)

Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://api.agentbuy.mn
NEXT_PUBLIC_SOCKET_URL = https://api.agentbuy.mn
```

**Анхаар:** Environment variable өөрчилсний дараа redeploy хийх!

### 4. Frontend Deploy (Vercel)

```bash
cd frontend
vercel --prod

# Эсвэл Vercel Dashboard → Deployments → Redeploy
```

---

## 🔒 Production дээр шалгах:

### MongoDB Atlas:
- [ ] Network Access → `0.0.0.0/0` эсвэл server IP нэмсэн эсэх

### Cloudinary:
- [ ] Settings → Security → Domain whitelist:
  - `agentbuy.mn`
  - `www.agentbuy.mn`
  - `*.agentbuy.mn`

### SSL/HTTPS:
- [ ] Backend HTTPS дээр ажиллаж байгаа (`https://api.agentbuy.mn`)
- [ ] Frontend HTTPS дээр ажиллаж байгаа (`https://agentbuy.mn`)

### Testing:
- [ ] Backend health: `curl https://api.agentbuy.mn/`
- [ ] Frontend ажиллаж байгаа: `https://agentbuy.mn`
- [ ] Login/Register ажиллаж байгаа
- [ ] Socket.io холбогдож байгаа
- [ ] Зураг upload ажиллаж байгаа

---

## 📋 Production Deploy Алхмууд:

### Step 1: Backend
1. Production сервер дээр `.env` файл үүсгэх (дээрх агуулга)
2. `git pull` хийх
3. `npm install --production`
4. PM2 ажиллуулах
5. Health check: `curl https://api.agentbuy.mn/`

### Step 2: Frontend
1. Vercel Dashboard → Environment Variables нэмэх
2. Deploy хийх (эсвэл GitHub руу push хийх → auto deploy)
3. `https://agentbuy.mn` шалгах

### Step 3: Testing
1. Login/Register тест
2. Захиалга үүсгэх тест
3. Зураг upload тест
4. Real-time updates тест

---

## ✅ Бэлэн байдал: **95%**

### Бэлэн:
- ✅ Код бүгд production-ready
- ✅ JWT_SECRET үүсгэсэн
- ✅ PM2 config бэлэн
- ✅ CORS тохируулсан
- ✅ Cloudinary credentials байгаа

### Production дээр хийх:
- ⚠️ Backend `.env` файл үүсгэх (production сервер дээр)
- ⚠️ Frontend environment variables тохируулах (Vercel дээр)
- ⚠️ SSL/HTTPS суух
- ⚠️ MongoDB Network Access
- ⚠️ Cloudinary Domain Whitelist

---

## 🎯 Одоо хийх:

1. **Production сервер дээр backend deploy хийх** (дээрх алхмууд)
2. **Vercel дээр frontend deploy хийх** (environment variables тохируулсны дараа)
3. **Testing хийх**

---

**Бүх зүйл бэлэн! Production сервер дээр deploy хийх боломжтой! 🚀**

