# 🔧 Render Prisma Client Алдааны Засвар

## ❌ Алдаа:

```
@prisma/client did not initialize yet. Please run "prisma generate"
```

## 🔍 Шалтгаан:

1. **Root Directory тохируулаагүй** - Render Dashboard дээр Root Directory `backend` гэж тохируулаагүй байна
2. **Build command зөв ажиллахгүй** - Prisma generate хийгдээгүй байна

## ✅ Засах Алхмууд:

### 1. Render Dashboard дээр Root Directory тохируулах

1. **Render Dashboard** → **AGENTBUY** → **Settings**
2. **"Root Directory"** хэсгийг олох
3. **`backend`** гэж оруулах
4. **"Save Changes"** дарна

### 2. Build Command тохируулах

**Settings** → **Build Command** дээр:

```
npm install && npx prisma generate && npx prisma migrate deploy
```

**⚠️ Анхаар:** Root Directory `backend` гэж тохируулсан бол `cd backend &&` хэрэггүй!

### 3. Start Command тохируулах

**Settings** → **Start Command** дээр:

```
npm start
```

### 4. Environment Variables шалгах

**Environment** tab дээр дараах variables байгаа эсэхийг шалгах:

- ✅ `DATABASE_URL` - Supabase PostgreSQL connection string
- ✅ `JWT_SECRET` - Бодит secret утга (placeholder биш!)
- ✅ `NODE_ENV=production`
- ✅ `CLIENT_URL`
- ✅ Cloudinary variables

### 5. Deploy дахин хийх

1. **Settings** → **"Save Changes"** дарна
2. **Manual Deploy** → **"Deploy latest commit"** дарна
3. Эсвэл **Events** → **"Deploy latest commit"** дарна

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

**Хэрэв алдаа гарвал:**

1. **Logs** дээрх алдааны мэдээллийг шалгах
2. **DATABASE_URL** зөв эсэх шалгах
3. **Root Directory** `backend` гэж тохируулсан эсэх шалгах

## 📋 Бүрэн Settings Жагсаалт

Render Dashboard → Settings дээр:

| Setting | Value |
|---------|-------|
| **Name** | `agentbuy-backend` |
| **Root Directory** | `backend` ⚠️ **ЧУХАЛ!** |
| **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy` |
| **Start Command** | `npm start` |
| **Runtime** | `Node` |

## ⚠️ Анхаар:

- **Root Directory** заавал `backend` байх ёстой
- Build command дээр `cd backend &&` хэрэггүй (Root Directory тохируулсан бол)
- Prisma generate build command-д заавал байх ёстой

---

**✅ Бэлэн!** Дээрх алхмуудыг дагаснаар Prisma client алдаа засах болно.

