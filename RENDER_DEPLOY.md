# 🚀 Render дээр Deploy хийх заавар - AgentBuy

## 📋 Алхам 1: Render Account үүсгэх

1. [Render.com](https://render.com) дээр бүртгүүлэх (эсвэл нэвтрэх)
2. GitHub account-аа Render-д холбох

---

## 🔧 Алхам 2: GitHub дээр код push хийх

```bash
# Одоогийн өөрчлөлтүүдийг commit хийх
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## 🌐 Алхам 3: Backend Deploy (Render Web Service)

### 3.1 Render Dashboard дээр шинэ Web Service үүсгэх:

1. **Render Dashboard** → **"New +"** → **"Web Service"**
2. GitHub repo сонгох (эсвэл repo-оо connect хийх)
3. **Settings** тохируулах:

   **Basic Settings:**
   - **Name:** `agentbuy-backend`
   - **Region:** Singapore (эсвэл таны хамгийн ойр)
   - **Branch:** `main`
   - **Root Directory:** `backend` ⚠️ Энэ нь чухал!
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

   **Environment Variables** (Render Dashboard дээр нэмэх):
   
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=mongodb+srv://amgalan:amgalan112233@cluster0.fbocqjz.mongodb.net/agentbuy
   JWT_SECRET=<шинэ-аюулгүй-утга-128+тэмдэгт>
   CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn,https://agentbuy.onrender.com
   CLOUDINARY_CLOUD_NAME=dn5fzzxis
   CLOUDINARY_API_KEY=731682522556299
   CLOUDINARY_API_SECRET=01gBrlS1wtexb-uQd4UGFx7l0Jo
   CLOUDINARY_FOLDER=agentbuy
   ```

   **⚠️ Анхаар:**
   - `PORT` нь Render-д автоматаар өгөгдөнө (ихэвчлэн `10000` эсвэл өөр утга)
   - `JWT_SECRET` заавал шинэ аюулгүй утга байх ёстой!
   - `CLIENT_URL` дээр Render URL нэмэх (`https://agentbuy.onrender.com`)

### 3.2 JWT_SECRET үүсгэх:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Үүссэн утгыг Render Dashboard дээр `JWT_SECRET`-д тавих.

### 3.3 Deploy хийх:

1. **"Create Web Service"** дарна
2. Build процесс эхэлнэ (3-5 минут)
3. Deploy амжилттай болсон эсэхийг шалгах

---

## 🔍 Алхам 4: Backend URL авах

Deploy амжилттай болсны дараа:
- **Render Dashboard** → **agentbuy-backend** → **Settings**
- **Service URL** харагдана (жишээ: `https://agentbuy-backend.onrender.com`)

⚠️ **Free plan дээр:**
- Сервер 15 минут идэвхигүй бол унтарна
- Эхний request удаан (cold start ~30 секунд)
- Auto SSL certificate сууна

---

## 🎨 Алхам 5: Frontend Deploy (Vercel эсвэл Render)

### Сонголт A: Vercel (Зөвлөмж) ⭐

Vercel нь Next.js-д илүү тохиромжтой, хурдан:

```bash
cd frontend
vercel --prod
```

**Environment Variables (Vercel Dashboard дээр):**
```
NEXT_PUBLIC_API_URL=https://agentbuy-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://agentbuy-backend.onrender.com
```

### Сонголт B: Render дээр Frontend

1. **Render Dashboard** → **"New +"** → **"Web Service"**
2. Settings:
   - **Name:** `agentbuy-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://agentbuy-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://agentbuy-backend.onrender.com
```

---

## ✅ Алхам 6: Testing

### Backend Health Check:
```bash
curl https://agentbuy-backend.onrender.com/
```

**Хариу:** `AGENTBUY Backend API`

### Frontend:
- Browser дээр frontend URL нээх
- Login/Register тест хийх
- API холболт шалгах (Browser Console → Network tab)

---

## 🔒 Алхам 7: Custom Domain (Сонголт)

### Backend Custom Domain:

1. **Render Dashboard** → **agentbuy-backend** → **Settings** → **Custom Domains**
2. Domain нэмэх: `api.agentbuy.mn`
3. DNS тохиргоо:
   ```
   Type: CNAME
   Name: api
   Value: agentbuy-backend.onrender.com
   ```

### Frontend Custom Domain:

Vercel дээр:
1. **Settings** → **Domains**
2. `agentbuy.mn` нэмэх
3. DNS тохиргоо хийх

---

## 🔧 Troubleshooting

### Backend ажиллахгүй байвал:

1. **Render Logs шалгах:**
   - Render Dashboard → **agentbuy-backend** → **Logs**
   - Алдааны мэдээлэл харагдана

2. **Environment Variables шалгах:**
   - Бүх environment variables зөв эсэх шалгах
   - `MONGO_URI`, `JWT_SECRET` байгаа эсэх

3. **MongoDB Network Access:**
   - MongoDB Atlas → Network Access
   - `0.0.0.0/0` эсвэл Render IP нэмэх

### CORS алдаа гарвал:

Backend `CLIENT_URL` environment variable дээр frontend URL байгаа эсэх шалгах:
```
CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn,https://agentbuy.onrender.com
```

### Socket.io ажиллахгүй байвал:

1. Frontend `NEXT_PUBLIC_SOCKET_URL` зөв эсэх шалгах
2. Backend logs дээр Socket.io эхэлсэн эсэх шалгах

---

## 📊 Monitoring

### Render Dashboard:
- **Metrics** → CPU, Memory usage харах
- **Logs** → Real-time logs харах
- **Events** → Deploy history харах

---

## 💰 Pricing

### Free Plan:
- ✅ SSL certificate (auto)
- ✅ 750 hours/month (тус бүр)
- ⚠️ 15 минут идэвхигүй бол sleep mode (cold start)
- ⚠️ No custom domain (free plan дээр)

### Starter Plan ($7/month):
- ✅ Custom domain
- ✅ No sleep mode
- ✅ Faster cold start
- ✅ Better performance

---

## 🎯 Quick Checklist:

- [ ] GitHub repo push хийсэн
- [ ] Render account үүсгэсэн
- [ ] Backend Web Service үүсгэсэн
- [ ] Environment variables бүгд нэмсэн (JWT_SECRET заавал!)
- [ ] Backend deploy амжилттай
- [ ] Frontend deploy хийсэн (Vercel эсвэл Render)
- [ ] Frontend environment variables тохируулсан
- [ ] Testing хийсэн
- [ ] Custom domain тохируулсан (сонголт)

---

## 🚀 Deploy хийх дараалал:

1. ✅ Backend deploy хийх (Render)
2. ✅ Backend URL авах (`https://agentbuy-backend.onrender.com`)
3. ✅ Frontend deploy хийх (Vercel эсвэл Render)
4. ✅ Frontend environment variables тохируулах
5. ✅ Testing хийх

**Бэлэн! 🎉**

