# 🔗 Supabase Connection String Заавар

## ⚠️ Анхаар:

Supabase connection string дээр `[YOUR-PASSWORD]` placeholder байвал **Supabase Dashboard-аас бодит password-ээр солих** хэрэгтэй.

## ✅ Сонголт 1: Supabase Dashboard-аас Connection String Авах

### Алхмууд:

1. **Supabase Dashboard** дээр нэвтрэх: https://supabase.com/dashboard
2. **Project** сонгох (AGENTBUY project)
3. **Settings** → **Database** руу орох
4. **Connection string** хэсэг олох
5. **Connection pooling** (Transaction mode) сонгох
6. **Connection string** хуулж авах

### Хэлбэр:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

### Бүрэн Connection String (өмнөх тохиргоо):

Хэрэв password өөрчлөгдөөгүй бол:

```
postgresql://postgres.onqtnnyrzqlvvfzwhyhq:Amgalan09091109@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

**⚠️ Анхаар:** Энэ нь **өмнөх password** байна. Хэрэв Supabase password өөрчлөгдсөн бол дээрх алхмуудыг дагаж шинэ connection string авах.

## ✅ Сонголт 2: Password Reset Хийх

Хэрэв password мэдэхгүй бол:

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Database Password** хэсэг олох
3. **Reset Database Password** дарна
4. Шинэ password үүсгэнэ
5. Шинэ connection string авах

## 📋 Render Dashboard дээр Оруулах

### DATABASE_URL Environment Variable:

Render Dashboard → **Environment** → **DATABASE_URL** дээр:

**KEY:** `DATABASE_URL`

**VALUE:** (Supabase Dashboard-аас авсан бүрэн connection string)

**Жишээ:**
```
postgresql://postgres.onqtnnyrzqlvvfzwhyhq:Amgalan09091109@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

## ⚠️ Чухал Параметрүүд:

Connection string-д дараах параметрүүд байх ёстой:

- `?pgbouncer=true` - Connection pooling идэвхжүүлэх
- `&connection_limit=1` - Serverless орчинд зөв ажиллах

## 🔍 Шалгах

Connection string зөв эсэхийг шалгах:

```bash
# Local дээр тест хийх:
cd backend
npx prisma db pull
```

Хэрэв алдаа гарвал:
- Password зөв эсэх шалгах
- Connection string бүрэн эсэх шалгах
- Supabase Network Access тохируулсан эсэх шалгах

---

**✅ Бэлэн!** Supabase Dashboard-аас connection string авч Render дээр оруулна уу.

