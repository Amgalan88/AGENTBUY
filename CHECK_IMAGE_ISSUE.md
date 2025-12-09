# 🔍 Зураг харагдахгүй байгаа асуудлыг шалгах заавар

## ✅ Backend тохиргоо:
- ✅ Cloudinary credentials зөв тохируулагдсан
- ✅ ENABLED: true

---

## 🔍 Browser дээр шалгах (F12):

### 1. Console Tab шалгах:

**Харагдах ёстой:**
- ⚠️ Warning: `⚠️ Image still in base64 format` → Backend upload амжилтгүй
- ❌ Error: `Image load error: ...` → Cloudinary URL load хийхэд алдаа
- ❌ Error: `CORS policy` → Cloudinary domain whitelist асуудал

**Алдаа байхгүй бол:**
- Зургийн URL зөв буцаж ирж байгаа эсэх шалгах

### 2. Network Tab шалгах:

**Шалгах зүйлс:**

1. **API Request шалгах:**
   - `/api/orders` эсвэл `/api/orders/ID` request хайх
   - Response дээр `images` field харагдаж байгаа эсэх
   - `images` дээр Cloudinary URL байгаа эсэх (base64 биш)

2. **Cloudinary Image Requests шалгах:**
   - `https://res.cloudinary.com/dn5fzzxis/image/upload/...` request хайх
   - Status: 200 (амжилттай) эсвэл 403/404 (алдаа)
   - 403 Forbidden → Cloudinary domain whitelist асуудал
   - 404 Not Found → Зураг upload хийгдээгүй

### 3. Application Tab шалгах (F12 → Application → Storage):

**LocalStorage эсвэл SessionStorage дээр зураг хадгалагдсан эсэх шалгах**

---

## 🛠️ Ямар алдаа гарч байгааг тодорхойлох:

### Сценарий 1: Console дээр base64 warning харагдаж байна

```
⚠️ Image still in base64 format (not uploaded to Cloudinary): order_id
```

**Шалтгаан:** Backend дээр Cloudinary upload амжилтгүй болсон

**Шийдэл:**
1. Backend logs шалгах (terminal дээр)
2. Cloudinary credentials шалгах
3. Backend сервер дахин эхлүүлэх

### Сценарий 2: Network tab дээр 403 Forbidden харагдаж байна

```
GET https://res.cloudinary.com/dn5fzzxis/image/upload/... → 403 Forbidden
```

**Шалтгаан:** Cloudinary domain whitelist асуудал

**Шийдэл:**
1. Cloudinary Dashboard → Settings → Security
2. "Allowed fetch domains" эсвэл "Restricted media delivery" хэсэгт:
   - `localhost`
   - `localhost:3000`
   - `127.0.0.1`

### Сценарий 3: Network tab дээр Cloudinary request байхгүй

**Шалтгаан:** Зураг base64 string байдлаар хадгалагдсан, Cloudinary URL биш

**Шийдэл:**
1. Backend logs шалгах - upload амжилтгүй эсэх
2. Хуучин захиалга migrate хийх:
   ```bash
   cd backend
   node migrate-images-to-cloudinary.js
   ```

### Сценарий 4: API response дээр images field байхгүй

**Шалтгаан:** Backend дээр зураг буцаахгүй байна

**Шийдэл:**
- Backend code шалгах - `listUserOrders` дээр images буцаах ёстой

---

## 📋 Хурдан тест:

### Browser Console дээр дараах командыг ажиллуулах:

```javascript
// API response шалгах
fetch('/api/orders?limit=1')
  .then(r => r.json())
  .then(data => {
    console.log('Orders:', data);
    if (data[0]?.items?.[0]?.images) {
      console.log('Images:', data[0].items[0].images);
      console.log('Is base64?', data[0].items[0].images[0]?.startsWith('data:'));
      console.log('Is URL?', data[0].items[0].images[0]?.startsWith('http'));
    }
  });
```

**Харагдах ёстой:**
- `Images: ['https://res.cloudinary.com/...']` → Зөв!
- `Images: ['data:image/png;base64,...']` → Base64 байна, upload хийгдээгүй

---

## 🚨 Шийдэл:

### Хэрэв base64 string байвал:

1. **Шинэ захиалга үүсгэх:**
   - Зураг upload хийх
   - Backend logs шалгах - upload амжилттай эсэх

2. **Хуучин захиалга migrate хийх:**
   ```bash
   cd backend
   node migrate-images-to-cloudinary.js
   ```

### Хэрэв Cloudinary URL байгаа ч харагдахгүй:

1. **Browser Console шалгах:**
   - Image load error байгаа эсэх

2. **Network Tab шалгах:**
   - Cloudinary request Status: 200 эсэх
   - 403/404 алдаа байгаа эсэх

3. **Cloudinary Domain Whitelist шалгах:**
   - Cloudinary Dashboard → Settings → Security
   - `localhost` нэмэх

---

**Browser Console болон Network Tab дээр ямар алдаа харагдаж байгааг хэлээрэй!**

