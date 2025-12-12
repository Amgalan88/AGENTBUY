# Frontend Setup Guide

## Environment Variables

Frontend дээр `.env.local` файл үүсгэх (optional - default нь `http://localhost:5000`):

```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Production (uncomment when deploying)
# NEXT_PUBLIC_API_URL=https://api.agentbuy.mn
# NEXT_PUBLIC_SOCKET_URL=https://api.agentbuy.mn
```

**Анхаар:** Хэрэв `.env.local` файл байхгүй бол `frontend/src/lib/api.ts` дээрх default утга (`http://localhost:5000`) ашиглагдана.

## Development

### 1. Frontend эхлүүлэх

```bash
cd frontend
npm run dev
```

Frontend нь `http://localhost:3000` дээр эхэлнэ.

### 2. Backend эхлүүлэх

```bash
cd backend
npm run dev
```

Backend нь `http://localhost:5000` дээр эхэлнэ.

### 3. Test хийх

Browser дээр `http://localhost:3000` нээх:
- Login хуудас: `/auth/login`
- Register хуудас: `/auth/register`
- User dashboard: `/user`
- Agent dashboard: `/agent`
- Admin dashboard: `/admin`

## Production Deployment

### Vercel/Netlify дээр

Environment Variables тохируулах:
- `NEXT_PUBLIC_API_URL=https://api.agentbuy.mn`
- `NEXT_PUBLIC_SOCKET_URL=https://api.agentbuy.mn`

### Build

```bash
cd frontend
npm run build
npm start
```

## API Connection Test

Browser console дээр эсвэл Postman ашиглан:

```javascript
// Test API connection
fetch('http://localhost:5000/api/user/cargos', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('Cargos:', data))
.catch(err => console.error('Error:', err));
```

## Troubleshooting

### CORS Error
Backend дээр `CLIENT_URL` environment variable-д frontend URL нэмэх:
```env
CLIENT_URL=http://localhost:3000,http://localhost:3001
```

### Connection Error
- Backend server ажиллаж байгаа эсэхийг шалгах
- API URL зөв эсэхийг шалгах
- Network tab дээр request-ийг шалгах

### Socket.io Connection Error
- Socket URL зөв эсэхийг шалгах
- Backend дээр Socket.io ажиллаж байгаа эсэхийг шалгах

