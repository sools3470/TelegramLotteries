# راهنمای آماده‌سازی برای cPanel

## مرحله ۱: ساخت فایل‌های Static
```bash
npm run build
```
این دستور فولدر `dist` ایجاد می‌کند که شامل فایل‌های آماده برای production است.

## مرحله ۲: آماده‌سازی Backend
نیاز به تبدیل TypeScript به JavaScript:
```bash
npx tsc server/index.ts --outDir ./dist-server --target es2020 --module commonjs
```

## مرحله ۳: ساختار فایل‌های نهایی برای آپلود
```
📁 فایل‌های آپلود به cPanel
├── public_html/          # Frontend files (از dist/)
│   ├── index.html
│   ├── assets/
│   └── ...
├── api/                   # Backend files  
│   ├── index.js          # کامپایل شده از server/
│   ├── routes.js
│   ├── storage.js
│   ├── db.js
│   └── node_modules/     # وابستگی‌ها
└── .env                  # متغیرهای محیطی
```

## مرحله ۴: تنظیمات cPanel
1. آپلود فایل‌های frontend به public_html
2. آپلود فایل‌های backend به پوشه خارج از public_html
3. تنظیم Node.js App در cPanel
4. تنظیم متغیرهای محیطی