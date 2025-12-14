# 🔧 Render Deploy Алдааны Засвар

## ❌ Олдсон Алдаанууд

1. **MONGO_URI буруу байсан** - Төсөл Prisma + PostgreSQL (Supabase) ашигладаг, MongoDB биш
2. **Prisma generate хийгдээгүй** - Build command дээр Prisma client үүсгэх шаардлагатай
3. **Database migration хийгдээгүй** - Production дээр migration deploy хийх шаардлагатай

## ✅ Зассан Зүйлс

### 1. `render.yaml` файл зассан:

**Өмнө:**
```yaml
buildCommand: cd backend && npm install
envVars:
  - key: MONGO_URI
    sync: false
```

**Одоо:**
```yaml
buildCommand: cd backend && npm install && npx prisma generate && npx prisma migrate deploy
envVars:
  - key: DATABASE_URL
    sync: false
```

## 📋 Render Dashboard дээр Хийх Алхмууд

### 1. Environment Variables тохируулах

Render Dashboard → **agentbuy-backend** → **Environment** дээр дараах environment variables нэмэх:

#### ⚠️ ЗААВАЛ НЭМЭХ:

```env
DATABASE_URL=postgresql://postgres.onqtnnyrzqlvvfzwhyhq:Amgalan09091109@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

**Анхаар:** Энэ нь Supabase PostgreSQL connection string. Хэрэв өөр Supabase project ашиглаж байвал өөрийн connection string-ээ ашиглана уу.

#### Бусад Environment Variables:

```env
JWT_SECRET=<шинэ-аюулгүй-утга-128+тэмдэгт>
CLOUDINARY_CLOUD_NAME=dn5fzzxis
CLOUDINARY_API_KEY=731682522556299
CLOUDINARY_API_SECRET=01gBrlS1wtexb-uQd4UGFx7l0Jo
```

**JWT_SECRET үүсгэх:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. MONGO_URI устгах (хэрэв байвал)

Render Dashboard дээр `MONGO_URI` environment variable байвал **устгана уу** - энэ нь одоо хэрэггүй.

### 3. Deploy дахин хийх

1. Render Dashboard → **agentbuy-backend** → **Manual Deploy** → **Deploy latest commit**
2. Эсвэл GitHub дээр шинэ commit push хийх (auto-deploy идэвхжсэн бол)

## 🔍 Deploy Амжилттай Эсэхийг Шалгах

### Build Process шалгах:

Render Dashboard → **Logs** дээр дараах зүйлс харагдах ёстой:

```
✓ npm install
✓ npx prisma generate
✓ npx prisma migrate deploy
✓ npm start
```

### Server ажиллаж байгаа эсэхийг шалгах:

```bash
curl https://agentbuy-backend.onrender.com/
```

**Хариу:** `AGENTBUY Backend API`

## ⚠️ Хэрэв Алдаа Гарвал

### 1. DATABASE_URL зөв эсэх шалгах

Supabase Dashboard дээр:
- Settings → Database → Connection string
- Pooler connection string авах
- `?pgbouncer=true&connection_limit=1` параметрүүд нэмэх

### 2. Prisma Migration алдаа гарвал

```bash
# Local дээр тест хийх:
cd backend
npx prisma migrate deploy
```

Хэрэв migration алдаа гарвал:
- Supabase Dashboard → Database → Migrations шалгах
- Migration файлууд зөв эсэх шалгах

### 3. Build алдаа гарвал

Render Logs дээрх алдааны мэдээллийг шалгах:
- Prisma generate алдаа
- npm install алдаа
- Environment variables дутуу эсэх

## ✅ Бэлэн!

Дээрх алхмуудыг дагаснаар Render дээр deploy амжилттай болно.

---

**Онцлох:** 
- ✅ `MONGO_URI` → `DATABASE_URL` болгосон
- ✅ Prisma generate болон migrate deploy build command-д нэмсэн
- ✅ Environment variables зөв тохируулсан

