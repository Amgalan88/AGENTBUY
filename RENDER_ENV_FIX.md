# 🔧 Render Environment Variables Засвар

## ⚠️ Олдсон Асуудлууд

Dashboard дээр харагдаж байгаа environment variables-д дараах асуудлууд байна:

1. **JWT_SECRET** - Placeholder текст байна, бодит secret байх ёстой
2. **DATABASE_URL** - Бүрэн connection string байхгүй байна

## ✅ Засах Алхмууд

### 1. JWT_SECRET Засах

Render Dashboard дээр:

1. **JWT_SECRET** variable-ийн баруун талд байгаа **trash icon** дээр дараад устгана
2. **+ Add** товч дарна
3. Дараах утгуудыг оруулна:

   **KEY:** `JWT_SECRET`
   
   **VALUE:** 
   ```
    
   ```

### 2. DATABASE_URL Засах

1. **DATABASE_URL** variable-ийн баруун талд байгаа **trash icon** дээр дараад устгана
2. **+ Add** товч дарна
3. Дараах утгуудыг оруулна:

   **KEY:** `DATABASE_URL`
   
   **VALUE:**
   ```
   postgresql://postgres.onqtnnyrzqlvvfzwhyhq:Amgalan09091109@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
   ```

   **⚠️ Анхаар:** Хэрэв Supabase password өөрчлөгдсөн бол Supabase Dashboard → Settings → Database → Connection string-ээс шинэ connection string авах.

### 3. Cloudinary Variables Шалгах

Дараах variables байгаа эсэхийг шалгана (хэрэв байхгүй бол нэмнэ):

- **CLOUDINARY_CLOUD_NAME:** `dn5fzzxis`
- **CLOUDINARY_API_KEY:** `731682522556299`
- **CLOUDINARY_API_SECRET:** `01gBrlS1wtexb-uQd4UGFx7l0Jo`
- **CLOUDINARY_FOLDER:** `agentbuy`

### 4. Хадгалах ба Deploy

1. Бүх environment variables-ийг зассан дараа
2. Доод талд байгаа **"Save, rebuild, and deploy"** товч дарна
3. Deploy процесс эхлэх хүртэл хүлээнэ (3-5 минут)

## 🔍 Шалгах

Deploy амжилттай болсны дараа:

1. **Logs** хэсэг рүү ороод build процесс амжилттай эсэхийг шалгана:
   ```
   ✓ npm install
   ✓ npx prisma generate
   ✓ npx prisma migrate deploy
   ✓ npm start
   ```

2. Server ажиллаж байгаа эсэхийг шалгана:
   ```bash
   curl https://agentbuy-backend.onrender.com/
   ```
   
   **Хариу:** `AGENTBUY Backend API`

## 📋 Бүрэн Environment Variables Жагсаалт

Render Dashboard дээр дараах variables байх ёстой:

| KEY | VALUE |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | (Render автоматаар өгнө) |
| `DATABASE_URL` | `postgresql://postgres.onqtnnyrzqlvvfzwhyhq:Amgalan09091109@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1` |
| `JWT_SECRET` | `91c75009b714fa141a93395e218cf95a3a863bc5159a0d989ca4e37d7c3da12b63685a89ddf5c2bb3fa91d547c7072dfe0f447f5ef5d6efdeb496df2c86716d3` |
| `CLIENT_URL` | `https://agentbuy.mn,https://www.agentbuy.mn` |
| `CLOUDINARY_CLOUD_NAME` | `dn5fzzxis` |
| `CLOUDINARY_API_KEY` | `731682522556299` |
| `CLOUDINARY_API_SECRET` | `01gBrlS1wtexb-uQd4UGFx7l0Jo` |
| `CLOUDINARY_FOLDER` | `agentbuy` |

## ⚠️ Аюулгүй байдлын Анхааруулга

- **JWT_SECRET** нь production дээр ашиглагдаж байгаа тул заавал өөрчлөх ёстой
- Энэ secret-ийг хэнд ч хуваалцахгүй байх
- Хэрэв secret алдагдах бол бүх хэрэглэгчдэд дахин нэвтрэх шаардлагатай болно

---

**✅ Бэлэн!** Дээрх алхмуудыг дагаснаар Render дээр deploy амжилттай болно.

