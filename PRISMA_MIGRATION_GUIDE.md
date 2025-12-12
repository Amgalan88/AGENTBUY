# Prisma + Supabase Postgres Migration Guide

Энэхүү заавар нь MongoDB (Mongoose) -аас Supabase Postgres (Prisma) руу шилжихэд туслах зорилготой.

## 1. Supabase Database үүсгэх

1. [Supabase](https://supabase.com) дээр бүртгүүлэх эсвэл нэвтрэх
2. Шинэ проект үүсгэх
3. Settings > Database > Connection string > URI-г авах
4. Connection string нь дараах хэлбэртэй байна:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

## 2. Environment Variables тохируулах

`.env` файлд дараах мэдээллийг нэмэх:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Анхаар:** Supabase-ийн connection string-д `?pgbouncer=true&connection_limit=1` параметрүүдийг нэмэх нь зүйтэй (serverless орчинд ашиглахад).

## 3. Prisma Client үүсгэх

```bash
cd backend
npx prisma generate
```

Энэ команд нь Prisma schema-аас TypeScript/JavaScript client үүсгэнэ.

## 4. Database Migration хийх

### Development орчинд:

```bash
npx prisma migrate dev --name init
```

Энэ команд нь:
- Database дээр бүх table-уудыг үүсгэнэ
- Migration файлуудыг `prisma/migrations` хавтасанд хадгална

### Production орчинд:

```bash
npx prisma migrate deploy
```

## 5. Database Schema харах (Optional)

Prisma Studio ашиглан database-ийг visual харах:

```bash
npx prisma studio
```

Энэ нь browser дээр database-ийг харах боломжийг олгоно.

## 6. Mongoose Models-ийг Prisma руу хөрвүүлэх

Бүх Mongoose models Prisma schema-д хөрвүүлсэн байна (`prisma/schema.prisma`).

### Гол ялгаа:

1. **ObjectId → String (UUID)**: MongoDB-ийн ObjectId-г PostgreSQL-ийн UUID эсвэл String болгосон
2. **Embedded Documents → Relations**: Mongoose-ийн embedded documents-ийг Prisma relations болгосон
3. **Arrays**: MongoDB-ийн array-ууд Prisma-д `String[]` эсвэл relation array болгосон

## 7. Code-ийг шинэчлэх

### Database Connection:

```javascript
// Хуучин (Mongoose)
const mongoose = require("mongoose");
await mongoose.connect(process.env.MONGO_URI);

// Шинэ (Prisma)
const { prisma } = require("./config/db");
// prisma нь автоматаар холбогдсон байна
```

### Models ашиглах:

```javascript
// Хуучин (Mongoose)
const User = require("./models/userModel");
const user = await User.findById(id);

// Шинэ (Prisma)
const { prisma } = require("./config/db");
const user = await prisma.user.findUnique({ where: { id } });
```

### Query жишээ:

```javascript
// Find all users
const users = await prisma.user.findMany();

// Find with relations
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    user: true,
    agent: true,
    items: true,
    lock: true,
  },
});

// Create
const newUser = await prisma.user.create({
  data: {
    phone: "99112233",
    fullName: "Test User",
    passwordHash: "hashed",
    secretQuestion: "Question?",
    secretAnswerHash: "hashed",
  },
});

// Update
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { fullName: "New Name" },
});

// Delete
await prisma.user.delete({
  where: { id: userId },
});
```

## 8. Controllers болон Routes шинэчлэх

Бүх controllers (`backend/src/controllers/`) болон routes (`backend/src/routes/`) файлуудыг Mongoose-аас Prisma руу шинэчлэх хэрэгтэй.

### Жишээ:

```javascript
// Хуучин
const User = require("../models/userModel");
const user = await User.findOne({ phone });

// Шинэ
const { prisma } = require("../config/db");
const user = await prisma.user.findUnique({ where: { phone } });
```

## 9. Testing

Migration хийсний дараа бүх API endpoints-ийг тест хийх:

```bash
npm start
# эсвэл
npm run dev
```

## 10. Production Deployment

Production дээр:

1. Supabase production database-д connection string авах
2. `.env` файлд `DATABASE_URL` тохируулах
3. Migration хийх:
   ```bash
   npx prisma migrate deploy
   ```
4. Prisma Client үүсгэх:
   ```bash
   npx prisma generate
   ```

## Troubleshooting

### Connection Error

Хэрэв connection алдаа гарвал:
- Supabase dashboard дээр database connection string зөв эсэхийг шалгах
- Network access settings шалгах (Supabase дээр IP whitelist байгаа эсэх)
- Connection string-д `?pgbouncer=true` параметр нэмэх

### Migration Error

Хэрэв migration алдаа гарвал:
- Database дээр table-ууд аль хэдийн байгаа эсэхийг шалгах
- `prisma migrate reset` ашиглан database-ийг дахин үүсгэх (development орчинд л)

### Schema Sync Error

Schema-г өөрчлөхөд:
```bash
npx prisma migrate dev --name your_migration_name
```

## Дараагийн алхамууд

1. ✅ Prisma schema үүсгэсэн
2. ✅ Database connection файл шинэчлэсэн
3. ⏳ Controllers шинэчлэх (Mongoose → Prisma)
4. ⏳ Routes шинэчлэх
5. ⏳ Services шинэчлэх
6. ⏳ Utils шинэчлэх (bootstrap.js гэх мэт)
7. ⏳ Testing

## Холбоосууд

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)

