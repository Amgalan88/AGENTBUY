# PM2 ажиллуулах заавар

## 1. PM2 суулгах:

Terminal дээр дараах командыг ажиллуулах (sudo password шаардлагатай):

```bash
sudo npm install -g pm2
```

## 2. Backend серверийг PM2-тэй эхлүүлэх:

```bash
cd backend
pm2 start ecosystem.config.js
```

Эсвэл шууд:

```bash
cd backend
pm2 start src/server.js --name agentbuy-backend
```

## 3. PM2 status шалгах:

```bash
pm2 status
```

## 4. Logs харах:

```bash
pm2 logs agentbuy-backend
```

## 5. Серверийг зогсоох:

```bash
pm2 stop agentbuy-backend
```

## 6. Серверийг дахин эхлүүлэх:

```bash
pm2 restart agentbuy-backend
```

## 7. PM2-ийг системийн startup дээр эхлүүлэх:

```bash
pm2 save
pm2 startup
```

---

## Хэрэв PM2 суулгах боломжгүй бол:

npx ашиглах (global install хийхгүйгээр):

```bash
cd backend
npx pm2 start src/server.js --name agentbuy-backend
```

Эсвэл одоогийн аргаар ажиллуулах:

```bash
cd backend
node src/server.js
```

Гэхдээ энэ тохиолдолд terminal хаахад сервер зогсоно.
