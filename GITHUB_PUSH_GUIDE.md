# GitHub Push ба Domain Deployment Заавар

## ✅ GitHub руу Push хийх

### 1. RLS SQL файлуудыг commit хийх

RLS SQL файлууд нь documentation гэж хадгалж болно (Supabase дээр аль хэдийн ажиллуулсан):

```bash
cd /Users/25lp7244/AGENTBUYNEW/AGENTBUY

# RLS SQL файлуудыг нэмэх
git add backend/prisma/migrations/enable_rls.sql
git add backend/prisma/migrations/enable_rls_with_policies.sql
git add backend/prisma/migrations/enable_rls_remaining_tables.sql

# Documentation файлуудыг нэмэх
git add backend/RLS_SHIDEL.md
git add backend/ENABLE_RLS_GUIDE.md
git add backend/RLS_TEST_GUIDE.md
git add backend/test-rls.js

# Бусад өөрчлөлтүүдийг нэмэх
git add backend/src/server.js
git add backend/kill-port.sh
git add backend/prisma/

# Commit хийх
git commit -m "feat: Enable Row Level Security (RLS) on all Supabase tables

- Added RLS SQL migration scripts
- Enabled RLS on all public tables
- Created service_role policies for backend access
- Added RLS documentation and test scripts
- Fixed port conflict error handling in server.js"

# GitHub руу push хийх
git push origin main
```

### 2. Бусад файлуудыг commit хийх (хэрэв хэрэгтэй бол)

```bash
# Бусад өөрчлөлтүүдийг нэмэх
git add backend/src/
git add backend/package.json
git add backend/package-lock.json

# Commit хийх
git commit -m "chore: Update backend dependencies and configurations"

# Push хийх
git push origin main
```

## 🌐 Domain дээр ажиллах эсэх?

### ✅ Тийм, domain дээр ажиллана!

**Учир:**
1. **RLS аль хэдийн идэвхжсэн** - Supabase production database дээр SQL script ажиллуулсан
2. **Backend code өөрчлөгдөөгүй** - Зөвхөн database-д RLS идэвхжүүлсэн
3. **Policy-ууд үүсгэгдсэн** - Service role-д бүх эрх өгсөн

### Шалгах зүйлс:

1. **Backend сервер ажиллаж байгаа эсэх:**
   ```bash
   curl https://api.agentbuy.mn/ || curl https://agentbuy.mn/api/
   ```

2. **Database холболт:**
   - Backend сервер эхэлж байгаа эсэх
   - Database connection алдаа гарч байгаа эсэх

3. **API endpoint-ууд:**
   - Login/Register ажиллаж байгаа эсэх
   - Orders API ажиллаж байгаа эсэх

## ⚠️ Анхаарах зүйлс

### 1. RLS SQL файлууд production-д хэрэггүй

RLS SQL файлууд нь:
- ✅ Documentation гэж хадгалж болно
- ❌ Production server дээр ажиллуулах шаардлагагүй
- ✅ Аль хэдийн Supabase database дээр ажиллуулсан

### 2. Environment Variables

Production server дээр `.env` файлд:
```env
DATABASE_URL="postgresql://postgres.onqtnnyrzqlvvfzwhyhq:****@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&pgbouncer=true&connection_limit=1"
JWT_SECRET="your-secret-key"
NODE_ENV=production
PORT=5000
CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn
```

### 3. Backend сервер restart хийх (хэрэв шаардлагатай бол)

Хэрэв backend сервер ажиллаж байгаа бол:
```bash
# PM2 ашиглаж байгаа бол
pm2 restart agentbuy-backend

# Эсвэл сервер дахин эхлүүлэх
```

## 📋 Deployment Checklist

- [x] RLS идэвхжүүлэх (Supabase дээр)
- [x] Policy үүсгэх (Supabase дээр)
- [ ] GitHub руу push хийх (Одоо хийж байна)
- [ ] Backend сервер restart хийх (хэрэв шаардлагатай бол)
- [ ] Domain дээр тестлэх
- [ ] Production monitoring

## 🎯 Дүгнэлт

**GitHub руу push хийх:** ✅ Тийм, код backup хийх
**Domain дээр ажиллах:** ✅ Тийм, RLS аль хэдийн идэвхжсэн

