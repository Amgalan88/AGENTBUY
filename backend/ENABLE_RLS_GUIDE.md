# Supabase RLS (Row Level Security) Идэвхжүүлэх Заавар

## Асуудал

Supabase Security Advisor нь 25 алдаа илрүүлсэн - public schema-ийн хүснэгтүүдэд RLS идэвхгүй байна.

## Шийдэл

### Арга 1: Зөвхөн RLS идэвхжүүлэх (Хамгийн энгийн)

1. Supabase Dashboard → SQL Editor руу орох
2. `prisma/migrations/enable_rls.sql` файлын агуулгыг хуулах
3. SQL Editor дээр paste хийж "Run" дарна

**Анхаар:** Энэ аргаар RLS идэвхжүүлсний дараа та policy үүсгэх ёстой, эс бөгөөс бүх query хийх боломжгүй болно.

### Арга 2: RLS + Policy үүсгэх (Зөвлөмжлөх)

Энэ арга нь RLS идэвхжүүлэхээс гадна service_role-д бүх эрх өгдөг policy үүсгэнэ. Энэ нь таны Node.js backend (Prisma) ажиллахад шаардлагатай.

1. Supabase Dashboard → SQL Editor руу орох
2. `prisma/migrations/enable_rls_with_policies.sql` файлын агуулгыг хуулах
3. SQL Editor дээр paste хийж "Run" дарна

### Арга 3: Prisma Migration ашиглах

```bash
cd backend
npx prisma migrate dev --name enable_rls
```

Дараа нь `prisma/migrations/enable_rls_with_policies.sql` файлын агуулгыг Supabase SQL Editor дээр ажиллуулах.

## Policy-ийн тайлбар

Одоогийн policy-ууд нь `service_role`-д бүх эрх өгдөг. Энэ нь:
- ✅ Таны Node.js backend (Prisma) ажиллахад шаардлагатай
- ✅ Supabase Security Advisor-ийн алдааг арилгана
- ⚠️ Гэхдээ хэрэв та Supabase client-side authentication ашиглахыг хүсвэл нэмэлт policy үүсгэх хэрэгтэй

## Дараагийн алхмууд

1. RLS идэвхжүүлсний дараа Supabase Security Advisor-д дахин шалгах
2. Хэрэв client-side access хэрэгтэй бол нэмэлт policy үүсгэх:
   - User-ууд зөвхөн өөрсдийн өгөгдөл харах
   - Agent-ууд зөвхөн өөрсдийн захиалгууд харах
   - гэх мэт

## Аюулгүй байдлын зөвлөмж

- `_prisma_migrations` хүснэгтэд RLS идэвхжүүлэх шаардлагагүй (Prisma system table)
- Хэрэв идэвхжүүлсэн бол service_role policy үүсгэх
- Production дээр policy-уудыг сайтар тестлэх

