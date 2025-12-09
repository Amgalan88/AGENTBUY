# ✅ Vercel Settings - Одоо хийх алхмууд

## ⚠️ vercel.json файл зассан!

`rootDirectory` property устгасан (Vercel дээр энэ property хүчинтэй биш).

---

## 🔧 Vercel Dashboard дээр тохиргоо засах:

### Step 1: Project Settings руу очих

1. **Vercel Dashboard** → **agentbuy** төсөл
2. **Settings** tab → **General** хэсэг

### Step 2: Root Directory тохируулах ⚠️ ЧУХАЛ!

**General Settings** хэсэгт:

1. **Root Directory** талбар олох
2. Утга: `frontend` гэж бичих
3. **Save** дарна

### Step 3: Environment Variables нэмэх

**Settings** → **Environment Variables**:

1. **"Add New"** дарна
2. Дараах утгуудыг нэмнэ:

   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://agentbuy-backend.onrender.com
   Environment: Production, Preview, Development (бүгдийг сонгох)
   ```

   ```
   Name: NEXT_PUBLIC_SOCKET_URL
   Value: https://agentbuy-backend.onrender.com
   Environment: Production, Preview, Development (бүгдийг сонгох)
   ```

   ⚠️ **Анхаар:** Backend-ийг эхлээд Render дээр deploy хийж, URL-ийг авна уу!

3. **"Save"** дарна

### Step 4: Build Settings шалгах

**Settings** → **General**:

- **Framework Preset:** `Next.js` (automatically detected)
- **Build Command:** Хоосон байх (эсвэл `npm run build`)
- **Output Directory:** Хоосон байх (эсвэл `.next`)
- **Install Command:** Хоосон байх (эсвэл `npm install`)

Эдгээр нь `vercel.json` файлаас автоматаар авна.

### Step 5: Redeploy хийх

1. **Deployments** tab руу очих
2. Сүүлийн failed deployment дээр **"..."** → **"Redeploy"**
   - Эсвэл **"Deploy"** → **"Deploy"** (хамгийн сүүлийн commit)

---

## ✅ Шалгах:

Deploy амжилттай бол:
- ✅ **"Ready"** статус (ногоон)
- ✅ Frontend URL дээр сайт харагдана
- ✅ Build log дээр алдаа байхгүй

---

## 📝 Товчхон:

1. **Settings** → **General** → **Root Directory** = `frontend` ⚠️
2. **Settings** → **Environment Variables** нэмэх
3. **Redeploy** хийх

---

**Одоо Vercel Dashboard дээр Root Directory = `frontend` тохируулаад redeploy хийх!** 🚀

