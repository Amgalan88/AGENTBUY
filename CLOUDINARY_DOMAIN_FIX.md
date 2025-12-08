# Cloudinary Domain Fix - agentbuy.mn

## Одоогийн байдал
Cloudinary Security settings хуудсанд "Allowed fetch domains" хоосон байна.

## Шийдэл

### 1. "Restricted media delivery" хэсгийг олох

Settings → Security хуудсанд доош гүйлгэж, **"Restricted media delivery"** эсвэл **"Allowed domains"** хэсгийг олох.

Энэ хэсэг нь:
- Зурагнуудыг аль domain-уудад харуулахыг зөвшөөрөх
- CORS тохиргоо
- Media delivery restrictions

### 2. Domain-уудыг нэмэх

Хэрэв "Restricted media delivery" эсвэл "Allowed domains" хэсэг олдвол:

**Дараах domain-уудыг нэмэх:**
```
agentbuy.mn
www.agentbuy.mn
*.agentbuy.mn
localhost
```

**Эсвэл development-д:**
- "Allow all domains" сонгох (хурдан тест)

### 3. Хэрэв "Restricted media delivery" олдохгүй бол

Cloudinary-ийн хуучин версид энэ тохиргоо байхгүй байж магадгүй. Энэ тохиолдолд:

1. **"Allowed fetch domains" дээр нэмэх** (одоогийн screenshot дээр харагдаж байгаа):
   ```
   agentbuy.mn
   www.agentbuy.mn
   localhost
   ```

2. **Settings → Upload → Upload presets** шалгах
   - Upload preset дээр security settings байгаа эсэхийг шалгах

### 4. Alternative: Signed URLs ашиглах

Хэрэв domain restriction ажиллахгүй бол, signed URLs ашиглах:
- Backend дээр Cloudinary signed URL үүсгэх
- Frontend дээр signed URL ашиглах

## Test хийх

Domain-уудыг нэмсний дараа:

1. Browser дээр agentbuy.mn нээх
2. Зурагнууд харагдаж байгаа эсэхийг шалгах
3. Browser Console дээр CORS error байгаа эсэхийг шалгах

## Хэрэв асуудал үргэлжилвэл

1. Cloudinary Support-д хандах
2. Settings → API Keys шалгах
3. Upload preset security settings шалгах

