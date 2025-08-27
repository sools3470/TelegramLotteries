# راهنمای کامل انتقال مینی‌اپ تلگرام به وردپرس

## مرحله ۱: آماده‌سازی هاست وردپرس

### ۱.۱ نصب وردپرس فارسی
1. وردپرس فارسی را از آدرس زیر دانلود کنید:
   ```
   https://fa.wordpress.org/
   ```

2. پایگاه داده MySQL ایجاد کنید:
   - نام دیتابیس: `telegram_raffle_wp`
   - کاربر: (نام کاربری دلخواه)
   - رمز عبور: (رمز قوی)

3. وردپرس را نصب و راه‌اندازی کنید

### ۱.۲ نصب افزونه‌های ضروری
```bash
افزونه‌های مورد نیاز:
- Elementor (رایگان)
- Elementor Pro (اختیاری برای ویجت‌های پیشرفته)
- Custom Post Type UI
- Advanced Custom Fields (ACF)
- WP REST API Controller
```

## مرحله ۲: آپلود فایل‌های مینی‌اپ

### ۲.۱ ساختار پوشه‌های وردپرس
```
wp-content/
├── themes/
│   └── telegram-raffle-theme/     # قالب اصلی
├── plugins/
│   └── telegram-raffle-plugin/    # افزونه اصلی
└── uploads/
    └── raffle-assets/             # فایل‌های رسانه‌ای
```

### ۲.۲ فایل‌های قابل انتقال از مینی‌اپ فعلی
```
انتقال این فایل‌ها:
✓ تمام تصاویر و آیکون‌ها → wp-content/uploads/raffle-assets/
✓ کدهای CSS → قالب وردپرس
✓ کدهای JavaScript → قالب وردپرس
✓ منطق API → افزونه وردپرس
✓ اطلاعات دیتابیس → جداول سفارشی وردپرس
```

## مرحله ۳: تنظیمات دیتابیس

### ۳.۱ جداول مورد نیاز (اضافه شدن به وردپرس)
```sql
-- این کدها در افزونه به صورت خودکار اجرا می‌شوند

CREATE TABLE IF NOT EXISTS wp_telegram_users (
    id int(11) NOT NULL AUTO_INCREMENT,
    telegram_id varchar(255) NOT NULL,
    username varchar(255),
    first_name varchar(255),
    last_name varchar(255),
    user_type enum('regular', 'channel_admin', 'bot_admin') DEFAULT 'regular',
    level int(11) DEFAULT 1,
    points int(11) DEFAULT 0,
    referral_code varchar(100),
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY telegram_id (telegram_id)
);

CREATE TABLE IF NOT EXISTS wp_telegram_raffles (
    id int(11) NOT NULL AUTO_INCREMENT,
    title varchar(500) NOT NULL,
    description text,
    prize varchar(500),
    status enum('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    level_required int(11) DEFAULT 1,
    creator_id int(11),
    winners_count int(11) DEFAULT 1,
    start_date datetime,
    end_date datetime,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```

## مرحله ۴: تنظیمات کانفیگ

### ۴.۱ فایل wp-config.php (اضافه کردن این خطوط)
```php
// تنظیمات مینی‌اپ تلگرام
define('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE');
define('TELEGRAM_WEBHOOK_URL', 'https://yourdomain.com/wp-json/telegram/v1/webhook');

// تنظیمات مدیران (آیدی عددی تلگرام)
define('BOT_ADMINS', '123456789,987654321'); // آیدی‌های عددی مدیران اصلی
define('CHANNEL_ADMINS', '111222333,444555666'); // آیدی‌های مدیران کانال

// تنظیمات API
define('TELEGRAM_API_ENABLED', true);
define('WP_DEBUG', true); // برای مرحله توسعه
```

### ۴.۲ فایل .htaccess (اضافه کردن قوانین)
```apache
# قوانین مینی‌اپ تلگرام
RewriteEngine On

# امنیت API
<Files "wp-config.php">
    Order allow,deny
    Deny from all
</Files>

# کش فایل‌های استاتیک
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

## مرحله ۵: تست و راه‌اندازی

### ۵.۱ چک‌لیست نهایی
```
☐ وردپرس نصب شده و کار می‌کند
☐ افزونه‌های مورد نیاز نصب شده‌اند
☐ قالب آپلود و فعال شده
☐ افزونه مینی‌اپ آپلود و فعال شده
☐ تنظیمات wp-config.php انجام شده
☐ دیتابیس متصل است
☐ Webhook تلگرام تنظیم شده
☐ صفحات اصلی ایجاد شده‌اند
```

### ۵.۲ تست عملکرد
1. آدرس سایت را در مرورگر باز کنید
2. بخش مدیریت وردپرس را بررسی کنید
3. API endpoints را تست کنید:
   ```
   https://yourdomain.com/wp-json/telegram/v1/test
   ```

## ⚠️ نکات مهم امنیتی

1. **حتماً رمز عبور قوی استفاده کنید**
2. **توکن ربات تلگرام را محرمانه نگه دارید**
3. **SSL certificate نصب کنید (https)**
4. **بک‌آپ منظم از دیتابیس بگیرید**

## 🚨 عیب‌یابی مشکلات رایج

### مشکل: API کار نمی‌کند
**راه‌حل:** 
- تنظیمات Permalink را بررسی کنید (Settings > Permalinks)
- REST API وردپرس فعال باشد

### مشکل: دیتابیس متصل نمی‌شود
**راه‌حل:**
- اطلاعات دیتابیس در wp-config.php را بررسی کنید
- مجوزهای کاربر دیتابیس را چک کنید

### مشکل: تلگرام webhook کار نمی‌کند  
**راه‌حل:**
- SSL certificate معتبر داشته باشید
- آدرس webhook در تنظیمات ربات صحیح باشد

---
📅 **تاریخ آخرین بروزرسانی:** $(date)
👨‍💻 **نسخه راهنما:** 1.0
📧 **پشتیبانی:** برای مشکلات فنی با سازنده تماس بگیرید