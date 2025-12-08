# AgentBuy Production Deployment Guide

## Backend Deployment (agentbuy.mn дээр)

### 1. Environment Variables (.env)

Backend дээр дараах environment variables тохируулах:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://amgalan:amgalan112233@cluster0.fbocqjz.mongodb.net/agentbuy

# JWT Secret Key (АЮУЛГҮЙ УРТ САНАМСАРГҮЙ ТЭМДЭГТ МӨР - ЗААВАЛ ӨӨРЧЛӨХ!)
JWT_SECRET=<урт-санамсаргүй-тэмдэгт-мөр>

# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn

# Cloudinary Configuration (зураг хадгалах)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_UPLOAD_PRESET=your-upload-preset
CLOUDINARY_FOLDER=agentbuy
```

### 2. Backend Server ажиллуулах

```bash
cd backend
npm install
npm start
```

Production дээр PM2 ашиглах:

```bash
npm install -g pm2
pm2 start src/server.js --name agentbuy-backend
pm2 save
pm2 startup
```

### 3. MongoDB Atlas Network Access

MongoDB Atlas дээр:
1. Network Access → Add IP Address
2. "Allow Access from Anywhere" (0.0.0.0/0) эсвэл серверийн IP нэмэх

---

## Frontend Deployment (Vercel/Netlify)

### 1. Environment Variables

Frontend hosting provider (Vercel/Netlify) дээр дараах environment variables тохируулах:

```
NEXT_PUBLIC_API_URL=https://api.agentbuy.mn
NEXT_PUBLIC_SOCKET_URL=https://api.agentbuy.mn
```

**Анхаар:** Backend URL нь `https://api.agentbuy.mn` эсвэл өөрийн backend domain байх ёстой.

### 2. Vercel Deployment

```bash
cd frontend
vercel
```

Environment variables-ийг Vercel dashboard дээрээс нэмэх:
- Settings → Environment Variables

### 3. Build Command

```bash
npm run build
```

---

## Production Checklist

- [ ] MongoDB Atlas дээр Network Access тохируулсан
- [ ] Backend `.env` дээр `JWT_SECRET` өөрчилсөн (аюулгүй утга)
- [ ] Backend `.env` дээр `NODE_ENV=production` тохируулсан
- [ ] Backend `.env` дээр `CLIENT_URL` дээр `https://agentbuy.mn` нэмсэн
- [ ] Frontend environment variables тохируулсан (`NEXT_PUBLIC_API_URL`)
- [ ] Backend сервер HTTPS дээр ажиллаж байна
- [ ] SSL certificate суусан (Let's Encrypt гэх мэт)
- [ ] Cloudinary тохиргоо хийсэн (зураг upload хийх бол)

---

## CORS Configuration

Backend дээр `agentbuy.mn` аль хэдийн CORS-д багтсан байна (`server.js`):

```javascript
const ALLOWED_ORIGINS = [
  "https://agentbuy.mn",
  "https://www.agentbuy.mn",
  // ... бусад origins
];
```

---

## SSL/HTTPS

Backend болон Frontend хоёулаа HTTPS дээр ажиллах ёстой:
- **Backend**: `https://api.agentbuy.mn` эсвэл `https://agentbuy.mn/api`
- **Frontend**: `https://agentbuy.mn`

SSL certificate суух:
- Let's Encrypt (Certbot)
- Cloudflare SSL
- Hosting provider-ийн SSL

---

## Socket.IO Configuration

Socket.IO нь backend сервер дээр ажиллана. Frontend дээр `NEXT_PUBLIC_SOCKET_URL` тохируулсан байх ёстой.

---

## Testing

Production deployment-ийн дараа шалгах:

1. Backend health check: `curl https://api.agentbuy.mn/`
2. Frontend ажиллаж байгаа эсэх: `https://agentbuy.mn`
3. API холболт: Browser console дээр network requests шалгах
4. Authentication: Login/Register тест хийх

