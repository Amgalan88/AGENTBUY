# 🔧 Vercel Build Error засах

## ❌ Алдаа:
```
Error: Command "cd frontend && npm install" exited with 1
```

## ✅ Шалтгаан:

Vercel Dashboard дээр **Root Directory = `frontend`** тохируулсан бол, `vercel.json` дээр `cd frontend &&` хэрэггүй!

Vercel аль хэдийн `frontend` directory дотор байгаа тул.

---

## ✅ Зассан vercel.json:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

---

## ⚠️ Чухал:

**2 хувилбар байна:**

### Хувилбар 1: Root Directory Dashboard дээр тохируулсан (Зөвлөмж) ⭐

**Vercel Dashboard → Settings → General → Root Directory = `frontend`**

Тэгвэл `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Хувилбар 2: Root Directory Dashboard дээр тохируулаагүй

**Vercel Dashboard → Settings → General → Root Directory = хоосон**

Тэгвэл `vercel.json`:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs"
}
```

---

## 🚀 Одоо хийх:

1. **Vercel Dashboard → Settings → General**
2. **Root Directory = `frontend`** тохируулах (байгаа эсэх шалгах)
3. **vercel.json** одоо зассан (push хийгдлээ)
4. **Redeploy** хийх

---

## ✅ Шалгах:

Deploy амжилттай бол:
- ✅ Build process амжилттай
- ✅ "Ready" статус харагдана
- ✅ Frontend URL дээр сайт харагдана

---

**vercel.json файл зассан, push хийгдлээ! Одоо Vercel Dashboard дээр Root Directory = `frontend` байгаа эсэх шалгаад, дахин deploy хийгээрэй!** 🚀

