# Monitoring - Хяналт, хянах систем

## Monitoring гэж юу вэ?

**Monitoring** нь application-ийн status, performance, алдааг real-time хянах систем юм. Энэ нь:
- Сервер хэрхэн ажиллаж байгааг харах
- Memory, CPU хэрэглээг шалгах
- Алдаа гарч байгаа эсэхийг мэдэх
- Performance-ийг сайжруулах

---

## PM2 Monitoring

### 1. Real-time Monitoring (PM2 Monit)

```bash
cd backend
npx pm2 monit
```

Энэ нь real-time dashboard харуулна:
- CPU usage (%)
- Memory usage (MB)
- Logs (real-time)
- Error logs
- Restart count

**Зураг:**
```
┌─ Process List ─────────────────────────────────────┐
│  agentbuy-backend                                   │
│  Status: online                                     │
│  CPU: 2%                                            │
│  Memory: 103.4 MB                                   │
│  Restarts: 0                                        │
└─────────────────────────────────────────────────────┘
```

### 2. PM2 Status (Богино мэдээлэл)

```bash
npx pm2 status
```

Output:
```
┌────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id │ name                │ status  │ restart │ uptime   │
├────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0  │ agentbuy-backend    │ online  │ 0       │ 2h       │
└────┴─────────────────────┴─────────┴─────────┴──────────┘
```

### 3. Дэлгэрэнгүй мэдээлэл

```bash
npx pm2 info agentbuy-backend
```

Энэ нь дараах мэдээллийг харуулна:
- Process ID
- Memory usage
- CPU usage
- Uptime
- Restart count
- Log file paths
- Environment variables

### 4. Logs Monitoring

```bash
# Real-time logs
npx pm2 logs agentbuy-backend

# Сүүлийн 100 мөр
npx pm2 logs agentbuy-backend --lines 100

# Зөвхөн error logs
npx pm2 logs agentbuy-backend --err

# Зөвхөн output logs
npx pm2 logs agentbuy-backend --out
```

---

## Бусад Monitoring хэрэгслүүд:

### 1. PM2 Plus (Cloud Monitoring)

PM2 Plus нь cloud-based monitoring юм:
- Real-time monitoring
- Alert system
- Performance metrics
- Error tracking

**Ашиглах:**
```bash
npx pm2 link <secret_key> <public_key>
```

### 2. Application-level Monitoring

Backend дээр monitoring middleware нэмэх:

```javascript
// monitoring.js
const monitoring = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
};
```

### 3. Error Tracking (Sentry)

Production дээр error tracking:

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'YOUR_DSN' });
```

### 4. Uptime Monitoring

- **UptimeRobot** (https://uptimerobot.com)
- **Pingdom**
- **StatusCake**

Эдгээр нь серверийн uptime-ийг шалгаж, унах үед alert илгээнэ.

---

## Production дээр Monitoring:

### 1. PM2 Monitoring

```bash
# Real-time monitoring
npx pm2 monit

# Status check
npx pm2 status

# Logs
npx pm2 logs
```

### 2. Server Monitoring

- **CPU usage** - хэт их байвал server upgrade хэрэгтэй
- **Memory usage** - memory leak байгаа эсэхийг шалгах
- **Disk space** - log файлууд их байвал цэвэрлэх
- **Network** - bandwidth хэрэглээ

### 3. Application Monitoring

- **Response time** - API хурдан хариулах эсэх
- **Error rate** - Алдааны тоо
- **Request count** - Хэдэн request ирж байгаа

---

## Monitoring Checklist:

- [ ] PM2 monit ажиллуулах
- [ ] Logs файлуудыг шалгах
- [ ] Error tracking тохируулах (Sentry)
- [ ] Uptime monitoring тохируулах
- [ ] Alert system тохируулах
- [ ] Performance metrics хянах

---

## Жишээ Monitoring Commands:

```bash
# Real-time monitoring
cd backend
npx pm2 monit

# Status
npx pm2 status

# Info
npx pm2 info agentbuy-backend

# Logs
npx pm2 logs agentbuy-backend --lines 50

# Memory usage
npx pm2 list --sort memory

# CPU usage
npx pm2 list --sort cpu
```

---

## Дүгнэлт:

**Monitoring нь production дээр application-ийг найдвартай ажиллуулахад заавал хэрэгтэй!**

- ✅ Real-time status харах
- ✅ Performance шалгах
- ✅ Алдаа илрүүлэх
- ✅ Server resources хянах

