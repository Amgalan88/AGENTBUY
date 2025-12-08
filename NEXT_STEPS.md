# AgentBuy - Дараагийн алхмууд (MVP → Production)

## ✅ Одоогоор хийгдсэн зүйлс:
- ✅ Frontend ↔ Backend интеграци
- ✅ MongoDB холболт
- ✅ Domain тохиргоо (agentbuy.mn)
- ✅ CORS тохиргоо
- ✅ API endpoints бүгд холбогдсон

---

## 🚀 Production дээр deploy хийхээс өмнө:

### 1. Security тохиргоо (ЗААВАЛ!)

**Backend `.env` файлд:**
```env
JWT_SECRET=<урт-санамсаргүй-тэмдэгт-мөр-50+тэмдэгт>
```

**JWT_SECRET үүсгэх:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Cloudinary тохиргоо (Зураг хадгалах)

**Backend `.env` файлд:**
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=your-preset  # optional
CLOUDINARY_FOLDER=agentbuy
```

**Яагаад хэрэгтэй вэ?**
- Одоогоор зураг base64 string байдлаар MongoDB-д хадгалагдаж байна
- Cloudinary тохируулбал зураг Cloudinary-д upload хийгдээд URL-ийг хадгална
- Database хэмжээ багасна, хурд сайжирна

### 3. Environment Variables Production дээр

**Backend:**
- `NODE_ENV=production`
- `PORT` (hosting provider-ийн порт)
- `CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn`

**Frontend (Vercel/Netlify):**
- `NEXT_PUBLIC_API_URL=https://api.agentbuy.mn` (эсвэл backend URL)
- `NEXT_PUBLIC_SOCKET_URL=https://api.agentbuy.mn`

---

## 📋 Production Deployment Checklist

### Backend:
- [ ] `JWT_SECRET` аюулгүй утгаар солих
- [ ] `NODE_ENV=production` тохируулах
- [ ] Cloudinary тохиргоо хийх (зураг upload хийх бол)
- [ ] MongoDB Atlas Network Access тохируулах (0.0.0.0/0 эсвэл серверийн IP)
- [ ] SSL/HTTPS суух
- [ ] PM2 эсвэл process manager ашиглах
- [ ] Error logging тохируулах

### Frontend:
- [ ] Environment variables тохируулах
- [ ] Build тест хийх: `npm run build`
- [ ] Vercel/Netlify дээр deploy хийх
- [ ] Domain тохируулах (agentbuy.mn)

### Testing:
- [ ] Login/Register тест
- [ ] Order create тест
- [ ] Image upload тест
- [ ] Socket.io real-time тест
- [ ] Mobile responsive тест

---

## 🔄 Database Migration (Хэрэв хэрэгтэй бол)

Одоогоор MongoDB дээр base64 string байдлаар зураг хадгалагдаж байгаа бол, Cloudinary-д шилжүүлэх script:

**Migration script үүсгэх:**
```javascript
// migrate-images.js
// Энэ script нь MongoDB дээрх base64 зурагнуудыг Cloudinary-д upload хийж, URL-аар солино
```

**Анхаар:** Энэ нь сонголт. Шинэ захиалганууд Cloudinary ашиглана (тохируулсан бол).

---

## 📊 Monitoring & Analytics

Production дээр нэмэх зүйлс:
- [ ] Error tracking (Sentry гэх мэт)
- [ ] Analytics (Google Analytics эсвэл өөр)
- [ ] Server monitoring (Uptime monitoring)
- [ ] Database backup strategy

---

## 🐛 Bug Fixes & Improvements

Одоогоор шалгах зүйлс:
- [ ] Image upload ажиллаж байгаа эсэх
- [ ] Socket.io real-time updates ажиллаж байгаа эсэх
- [ ] Mobile responsive зөв харагдаж байгаа эсэх
- [ ] Error handling зөв ажиллаж байгаа эсэх

---

## 🎯 MVP → Production алхмууд:

1. **Security тохиргоо** (JWT_SECRET) - ЗААВАЛ!
2. **Cloudinary тохиргоо** - Зураг хадгалах
3. **Production environment variables** тохируулах
4. **Deploy хийх** (Backend + Frontend)
5. **Testing хийх**
6. **Monitoring тохируулах**

---

## 💡 Зөвлөмж:

**Одоо хийх:**
1. JWT_SECRET өөрчлөх (security)
2. Cloudinary тохиргоо хийх (зураг хадгалах)
3. Production deploy хийх
4. Testing хийх

**Дараа нь:**
- Database migration (хэрэв хэрэгтэй бол)
- Monitoring тохируулах
- Performance optimization
- Additional features

