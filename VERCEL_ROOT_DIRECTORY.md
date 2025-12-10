# ⚠️ Vercel Root Directory тохируулах заавар

## Проблем:

`vercel.json` файлд `rootDirectory` property байрлуулах боломжгүй!
- Vercel дээр алдаа гарна: "should NOT have additional property 'rootDirectory'"

## ✅ Шийдэл:

### Арга 1: Vercel Dashboard дээр тохируулах (Зөвлөмж) ⭐

1. **Vercel Dashboard** → **agentbuy** төсөл → **Settings**
2. **General** tab руу очих
3. **Root Directory** талбар:
   - `frontend` гэж оруулах
4. **Save** дарна
5. **Redeploy** хийх

### Арга 2: Vercel CLI ашиглах

```bash
# Vercel CLI суулгах
npm install -g vercel

# Project settings тохируулах
vercel project ls
vercel project settings --root-directory frontend
```

---

## 📝 vercel.json файл:

`vercel.json` файлд зөвхөн дараах property-ууд зөвшөөрөгдөнө:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs"
}
```

**⚠️ `rootDirectory` оруулахгүй!** Энэ нь Vercel Dashboard дээр тохируулах шаардлагатай.

---

## ✅ Одоогийн тохиргоо:

✅ `vercel.json` файл зассан (rootDirectory хассан)
✅ Next.js 16.0.7 руу шинэчлэгдсэн (CVE-2025-66478 засварласан)
✅ Build амжилттай

---

## 🚀 Дараагийн алхам:

1. Vercel Dashboard дээр **Root Directory = `frontend`** тохируулах
2. **Save** → **Redeploy**
3. Deploy амжилттай болно!

