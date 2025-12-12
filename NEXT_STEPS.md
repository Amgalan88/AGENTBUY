# Дараагийн алхамууд

## ✅ Хийгдсэн ажлууд

1. ✅ Prisma schema үүсгэсэн
2. ✅ Бүх controllers, services, routes Prisma руу шинэчлэсэн
3. ✅ Database migration хийсэн
4. ✅ Database connection тест хийсэн

## 🔄 Одоо хийх ажлууд

### 1. Server эхлүүлэх ба тест хийх

```bash
cd backend
npm run dev
```

Дараа нь browser эсвэл Postman ашиглан API endpoints-ийг тест хийх:

#### Auth Endpoints
- `POST /api/auth/register` - Бүртгэл үүсгэх
- `POST /api/auth/login` - Нэвтрэх
- `GET /api/auth/me` - Одоогийн хэрэглэгч

#### User Endpoints
- `GET /api/user/profile` - Профайл авах
- `GET /api/user/cargos` - Карго жагсаалт
- `POST /api/user/cards/request` - Карт худалдан авах хүсэлт

#### Order Endpoints
- `POST /api/orders/draft` - Ноорог захиалга үүсгэх
- `POST /api/orders/:id/publish` - Захиалга нийтлэх
- `GET /api/orders` - Захиалгын жагсаалт

### 2. Алдаа засах (хэрэв байвал)

Хэрэв server эхлэхэд алдаа гарвал:
- Console дээрх алдааны мэдээллийг шалгах
- Prisma query logs шалгах
- Database connection string зөв эсэхийг шалгах

### 3. Production Deployment бэлтгэх

#### Environment Variables
Production server дээр `.env` файлд:
```env
DATABASE_URL="postgresql://postgres.onqtnnyrzqlvvfzwhyhq:Amgalan09091109@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&pgbouncer=true&connection_limit=1"
JWT_SECRET="your-secret-key"
NODE_ENV=production
PORT=5000
CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn
```

#### Migration Deploy
```bash
npm run prisma:migrate:deploy
```

#### Prisma Client Generate
```bash
npm run prisma:generate
```

### 4. Mongoose Dependency устгах (Optional)

Хэрэв бүх зүйл зөв ажиллаж байвал Mongoose-ийг устгах боломжтой:

```bash
cd backend
npm uninstall mongoose
```

**Анхаар:** Эхлээд бүх endpoints-ийг тест хийж, бүх зүйл зөв ажиллаж байгаа эсэхийг баталгаажуулаад дараа нь устгах нь зүйтэй.

## 🧪 Testing Checklist

- [ ] Server эхлэхэд алдаа гарахгүй
- [ ] Database connection амжилттай
- [ ] Auth endpoints ажиллаж байна
- [ ] User endpoints ажиллаж байна
- [ ] Order endpoints ажиллаж байна
- [ ] Agent endpoints ажиллаж байна
- [ ] Admin endpoints ажиллаж байна
- [ ] Socket.io ажиллаж байна (хэрэв ашиглаж байвал)

## 📝 Хэрэв алдаа гарвал

### Connection Error
```bash
# Connection string шалгах
cat backend/.env | grep DATABASE_URL

# Prisma validate
cd backend
npm run prisma:validate

# Prisma format
npm run prisma:format
```

### Migration Error
```bash
# Migration status шалгах
cd backend
npx prisma migrate status

# Migration reset (development only!)
npx prisma migrate reset
```

### Query Error
- Prisma Studio ашиглан database-ийг харах:
  ```bash
  npm run prisma:studio
  ```
- Browser дээр http://localhost:5555 нээх

## 🚀 Production Checklist

- [ ] Environment variables тохируулсан
- [ ] Database migration хийсэн
- [ ] Prisma Client үүсгэсэн
- [ ] Server ажиллаж байна
- [ ] API endpoints тест хийсэн
- [ ] Socket.io ажиллаж байна (хэрэв ашиглаж байвал)
- [ ] Error logging тохируулсан
- [ ] Monitoring тохируулсан

## 📚 Холбоосууд

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Studio](https://www.prisma.io/studio)

---

**Одоо server эхлүүлээд тест хийх цаг боллоо! 🚀**
