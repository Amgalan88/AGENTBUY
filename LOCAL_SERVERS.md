# 🚀 Local Development Servers

## ✅ Серверүүд Ажиллаж Байна

### Frontend (Next.js)
- **URL:** http://localhost:3000
- **Status:** ✅ Running
- **Port:** 3000

### Backend (Express.js)
- **URL:** http://localhost:5000
- **Status:** ✅ Running  
- **Port:** 5000

---

## 📝 Серверүүдийг Зогсоох:

### Бүх серверүүдийг зогсоох:
```bash
# Port 3000 (Frontend) зогсоох
lsof -ti:3000 | xargs kill -9

# Port 5000 (Backend) зогсоох
lsof -ti:5000 | xargs kill -9
```

### Эсвэл:
```bash
# Бүх Node process-уудыг зогсоох
pkill -f node
```

---

## 🔄 Дахин Эхлүүлэх:

### Backend:
```bash
cd backend
npm start
# эсвэл development mode:
npm run dev
```

### Frontend:
```bash
cd frontend
npm run dev
```

---

## ✅ Шалгах:

1. **Frontend:** Browser дээр нээх → http://localhost:3000
2. **Backend API:** http://localhost:5000/api/...

---

## 📌 Environment Variables:

### Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Backend (.env):
```
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=...
JWT_SECRET=...
```

---

## 🎯 Тест Хийх:

1. Frontend нээх: http://localhost:3000
2. Login/Register тест хийх
3. Order create тест хийх
4. Image upload тест хийх
5. Real-time updates (Socket.IO) тест хийх

---

## 🔍 Server Logs:

### Backend logs:
```bash
cd backend
tail -f logs/out.log
tail -f logs/err.log
```

### Frontend logs:
- Browser console дээр харагдана
- Terminal дээр Next.js output харагдана

---

## ⚠️ Анхаар:

- Backend эхлэхэд MongoDB холболт шалгана
- Frontend эхлэхэд TypeScript compile хийгдэнэ
- Хэрэв port занят байвал процесс зогсоож дахин эхлүүлэх

