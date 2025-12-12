# Supabase Connection Information

## ✅ Migration амжилттай хийгдсэн!

Database migration амжилттай хийгдсэн байна. Бүх table-ууд Supabase Postgres database дээр үүссэн.

## Connection String

Одоогийн connection string:
```
postgresql://postgres.onqtnnyrzqlvvfzwhyhq:Amgalan09091109@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

## Connection Types

Supabase нь хоёр төрлийн connection string өгдөг:

### 1. Pooler Connection (Transaction Mode) - Одоо ашиглаж байгаа
- URL: `pooler.supabase.com`
- Prisma-д ашиглахад зөв
- Connection pooling ашигладаг
- Serverless орчинд илүү тохиромжтой

### 2. Direct Connection
- URL: `db.[project-ref].supabase.co`
- Direct database connection
- Migration хийхэд илүү найдвартай

## Хэрэв Connection алдаа гарвал

### Сонголт 1: Direct Connection ашиглах
Supabase Dashboard дээр:
1. Settings > Database
2. Connection string > Direct connection
3. URI-г авах
4. `.env` файлд солих

### Сонголт 2: Connection Pooling тохируулах
Pooler connection string-д дараах параметрүүдийг нэмэх:
```
?pgbouncer=true&connection_limit=1
```

## Migration Status

✅ Migration файл: `prisma/migrations/20251211045058_init/`
✅ Бүх table-ууд үүссэн
✅ Prisma Client үүсгэгдсэн

## Дараагийн алхамууд

1. ✅ Database connection string тохируулсан
2. ✅ Prisma Client үүсгэсэн
3. ✅ Migration хийсэн
4. ⏳ Controllers шинэчлэх (Mongoose → Prisma)
5. ⏳ Testing

## Database Tables

Дараах table-ууд үүссэн:
- users
- cargos
- orders
- order_items
- order_locks
- order_pricings
- order_payments
- order_trackings
- order_reports
- order_report_items
- order_report_pricings
- order_comments
- order_ratings
- requests
- request_items
- request_reports
- agent_profiles
- card_requests
- card_request_payment_infos
- card_transactions
- chat_messages
- feedbacks
- payments
- settings

## Prisma Studio ашиглах

Database-ийг visual харах:
```bash
cd backend
npm run prisma:studio
```

Энэ нь browser дээр database-ийг харах боломжийг олгоно (http://localhost:5555).

