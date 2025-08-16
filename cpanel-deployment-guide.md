# راهنمای کامل آپلود به cPanel

## مرحله ۱: آماده‌سازی فایل‌ها

### فایل‌های Frontend (آپلود به public_html):
📁 **dist/public/** → **public_html/**
- index.html
- assets/ (فولدر کامل)

### فایل‌های Backend:
📁 **dist/index.js** → **api/index.js**
📁 **package-production.json** → **api/package.json**

## مرحله ۲: ساختار نهایی در cPanel

```
cPanel File Manager:
📁 public_html/
├── index.html                    # صفحه اصلی
├── assets/
│   ├── index-DTXrX-FW.css
│   └── index-Dp5fESUX.js
│
📁 api/ (خارج از public_html)
├── index.js                      # سرور Node.js
├── package.json                  # وابستگی‌ها
└── .env                         # متغیرهای محیطی
```

## مرحله ۳: تنظیمات cPanel

### الف) ایجاد Node.js App:
1. در cPanel بروید به "Node.js Apps"
2. "Create App" کلیک کنید
3. تنظیمات:
   - **Node.js Version**: 18.x یا بالاتر
   - **Application mode**: Production
   - **Application root**: /api
   - **Application URL**: api
   - **Application startup file**: index.js

### ب) متغیرهای محیطی:
در قسمت Environment Variables اضافه کنید:
```
DATABASE_URL=postgresql://your-db-connection-string
SESSION_SECRET=your-very-secure-random-string-here
NODE_ENV=production
```

### ج) نصب وابستگی‌ها:
پس از ایجاد اپ، در Terminal آن:
```bash
npm install
```

## مرحله ۴: تنظیمات .htaccess

### در public_html ایجاد کنید: .htaccess
```apache
RewriteEngine On

# API routes را به Node.js app بفرستید
RewriteRule ^api/(.*)$ https://yourdomain.com:port/api/$1 [P,L]

# SPA routing برای React
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]
```

## مرحله ۵: تست و عیب‌یابی

### چک‌لیست نهایی:
- ✅ فایل‌های frontend در public_html آپلود شده
- ✅ فایل‌های backend در پوشه api آپلود شده  
- ✅ Node.js App ایجاد و راه‌اندازی شده
- ✅ متغیرهای محیطی تنظیم شده
- ✅ وابستگی‌ها نصب شده
- ✅ دیتابیس متصل شده

### عیب‌یابی رایج:
1. **خطای 500**: چک کنید Node.js app در حال اجرا باشد
2. **خطای Database**: DATABASE_URL را بررسی کنید
3. **فایل‌های CSS/JS لود نمی‌شوند**: مسیر assets را چک کنید

## نکته مهم: 
اگر cPanel شما Node.js ساپورت نمی‌کند، باید از PHP backend استفاده کنید یا به هاست دیگری مهاجرت کنید.