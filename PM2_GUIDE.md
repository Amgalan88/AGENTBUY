# PM2 - Process Manager 2

## PM2 гэж юу вэ?

**PM2** нь Node.js application-уудыг удирдах process manager юм. Энэ нь:
- Backend серверийг background дээр ажиллуулах
- Сервер унах үед автоматаар дахин эхлүүлэх (auto-restart)
- Серверийн status, logs шалгах
- Production дээр серверийг найдвартай ажиллуулах

## Яагаад хэрэгтэй вэ?

### Без PM2:
```bash
node src/server.js
```
- Terminal хаахад сервер зогсоно
- Сервер унах үед дахин эхлүүлэх хэрэгтэй
- Production дээр найдваргүй

### PM2-тэй:
```bash
pm2 start src/server.js
```
- Terminal хаахад ч сервер ажилласаар байна
- Сервер унах үед автоматаар дахин эхлүүлнэ
- Production дээр найдвартай

---

## Суулгах:

```bash
npm install -g pm2
```

---

## Ашиглах:

### 1. Backend серверийг PM2-тэй эхлүүлэх:

```bash
cd backend
pm2 start src/server.js --name agentbuy-backend
```

### 2. PM2 status шалгах:

```bash
pm2 status
```

Output:
```
┌─────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                │ status  │ restart │ uptime   │
├─────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ agentbuy-backend    │ online  │ 0       │ 2h       │
└─────┴─────────────────────┴─────────┴─────────┴──────────┘
```

### 3. Logs харах:

```bash
pm2 logs agentbuy-backend
```

Эсвэл сүүлийн 100 мөр:
```bash
pm2 logs agentbuy-backend --lines 100
```

### 4. Серверийг зогсоох:

```bash
pm2 stop agentbuy-backend
```

### 5. Серверийг дахин эхлүүлэх:

```bash
pm2 restart agentbuy-backend
```

### 6. Серверийг устгах:

```bash
pm2 delete agentbuy-backend
```

### 7. Бүх process-уудыг харах:

```bash
pm2 list
```

---

## Production дээр ашиглах:

### 1. PM2-ийг системийн startup дээр эхлүүлэх:

```bash
pm2 save        # Одоогийн process-уудыг хадгалах
pm2 startup     # Startup script үүсгэх
```

Энэ нь компьютер restart хийхэд PM2 автоматаар эхлэнэ.

### 2. PM2 ecosystem file үүсгэх (илүү тохируулагдсан):

`backend/ecosystem.config.js` файл үүсгэх:

```javascript
module.exports = {
  apps: [{
    name: 'agentbuy-backend',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Дараа нь:
```bash
pm2 start ecosystem.config.js
```

---

## Бусад хэрэгтэй командууд:

### Monitoring:
```bash
pm2 monit          # Real-time monitoring
pm2 info agentbuy-backend   # Дэлгэрэнгүй мэдээлэл
```

### Logs:
```bash
pm2 logs           # Бүх logs
pm2 flush          # Logs цэвэрлэх
```

### Restart:
```bash
pm2 restart all    # Бүх process-уудыг restart хийх
pm2 reload agentbuy-backend  # Zero-downtime reload
```

---

## PM2 vs Бусад арга:

### PM2 (Зөвлөмжтэй):
- ✅ Auto-restart
- ✅ Background ажиллах
- ✅ Logs management
- ✅ Monitoring
- ✅ Production-ready

### `node src/server.js` (Development):
- ❌ Terminal хаахад зогсоно
- ❌ Auto-restart байхгүй
- ✅ Development-д хурдан

### `nohup node src/server.js &`:
- ✅ Background ажиллах
- ❌ Auto-restart байхгүй
- ❌ Logs management байхгүй
- ❌ Monitoring байхгүй

---

## Дүгнэлт:

**PM2 нь production дээр backend серверийг найдвартай ажиллуулахад заавал хэрэгтэй!**

Development дээр:
- `npm run dev` (nodemon) ашиглах

Production дээр:
- PM2 ашиглах

