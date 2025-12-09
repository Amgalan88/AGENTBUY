# 🔧 Vercel Deployment Алдаа засах заавар

## ⚠️ Vercel дээр "Error" гарч байвал:

### Шалтгаанууд:
1. **Root Directory зөв тохируулаагүй** (хамгийн түгээмэл!)
2. **Build command буруу**
3. **Environment variables дутуу**

---

## ✅ Засах алхмууд:

### 1. Vercel Dashboard дээр тохиргоо засах:

1. **Vercel Dashboard** → **agentbuy** төсөл → **Settings**

2. **General Settings**:
   - **Root Directory:** `frontend` ⚠️ **ЭНЭ НЬ ЧУХАЛ!**
   - **Framework Preset:** `Next.js`
   - **Build Command:** `npm run build` (эсвэл хоосон - автоматаар detect хийх)
   - **Output Directory:** `.next` (эсвэл хоосон - автоматаар detect хийх)
   - **Install Command:** `npm install` (эсвэл хоосон)

3. **Environment Variables** шалгах:
   ```
   NEXT_PUBLIC_API_URL = https://agentbuy-backend.onrender.com
   NEXT_PUBLIC_SOCKET_URL = https://agentbuy-backend.onrender.com
   ```
   ⚠️ Backend-ийг эхлээд Render дээр deploy хийж, URL-ийг авна уу!

4. **"Save"** дарна

### 2. Дахин Deploy хийх:

1. **Deployments** tab руу очих
2. Хамгийн сүүлийн failed deployment дээр **"..."** → **"Redeploy"**
   - Эсвэл **"Deploy"** → **"Deploy"** (хамгийн сүүлийн commit-аас)

---

## 🔍 Алдааг шалгах:

### Vercel Logs харах:

1. **Deployments** → Failed deployment → **"View Function Logs"**
2. Алдааны мэдээлэл харагдана:
   - Build алдаа
   - Module not found
   - Environment variable missing
   - гэх мэт

### Түгээмэл алдаанууд:

#### 1. "Cannot find module" / "Module not found":
```
Error: Cannot find module './something'
```
**Шийдэл:**
- Root Directory `frontend` байгаа эсэх шалгах
- `package.json` дээр dependencies байгаа эсэх шалгах

#### 2. "NEXT_PUBLIC_API_URL is not defined":
```
Error: NEXT_PUBLIC_API_URL is undefined
```
**Шийдэл:**
- Vercel Settings → Environment Variables → `NEXT_PUBLIC_API_URL` нэмэх
- **⚠️ Анхаар:** Environment variable нэмсний дараа дахин deploy хийх шаардлагатай!

#### 3. "Build failed":
```
Build error: ...
```
**Шийдэл:**
- Logs дээр дэлгэрэнгүй алдаа харагдана
- Ихэвчлэн syntax error, import error гэх мэт

#### 4. "Root Directory" алдаа:
```
Error: Cannot find package.json in root directory
```
**Шийдэл:**
- **Settings** → **Root Directory** → `frontend` тохируулах
- **Save** → **Redeploy**

---

## 📋 Vercel Settings Checklist:

### General:
- [ ] **Root Directory:** `frontend`
- [ ] **Framework Preset:** `Next.js`
- [ ] **Build Command:** `npm run build` (эсвэл хоосон)
- [ ] **Output Directory:** `.next` (эсвэл хоосон)
- [ ] **Install Command:** `npm install` (эсвэл хоосон)

### Environment Variables:
- [ ] `NEXT_PUBLIC_API_URL` = `https://agentbuy-backend.onrender.com`
- [ ] `NEXT_PUBLIC_SOCKET_URL` = `https://agentbuy-backend.onrender.com`

**⚠️ Анхаар:** Backend-ийг эхлээд Render дээр deploy хийж, URL-ийг авна уу!

---

## 🚀 Шинэ Deploy хийх (Root Directory зассан дараа):

### Арга 1: Vercel Dashboard:
1. **Deployments** → **"Deploy"** → **"Deploy"**
2. Build процесс хүлээх

### Арга 2: Git Push (Auto Deploy):
```bash
# Root directory тохируулалтыг хадгалахын тулд vercel.json нэмэх
git add vercel.json
git commit -m "Fix Vercel root directory configuration"
git push origin main
```

Vercel автоматаар шинэ deploy хийх болно.

---

## 🔧 vercel.json файл:

`vercel.json` файл үүсгэлээ. Энэ нь Vercel-д root directory-г автоматаар ойлгуулна.

Хэрэв энэ файл байгаа бол Vercel Dashboard дээр Root Directory тохируулах шаардлагагүй.

---

## ✅ Шалгах:

Deploy амжилттай бол:
1. ✅ **"Ready"** статус харагдана (ногоон)
2. ✅ Frontend URL дээр сайт харагдана
3. ✅ Browser Console дээр алдаа байхгүй

---

## 🆘 Асуудал байсаар байвал:

1. **Vercel Logs** дээр алдаа харах
2. **Browser Console** (F12) дээр алдаа харах
3. **Network tab** дээр API requests шалгах
4. Environment variables зөв эсэх шалгах

---

## 📝 Анхаарах зүйлс:

1. **Root Directory** заавал `frontend` байх ёстой!
2. Environment variables нэмсний дараа **redeploy** хийх шаардлагатай
3. Backend-ийг эхлээд deploy хийж, URL-ийг авна уу
4. `vercel.json` файл нь тохиргоог автомат хийж өгнө

