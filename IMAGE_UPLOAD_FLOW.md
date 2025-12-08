# Зураг Upload Process - Cloudinary

## ✅ Одоогийн процесс:

### 1. Frontend (agentbuy.mn, www.agentbuy.mn, localhost)
- Хэрэглэгч/Агент зураг сонгох
- FileReader ашиглан base64 string болгох
- Base64 string-ийг backend руу илгээх

### 2. Backend
- Base64 string-ийг хүлээн авах
- `normalizeItemImages()` функц Cloudinary-д upload хийх
- Cloudinary URL-аар солих
- MongoDB-д Cloudinary URL хадгалах

### 3. Frontend (зураг харуулах)
- MongoDB-аас Cloudinary URL авах
- Browser дээр Cloudinary URL-аар зураг харуулах

## ✅ Cloudinary тохиргоо:

**Backend .env:**
```
CLOUDINARY_CLOUD_NAME=dn5fzzxis
CLOUDINARY_API_KEY=731682522556299
CLOUDINARY_API_SECRET=01gBrlS1wtexb-uQd4UGFx7l0Jo
```

## ⚠️ Domain Restriction:

Cloudinary Dashboard дээр дараах domain-уудыг нэмэх хэрэгтэй:
- agentbuy.mn
- www.agentbuy.mn
- *.agentbuy.mn
- localhost

Энэ нь зурагнуудыг эдгээр domain-уудад харуулахыг зөвшөөрнө.

## 📋 Process Flow:

```
User/Agent (agentbuy.mn)
    ↓
Select Image
    ↓
Base64 String (Frontend)
    ↓
POST /api/orders (Backend)
    ↓
normalizeItemImages() → Cloudinary Upload
    ↓
Cloudinary URL
    ↓
MongoDB (Cloudinary URL хадгалах)
    ↓
Frontend (Cloudinary URL-аар зураг харуулах)
```

## ✅ Дүгнэлт:

**Тийм, зурагнууд Cloudinary-аар дамжуулан ашиглаж байна!**

- ✅ Frontend → Backend: Base64 string
- ✅ Backend → Cloudinary: Upload
- ✅ Cloudinary → MongoDB: URL хадгалах
- ✅ MongoDB → Frontend: URL авах
- ✅ Frontend: Cloudinary URL-аар зураг харуулах
