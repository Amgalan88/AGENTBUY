# 🚀 Production Deploy - Одоо хийх алхмууд

## ✅ Step 1: GitHub руу push хийгдсэн!
- ✅ Бүх өөрчлөлтүүд GitHub руу push хийгдлээ
- ✅ Repository: `https://github.com/Amgalan88/AGENTBUY.git`

---

## 🌐 Step 2: Render дээр Backend Deploy (5-10 минут)

### 2.1 Render Dashboard дээр Web Service үүсгэх:

1. **render.com** дээр нэвтрэх (эсвэл account үүсгэх)

2. **"New +"** → **"Web Service"** дарна

3. **GitHub repository connect хийх:**
   - "Connect GitHub" → `Amgalan88/AGENTBUY` repo сонгох
   - Эсвэл аль хэдийн connect хийсэн бол repo сонгох

4. **Settings тохируулах:**

   **Basic:**
   - **Name:** `agentbuy-backend`
   - **Region:** `Singapore` (эсвэл таны ойрын region)
   - **Branch:** `main`
   - **Root Directory:** `backend` ⚠️ **ЭНЭ НЬ ЧУХАЛ!**
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. **Environment Variables нэмэх:**

   Render Dashboard → **Environment** tab → **"Add Environment Variable"**:

   ```
   NODE_ENV = production
   ```

   ```
   MONGO_URI = mongodb+srv://amgalan:amgalan112233@cluster0.fbocqjz.mongodb.net/agentbuy
   ```

   ```
   JWT_SECRET = <шинэ-утга-үүсгэх>
   ```
   ⚠️ **JWT_SECRET үүсгэх:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Үүссэн утгыг Render дээр JWT_SECRET-д тавих!

   ```
   CLIENT_URL = https://agentbuy.mn,https://www.agentbuy.mn,https://agentbuy.onrender.com
   ```

   ```
   CLOUDINARY_CLOUD_NAME = dn5fzzxis
   ```

   ```
   CLOUDINARY_API_KEY = 731682522556299
   ```

   ```
   CLOUDINARY_API_SECRET = 01gBrlS1wtexb-uQd4UGFx7l0Jo
   ```

   ```
   CLOUDINARY_FOLDER = agentbuy
   ```

6. **"Create Web Service"** дарна

7. **Deploy хүлээх:**
   - Build процесс эхэлнэ (2-5 минут)
   - Logs дээр процесс харагдана
   - "Live" статус гарвал амжилттай!

### 2.2 Backend URL авах:

Deploy амжилттай болсны дараа:
- Render Dashboard → **agentbuy-backend** → **Settings**
- **Service URL** харагдана (жишээ: `https://agentbuy-backend.onrender.com`)

⚠️ **Энэ URL-ийг тэмдэглэх!** (Frontend deploy-д хэрэгтэй)

### 2.3 Testing:

```bash
curl https://agentbuy-backend.onrender.com/
```

**Хариу:** `AGENTBUY Backend API` байх ёстой.

---

## 🎨 Step 3: Frontend Deploy (Vercel) (5 минут)

### 3.1 Vercel дээр нэвтрэх:

1. **vercel.com** дээр нэвтрэх (эсвэл account үүсгэх)

2. **"Add New Project"** дарна

3. **GitHub repository сонгох:**
   - `Amgalan88/AGENTBUY` repo сонгох

4. **Project Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend` ⚠️ **ЭНЭ НЬ ЧУХАЛ!**
   - **Build Command:** `npm run build` (automatically detected)
   - **Output Directory:** `.next` (automatically detected)

5. **Environment Variables нэмэх:**

   Vercel Dashboard → **Settings** → **Environment Variables**:

   ```
   NEXT_PUBLIC_API_URL = https://agentbuy-backend.onrender.com
   ```
   ⚠️ **agentbuy-backend.onrender.com** нь Step 2-оос авсан URL!

   ```
   NEXT_PUBLIC_SOCKET_URL = https://agentbuy-backend.onrender.com
   ```

6. **"Deploy"** дарна

7. **Deploy хүлээх:**
   - Build процесс (2-3 минут)
   - "Ready" статус гарвал амжилттай!

### 3.2 Frontend URL авах:

- Vercel Dashboard → **Deployments**
- Frontend URL харагдана (жишээ: `https://agentbuy.vercel.app`)

---

## ✅ Step 4: Testing (5 минут)

### 4.1 Backend Health Check:
```bash
curl https://agentbuy-backend.onrender.com/
```
✅ **Хариу:** `AGENTBUY Backend API`

### 4.2 Frontend Testing:

