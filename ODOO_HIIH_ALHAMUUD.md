# ✅ Одоо хийх алхмууд

## 🎯 Хийгдсэн зүйлс:

✅ GitHub руу push хийгдсэн
✅ Next.js 16.0.7 руу шинэчлэгдсэн (CVE засварласан)
✅ vercel.json зассан
✅ Environment Variables тохируулсан (Vercel дээр)

---

## 🚀 Одоо хийх зүйлс (2 алхам):

### 1️⃣ Vercel Dashboard дээр Root Directory тохируулах (2 минут)

**Энэ нь хамгийн чухал!** Root Directory тохируулаагүй бол deploy амжилтгүй болно.

**Алхмууд:**

1. Vercel Dashboard дээр одоо байгаа Settings хуудсанд:
   - Зүүн талын sidebar → **"General"** дарна (Environment Variables биш!)

2. **"Root Directory"** хэсгийг олох

3. **`frontend`** гэж оруулах эсвэл сонгох

4. **"Save"** дарна

5. **Deployments** tab руу очих → **"Redeploy"** дарна

---

### 2️⃣ Render дээр Backend Deploy хийх (5-10 минут)

#### Алхам 1: Render Dashboard

1. **render.com** дээр нэвтрэх (эсвэл account үүсгэх)

2. **"New +"** → **"Web Service"** дарна

3. **GitHub repository connect хийх:**
   - "Connect GitHub" → `Amgalan88/AGENTBUY` repo сонгох

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
   JWT_SECRET = c4f0b4505512b762007bfd2d504d2eb9a01f7d7b1f9973d3f48f6aba7596a19b611dacd11b194f9e37b590760d62826a6df3a0960b4318dc98bfc5ffb776d80a
   ```
   ⚠️ Энэ утгыг ашиглана уу!

   ```
   CLIENT_URL = https://agentbuy.mn,https://www.agentbuy.mn,https://agentbuy.vercel.app
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

7. **Deploy хүлээх** (2-5 минут)

#### Алхам 2: Backend URL авах

Deploy амжилттай болсны дараа:
- Render Dashboard → **agentbuy-backend** → **Settings**
- **Service URL** харагдана (жишээ: `https://agentbuy-backend.onrender.com`)

⚠️ **Энэ URL-ийг тэмдэглэх!** Frontend environment variables-д ашиглана!

#### Алхам 3: Vercel дээр Environment Variables шинэчлэх

Backend URL авсны дараа Vercel Dashboard дээр:

1. **Settings** → **Environment Variables**
2. `NEXT_PUBLIC_API_URL` утгыг шинэчлэх:
   - Одоо: `https://agentbuy.onrender.com`
   - Шинэ: `https://agentbuy-backend.onrender.com` (Render-ийн backend URL)
3. `NEXT_PUBLIC_SOCKET_URL` утгыг шинэчлэх:
   - Одоо: `https://agentbuy.onrender.com`
   - Шинэ: `https://agentbuy-backend.onrender.com`
4. **Save** → **Redeploy**

---

### 3️⃣ Testing (5 минут)

#### Backend Health Check:
```bash
curl https://agentbuy-backend.onrender.com/
```
✅ **Хариу:** `AGENTBUY Backend API`

#### Frontend Testing:
1. Browser дээр Vercel URL нээх
2. **Browser Console** (F12) → Алдаа байхгүй эсэх шалгах
3. **Network tab** → API requests амжилттай эсэх
4. **Login/Register** тест хийх
5. **Socket.io** connection шалгах (Console → WebSocket)

---

## 📋 Checklist:

### Vercel:
- [ ] Root Directory = `frontend` тохируулсан
- [ ] Environment Variables зөв (backend URL)
- [ ] Deploy амжилттай

### Render:
- [ ] Backend Web Service үүсгэсэн
- [ ] Root Directory = `backend` тохируулсан
- [ ] Environment variables бүгд нэмсэн (JWT_SECRET заавал!)
- [ ] Backend deploy амжилттай
- [ ] Backend URL авсан

### Testing:
- [ ] Backend health check амжилттай
- [ ] Frontend ажиллаж байна
- [ ] API холболт амжилттай
- [ ] Login/Register ажиллаж байна
- [ ] Socket.io ажиллаж байна

---

## 🎉 Бэлэн!

Дараах 2 зүйлийг хийсний дараа production дээр ажиллана:

1. ✅ Vercel → Settings → General → Root Directory = `frontend`
2. ✅ Render дээр backend deploy хийх

---

## 🆘 Асуудал гарвал:

### Vercel deploy алдаа:
- Settings → General → Root Directory = `frontend` байгаа эсэх шалгах
- Logs харах → Алдааны мэдээлэл

### Render deploy алдаа:
- Root Directory = `backend` байгаа эсэх шалгах
- Environment Variables бүгд байгаа эсэх шалгах
- Logs харах → Алдааны мэдээлэл

---

**Одоо эхлээд Vercel Dashboard дээр Root Directory засаад, дараа нь Render дээр backend deploy хийгээрэй!** 🚀

