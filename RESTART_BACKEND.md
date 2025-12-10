# 🔄 Backend сервер дахин эхлүүлэх

## ✅ Зассан зүйл:

Backend дээр `listUserOrders` функц дээр `images` field үргэлж буцаана (undefined биш).

Одоо:
- `images` array байвал filter хийж Cloudinary URL-уудыг буцаана
- `images` байхгүй эсвэл хоосон бол хоосон array `[]` буцаана
- `imageUrl` байвал `images` array болгон буцаана

---

## 🔄 Backend сервер дахин эхлүүлэх:

### Арга 1: Terminal дээр (Development):

```bash
# Backend terminal дээр Ctrl+C дарж зогсоох
# Дараа нь:
cd backend
npm run dev
```

### Арга 2: Process kill хийх:

```bash
# Backend process олох
ps aux | grep "node.*server.js"

# Process kill хийх (PID олоод)
kill <PID>

# Дахин эхлүүлэх
cd backend
npm run dev
```

---

## ✅ Шалгах:

Backend дахин эхлүүлсний дараа:

1. **Browser дээр hard refresh хийх** (Cmd+Shift+R)
2. **Console дээр debug мэдээлэл шалгах:**
   ```
   [Debug] First order images: { hasImages: true/false, images: [...] }
   ```
3. **Network Tab дээр API response шалгах:**
   - `/api/orders` request → Response дээр `images` field байгаа эсэх

---

## 🎯 Одоо:

- ✅ Backend код зассан
- ✅ `images` field үргэлж буцаана
- ⚠️ Backend сервер дахин эхлүүлэх шаардлагатай

---

**Backend серверийг дахин эхлүүлсний дараа зураг харагдах ёстой!**