1. Browser дээр frontend URL нээх (жишээ: `https://agentbuy.vercel.app`)

2. **Browser Console шалгах:**
   - F12 → Console tab
   - Алдаа байхгүй эсэх шалгах
   - Network tab → API requests амжилттай эсэх шалгах

3. **Login/Register тест:**
   - Register шинэ account
   - Login хийх
   - Cookie зөв set хийгдсэн эсэх шалгах (DevTools → Application → Cookies)

4. **Socket.io тест:**
   - Console дээр WebSocket connection байгаа эсэх шалгах
   - Network tab → WS (WebSocket) connection харагдах ёстой

5. **Захиалга үүсгэх тест:**
   - Захиалга үүсгэх
   - Зураг upload хийх (Cloudinary)
   - Real-time updates ажиллаж байгаа эсэх

---

## 🔒 Step 5: External Services тохиргоо

### 5.1 MongoDB Atlas Network Access:

1. **MongoDB Atlas Dashboard** → **Network Access**
2. **"Add IP Address"** → **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - Эсвэл Render IP нэмэх (илүү аюулгүй)

### 5.2 Cloudinary Domain Whitelist:

1. **Cloudinary Dashboard** → **Settings** → **Security**
2. **"Allowed fetch domains"** хэсэгт:
   - `agentbuy.mn`
   - `www.agentbuy.mn`
   - `*.agentbuy.mn`
   - `agentbuy.vercel.app` (Vercel URL)
   - `localhost` (development)

---

## 🌍 Step 6: Custom Domain (Сонголт)

### 6.1 Backend Custom Domain (Render):

1. Render Dashboard → **agentbuy-backend** → **Settings** → **Custom Domains**
2. **`api.agentbuy.mn`** нэмэх
3. **DNS тохиргоо:**
   ```
   Type: CNAME
   Name: api
   Value: agentbuy-backend.onrender.com
   ```

### 6.2 Frontend Custom Domain (Vercel):

1. Vercel Dashboard → **Settings** → **Domains**
2. **`agentbuy.mn`** нэмэх
3. **DNS тохиргоо хийх** (Vercel-ийн зааврыг дагана уу)

---

## 📊 Step 7: Monitoring Setup

### Render Dashboard:
- **Metrics** → CPU, Memory usage
- **Logs** → Real-time logs
- **Events** → Deploy history

### Vercel Dashboard:
- **Analytics** → Performance metrics
- **Logs** → Function logs
- **Deployments** → Deploy history

---

## ⚠️ Анхаарах зүйлс:

### Render Free Plan:
- ✅ SSL certificate (auto)
- ⚠️ 15 минут идэвхигүй бол sleep mode (cold start ~30 секунд)
- ⚠️ 750 hours/month

### Production Tips:
1. **JWT_SECRET** заавал өөрчлөх!
2. **MongoDB Network Access** тохируулах
3. **Cloudinary Domain Whitelist** тохируулах
4. **CORS** зөв тохируулсан эсэх шалгах
5. **Environment Variables** зөв эсэх шалгах

---

## 🆘 Troubleshooting:

### Backend ажиллахгүй:
- Render Logs шалгах → Алдааны мэдээлэл харагдана
- Environment Variables бүгд байгаа эсэх шалгах
- MongoDB connection шалгах

### CORS алдаа:
- Backend `CLIENT_URL` дээр frontend URL байгаа эсэх шалгах

### Socket.io ажиллахгүй:
- Frontend `NEXT_PUBLIC_SOCKET_URL` зөв эсэх шалгах
- Browser Console → Network → WebSocket connection

---

## ✅ Checklist:

- [ ] GitHub push хийгдсэн
- [ ] Render account үүсгэсэн
- [ ] Backend Web Service үүсгэсэн
- [ ] Environment variables бүгд нэмсэн (JWT_SECRET заавал!)
- [ ] Backend deploy амжилттай
- [ ] Backend URL тэмдэглэсэн
- [ ] Vercel account үүсгэсэн
- [ ] Frontend Project үүсгэсэн
- [ ] Frontend environment variables тохируулсан
- [ ] Frontend deploy амжилттай
- [ ] Testing хийсэн
- [ ] MongoDB Network Access тохируулсан
- [ ] Cloudinary Domain Whitelist тохируулсан

---

## 🎉 Бэлэн!

Production дээр ажиллаж байна! 🚀

- **Backend:** `https://agentbuy-backend.onrender.com`
- **Frontend:** `https://agentbuy.vercel.app`

---

**Асуудал гарвал:**
- Render Logs шалгах
- Vercel Logs шалгах
- Browser Console шалгах

