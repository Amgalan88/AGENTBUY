# ✅ Render Settings Шалгах

## 🔍 Одоогийн Тохиргоо:

Dashboard дээр харагдаж байгаа зүйлс:

### ✅ Build Command (Зөв):
```
npm install && npx prisma generate && npx prisma migrate deploy
```

### ✅ Root Directory:
`backend/` prefix харагдаж байна - энэ нь Root Directory `backend` гэж тохируулсан гэсэн үг.

## 📋 Бүрэн Шалгалт:

### 1. General Settings шалгах

Render Dashboard → **Settings** → **General** дээр:

- ✅ **Root Directory:** `backend` байх ёстой
- ✅ **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
- ✅ **Start Command:** `npm start`
- ✅ **Runtime:** `Node`

### 2. Environment Variables шалгах

**Environment** tab дээр:

- ✅ `DATABASE_URL` - Supabase PostgreSQL connection string
- ✅ `JWT_SECRET` - Бодит secret утга (placeholder биш!)
- ✅ `NODE_ENV=production`
- ✅ `CLIENT_URL`
- ✅ Cloudinary variables

### 3. Build Command Дэлгэрэнгүй

Build Command дээр дараах зүйлс харагдах ёстой:

```
npm install && npx prisma generate && npx prisma migrate deploy
```

**Анхаар:** 
- `backend/ $` prefix нь зөв - энэ нь Root Directory `backend` гэж тохируулсан гэсэн үг
- Build command дээр `cd backend &&` хэрэггүй (Root Directory тохируулсан бол)

### 4. Pre-Deploy Command

Pre-Deploy Command хоосон байх нь зөв (хэрэв database migration build command-д байгаа бол).

## ✅ Бэлэн Deploy Хийх

Хэрэв дээрх бүх зүйлс зөв байвал:

1. **Settings** → **"Save Changes"** дарна (хэрэв өөрчлөлт хийсэн бол)
2. **Manual Deploy** → **"Deploy latest commit"** дарна
3. Эсвэл хүлээх - auto-deploy идэвхжсэн бол автоматаар deploy хийгдэнэ

## 🔍 Deploy Амжилттай Эсэхийг Шалгах

**Logs** хэсэг дээр дараах зүйлс харагдах ёстой:

```
✓ npm install
✓ npx prisma generate
  Generating Prisma Client...
✓ npx prisma migrate deploy
  Applying migration...
✓ npm start
  Server running on...
```

## ⚠️ Хэрэв Алдаа Гарвал

1. **Logs** дээрх алдааны мэдээллийг шалгах
2. **DATABASE_URL** зөв эсэх шалгах
3. **JWT_SECRET** placeholder биш, бодит утга эсэх шалгах
4. **Root Directory** `backend` гэж тохируулсан эсэх шалгах

---

**✅ Бэлэн!** Дээрх бүх зүйлс зөв байвал deploy амжилттай болно.

