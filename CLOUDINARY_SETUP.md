# Cloudinary Domain Configuration

## Асуудал
Cloudinary дээрх зурагнууд `agentbuy.mn` болон `www.agentbuy.mn` дээр харагдахгүй байна.

## Шийдэл

### 1. Cloudinary Dashboard дээр Security Settings тохируулах

1. **Cloudinary Dashboard руу нэвтрэх:**
   - https://console.cloudinary.com/
   - Account: `dn5fzzxis`

2. **Settings → Security руу орох**

3. **"Restricted media delivery"** хэсэг дээр:
   - **"Allowed domains"** дээр дараах domain-уудыг нэмэх:
     ```
     agentbuy.mn
     www.agentbuy.mn
     *.agentbuy.mn
     localhost
     ```
   
   Эсвэл development-д:
   - **"Allow all domains"** сонгох (production-д зөвлөмжгүй)

4. **"Save"** дарж хадгалах

### 2. CORS Settings (хэрэв байвал)

Cloudinary дээр CORS settings шалгах:
- Settings → Security → CORS
- Allowed origins дээр domain-уудыг нэмэх

### 3. Delivery URL Settings

Cloudinary дээр delivery URL-ийг шалгах:
- Settings → Media Library
- "Secure delivery" идэвхжүүлсэн эсэхийг шалгах
- HTTPS URL ашиглах: `https://res.cloudinary.com/...`

### 4. Frontend дээр Image Loading

Frontend дээр зураг ачаалахдаа:
- `crossOrigin="anonymous"` attribute нэмэх (хэрэв CORS асуудал байвал)
- HTTPS URL ашиглах

### 5. Test хийх

Browser console дээр:
```javascript
// Test image load
const img = new Image();
img.crossOrigin = 'anonymous';
img.onload = () => console.log('✅ Image loaded');
img.onerror = (e) => console.error('❌ Image error:', e);
img.src = 'https://res.cloudinary.com/dn5fzzxis/image/upload/v1765189987/agentbuy/jzw9mnov10lc6ie9ab4k.png';
```

## Quick Fix (Development)

Хэрэв development дээр хурдан тест хийх бол:
1. Cloudinary Dashboard → Settings → Security
2. "Restricted media delivery" → "Allow all domains" сонгох
3. Save

**Анхаар:** Production дээр зөвхөн шаардлагатай domain-уудыг нэмэх нь илүү аюулгүй.

## Troubleshooting

### Зураг харагдахгүй байвал:

1. **Browser Console шалгах:**
   - Network tab дээр image request-ийг шалгах
   - CORS error байгаа эсэхийг шалгах

2. **Cloudinary URL шалгах:**
   - URL зөв эсэхийг шалгах
   - Browser дээр шууд нээх: `https://res.cloudinary.com/dn5fzzxis/image/upload/...`

3. **Security Settings шалгах:**
   - Allowed domains дээр domain байгаа эсэхийг шалгах
   - Domain-ууд зөв бичигдсэн эсэхийг шалгах (trailing slash байхгүй)

4. **HTTPS шалгах:**
   - Cloudinary URL HTTPS ашиглаж байгаа эсэхийг шалгах
   - Mixed content error байгаа эсэхийг шалгах

## Production Checklist

- [ ] Cloudinary Dashboard дээр `agentbuy.mn` domain нэмсэн
- [ ] Cloudinary Dashboard дээр `www.agentbuy.mn` domain нэмсэн
- [ ] HTTPS URL ашиглаж байна
- [ ] Browser console дээр CORS error байхгүй
- [ ] Зурагнууд зөв харагдаж байна

