# 🔍 Зураг харагдахгүй байгаа асуудлыг шалгах

## 🔍 Step-by-step шалгах:

### 1. Browser Console шалгах (F12 → Console):

**Шалгах зүйлс:**
- ⚠️ Base64 warning: `⚠️ Image still in base64 format`
- ❌ Image load error: `Image load error: ...`
- ❌ Network error: CORS, 404, гэх мэт

**Console дээр харагдах мэдээлэл:**
```javascript
// Base64 байвал:
⚠️ Image still in base64 format (not uploaded to Cloudinary): order_id

// Зураг load хийхэд алдаа гарвал:
Image load error: https://res.cloudinary.com/...
```

### 2. Network Tab шалгах (F12 → Network):

**Шалгах зүйлс:**
- Cloudinary URL-ууд амжилттай load хийгдэж байгаа эсэх
- HTTP status: 200 (амжилттай) эсвэл 404/403 (алдаа)
- CORS алдаа байгаа эсэх

**Харагдах ёстой:**
- `https://res.cloudinary.com/dn5fzzxis/image/upload/...` → Status: 200

**Алдаа гарвал:**
- 403 Forbidden → Cloudinary domain whitelist асуудал
- 404 Not Found → Зураг upload хийгдээгүй эсвэл URL буруу

### 3. Backend Logs шалгах:

**Development (localhost):**
```bash
# Backend terminal-д logs харах
```

**Production (Render):**
- Render Dashboard → Logs

**Харагдах ёстой:**
```
[Cloudinary] Uploading image... (base64 length: 12345)
[Cloudinary] ✅ Upload successful, URL: https://res.cloudinary.com/...
[Cloudinary] ✅ Images uploaded: ['https://res.cloudinary.com/...']
```

**Алдаа гарвал:**
```
[Cloudinary] ❌ Upload error: ...
[Cloudinary] Upload failed - Status: 401
```

### 4. Database шалгах:

**MongoDB дээр зураг хэрхэн хадгалагдсан эсэх:**
```javascript
// Зөв (Cloudinary URL):
{
  images: ["https://res.cloudinary.com/dn5fzzxis/image/upload/..."]
}

// Буруу (base64 string):
{
  images: ["data:image/png;base64,iVBORw0KGgo..."]
}
```

---

## 🛠️ Түгээмэл алдаанууд:

### Алдаа 1: Cloudinary credentials буруу

**Шалтгаан:**
- Backend `.env` дээр Cloudinary credentials буруу эсвэл байхгүй

**Шийдэл:**
1. Backend `.env` файл шалгах:
   ```
   CLOUDINARY_CLOUD_NAME=dn5fzzxis
   CLOUDINARY_API_KEY=731682522556299
   CLOUDINARY_API_SECRET=01gBrlS1wtexb-uQd4UGFx7l0Jo
   ```
2. Backend logs шалгах: `[Cloudinary] Cloudinary is not configured`

### Алдаа 2: Cloudinary Domain Whitelist

**Шалтгаан:**
- Frontend domain whitelist-д нэмэгдээгүй

**Шийдэл:**
1. Cloudinary Dashboard → Settings → Security
2. "Allowed fetch domains" эсвэл "Restricted media delivery" хэсэгт:
   - `agentbuy.mn`
   - `www.agentbuy.mn`
   - `*.agentbuy.mn`
   - `*.vercel.app` (Vercel)
   - `*.onrender.com` (Render)
   - `localhost` (development)

### Алдаа 3: Base64 string хадгалагдаж байна

**Шалтгаан:**
- Backend дээр Cloudinary upload амжилтгүй, base64 string хадгалагдсан

**Шийдэл:**
1. Backend logs шалгах - upload алдаа гарсан эсэх
2. Database шалгах - base64 string байгаа эсэх
3. Migration script ажиллуулах (хэрэв хэрэгтэй бол):
   ```bash
   cd backend
   node migrate-images-to-cloudinary.js
   ```

### Алдаа 4: Frontend filter хийж байна

**Шалтгаан:**
- Frontend дээр base64 string filter хийж, зураг харуулахгүй байна

**Шийдэл:**
- Энэ нь зөв! Base64 string-уудыг filter хийх ёстой
- Backend дээр Cloudinary upload амжилттай эсэх шалгах

---

## ✅ Quick Fix:

### 1. Backend .env файл шалгах:
```bash
cd backend
cat .env | grep CLOUDINARY
```

### 2. Backend logs шалгах:
```bash
# Development - terminal дээр logs харах
# Production - Render Dashboard → Logs
```

### 3. Browser Console шалгах:
- F12 → Console
- Warning эсвэл error харагдаж байгаа эсэх

### 4. Network Tab шалгах:
- F12 → Network
- Cloudinary URL-ууд амжилттай load хийгдэж байгаа эсэх

---

## 📋 Checklist:

- [ ] Backend .env дээр Cloudinary credentials байгаа эсэх
- [ ] Backend logs дээр upload амжилттай эсэх
- [ ] Cloudinary domain whitelist тохируулсан эсэх
- [ ] Browser Console дээр алдаа байгаа эсэх
- [ ] Network tab дээр Cloudinary requests амжилттай эсэх
- [ ] Database дээр Cloudinary URL хадгалагдсан эсэх

---

**Дэлгэрэнгүй алдааны мэдээлэл хэлээрэй - тэгвэл илүү тодорхой шийдэл санал болгох боломжтой!**

