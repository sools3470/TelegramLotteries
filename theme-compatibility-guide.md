# راهنمای جامع سازگاری تم و فایل‌ها

## 📁 ساختار کامل فایل‌های پروژه

### ساختار اصلی پس از انتقال:
```
WordPress Root/
│
├── wp-config.php                    # 🔧 تنظیمات اصلی - حاوی اطلاعات حیاتی
├── .htaccess                        # ⚙️ قوانین سرور و امنیت
│
├── wp-content/
│   ├── themes/
│   │   └── telegram-raffle-theme/   # 🎨 قالب اصلی مینی‌اپ
│   │       ├── style.css           # استایل اصلی
│   │       ├── functions.php       # توابع قالب
│   │       ├── index.php          # صفحه اصلی
│   │       ├── header.php         # سربرگ
│   │       ├── footer.php         # پاورقی  
│   │       ├── assets/            # فایل‌های استاتیک
│   │       │   ├── css/
│   │       │   ├── js/
│   │       │   └── images/
│   │       └── elementor-widgets/  # ویجت‌های Elementor
│   │
│   ├── plugins/
│   │   └── telegram-raffle-plugin/ # 🔌 افزونه اصلی مینی‌اپ
│   │       ├── telegram-raffle.php        # فایل اصلی افزونه
│   │       ├── includes/                  # کلاس‌ها و توابع
│   │       │   ├── class-database.php     # مدیریت دیتابیس
│   │       │   ├── class-api.php          # API endpoints
│   │       │   ├── class-telegram.php     # ارتباط با تلگرام
│   │       │   └── class-auth.php         # احراز هویت
│   │       ├── admin/                     # پنل مدیریت وردپرس
│   │       ├── public/                    # فایل‌های عمومی
│   │       └── elementor-widgets/         # ویجت‌های Elementor
│   │
│   └── uploads/
│       └── telegram-raffle/        # 📁 فایل‌های آپلود شده
│           ├── raffles/            # تصاویر قرعه‌کشی‌ها
│           ├── users/              # آواتار کاربران
│           └── temp/               # فایل‌های موقت
│
└── راهنماها/                        # 📚 فایل‌های راهنما
    ├── wordpress-deployment-guide.md
    ├── elementor-integration-guide.md
    ├── theme-compatibility-guide.md
    └── file-descriptions.md        # توضیح هر فایل (همین فایل)
```

## 🔧 فایل‌های کلیدی و نقش هر کدام

### 1️⃣ فایل wp-config.php
```php
<?php
// 🚨 فایل حیاتی - شامل تمام تنظیمات مهم

// اطلاعات دیتابیس - باید تغییر کند
define('DB_NAME', 'نام_دیتابیس_جدید');
define('DB_USER', 'نام_کاربری_دیتابیس');  
define('DB_PASSWORD', 'رمز_دیتابیس');
define('DB_HOST', 'localhost'); // یا آدرس سرور دیتابیس

// 🤖 تنظیمات ربات تلگرام - حتماً تغییر دهید
define('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE');
define('TELEGRAM_WEBHOOK_URL', 'https://domain.com/wp-json/telegram/v1/webhook');

// 👑 مدیران اصلی - آیدی عددی تلگرام
define('BOT_ADMINS', '123456789,987654321'); 
define('CHANNEL_ADMINS', '111222333,444555666');

// 🔐 کلیدهای امنیتی وردپرس - تولید خودکار
define('AUTH_KEY',         'رشته تصادفی امنیتی...');
define('SECURE_AUTH_KEY',  'رشته تصادفی امنیتی...');
define('LOGGED_IN_KEY',    'رشته تصادفی امنیتی...');
define('NONCE_KEY',        'رشته تصادفی امنیتی...');
// ... سایر کلیدها

// تنظیمات اضافی مینی‌اپ
define('TELEGRAM_API_ENABLED', true);
define('RAFFLE_AUTO_APPROVE', false); // قرعه‌کشی‌ها باید تایید شوند
define('USER_REGISTRATION_ENABLED', true);
define('REFERRAL_POINTS', 50); // امتیاز دعوت از دوستان

// تنظیمات توسعه (در محیط تولید false کنید)
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// تنظیمات کش و بهینه‌سازی
define('WP_CACHE', true);
define('COMPRESS_CSS', true);
define('COMPRESS_SCRIPTS', true);
```

### 2️⃣ فایل افزونه اصلی (telegram-raffle.php)
```php
<?php
/**
 * Plugin Name: مینی‌اپ قرعه‌کشی تلگرام
 * Description: سیستم کامل مدیریت قرعه‌کشی تلگرام برای وردپرس
 * Version: 1.0.0
 * Author: نام شما
 */

// 🚨 امنیت - جلوگیری از دسترسی مستقیم
if (!defined('ABSPATH')) {
    exit;
}

// بارگذاری کلاس‌های اصلی
require_once plugin_dir_path(__FILE__) . 'includes/class-database.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-api.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-telegram.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-auth.php';

// فعال‌سازی افزونه - ایجاد جداول دیتابیس
register_activation_hook(__FILE__, 'telegram_raffle_activate');
function telegram_raffle_activate() {
    $database = new TelegramRaffleDatabase();
    $database->create_tables(); // ایجاد جداول مورد نیاز
}

// غیرفعال‌سازی افزونه
register_deactivation_hook(__FILE__, 'telegram_raffle_deactivate');
function telegram_raffle_deactivate() {
    // پاک‌سازی cache ها و تنظیمات موقت
}
```

### 3️⃣ فایل مدیریت دیتابیس (class-database.php)
```php
<?php
class TelegramRaffleDatabase {
    
    // ایجاد جداول مورد نیاز
    public function create_tables() {
        global $wpdb;
        
        // جدول کاربران تلگرام
        $table_users = $wpdb->prefix . 'telegram_users';
        $sql_users = "CREATE TABLE IF NOT EXISTS $table_users (
            id int(11) NOT NULL AUTO_INCREMENT,
            telegram_id varchar(255) NOT NULL UNIQUE,
            username varchar(255),
            first_name varchar(255),
            last_name varchar(255),
            user_type enum('regular', 'channel_admin', 'bot_admin') DEFAULT 'regular',
            level int(11) DEFAULT 1,
            points int(11) DEFAULT 0,
            referral_code varchar(100),
            referrer_id int(11) NULL,
            is_active tinyint(1) DEFAULT 1,
            last_activity datetime,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY telegram_id (telegram_id),
            KEY user_type (user_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        
        // جدول قرعه‌کشی‌ها
        $table_raffles = $wpdb->prefix . 'telegram_raffles';
        $sql_raffles = "CREATE TABLE IF NOT EXISTS $table_raffles (
            id int(11) NOT NULL AUTO_INCREMENT,
            title varchar(500) NOT NULL,
            description text,
            prize varchar(500),
            image_url varchar(500),
            status enum('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
            level_required int(11) DEFAULT 1,
            creator_id int(11),
            winners_count int(11) DEFAULT 1,
            max_participants int(11) DEFAULT 0,
            start_date datetime,
            end_date datetime,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            approved_by int(11) NULL,
            approved_at datetime NULL,
            PRIMARY KEY (id),
            KEY status (status),
            KEY level_required (level_required),
            KEY creator_id (creator_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_users);
        dbDelta($sql_raffles);
    }
    
    // سایر متدها...
}
```

### 4️⃣ فایل API (class-api.php)
```php
<?php
class TelegramRaffleAPI {
    
    public function __construct() {
        // ثبت مسیرهای API
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    public function register_routes() {
        // مسیر اصلی API
        register_rest_route('telegram/v1', '/webhook', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_webhook'),
            'permission_callback' => array($this, 'verify_telegram_request')
        ));
        
        // مسیر دریافت قرعه‌کشی‌ها
        register_rest_route('telegram/v1', '/raffles', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_raffles'),
            'permission_callback' => '__return_true'
        ));
        
        // مسیر شرکت در قرعه‌کشی
        register_rest_route('telegram/v1', '/raffles/(?P<id>\d+)/join', array(
            'methods' => 'POST',
            'callback' => array($this, 'join_raffle'),
            'permission_callback' => array($this, 'verify_user_auth')
        ));
    }
    
    // پردازش webhook تلگرام
    public function handle_webhook($request) {
        $data = $request->get_json_params();
        
        if (isset($data['message'])) {
            return $this->process_message($data['message']);
        }
        
        if (isset($data['callback_query'])) {
            return $this->process_callback_query($data['callback_query']);
        }
        
        return new WP_REST_Response('OK', 200);
    }
}
```

## 🎨 راهنمای سازگاری تم

### چگونه با هر تم وردپرس کار می‌کند:

#### 1️⃣ تم‌های محبوب تست شده:
```
✅ Astra - کاملاً سازگار
✅ GeneratePress - سازگار
✅ OceanWP - سازگار  
✅ Neve - سازگار
✅ Twenty Twenty-Four - سازگار
✅ Blocksy - سازگار
✅ Kadence - سازگار
```

#### 2️⃣ نحوه عملکرد سازگاری:
```css
/* استایل‌های ما از متغیرهای تم استفاده می‌کنند */

.telegram-widget {
    /* از رنگ اصلی تم استفاده می‌کند */
    background-color: var(--theme-primary-color, #2196F3);
    
    /* از فونت تم استفاده می‌کند */  
    font-family: var(--theme-font-family, inherit);
    
    /* از border-radius تم استفاده می‌کند */
    border-radius: var(--theme-border-radius, 8px);
}
```

#### 3️⃣ تست تغییر تم:
1. **قبل از تغییر:** بک‌آپ بگیرید
2. **تغییر تم:** از بخش Appearance > Themes
3. **بعد از تغییر:** 
   - رنگ‌ها خودکار تطبیق می‌یابند
   - فونت‌ها خودکار تغییر می‌کنند
   - Layout خودکار سازگار می‌شود

## 🔄 فرآیند به‌روزرسانی

### هنگام به‌روزرسانی افزونه:
```php
// فایل: includes/class-updater.php

class TelegramRaffleUpdater {
    public function check_version() {
        $current_version = get_option('telegram_raffle_version', '1.0.0');
        $new_version = '1.1.0'; // نسخه جدید
        
        if (version_compare($current_version, $new_version, '<')) {
            $this->run_updates($current_version, $new_version);
        }
    }
    
    private function run_updates($from, $to) {
        // به‌روزرسانی دیتابیس
        // به‌روزرسانی تنظیمات
        // پاک‌سازی کش
    }
}
```

## 🚨 عیب‌یابی مشکلات رایج

### مشکل 1: ویجت‌ها نمایش داده نمی‌شوند
**علت:** تداخل با تم جدید  
**راه‌حل:**
1. برو به Elementor > Tools
2. کلیک کن روی "Regenerate CSS & Data"
3. کش مرورگر را پاک کن

### مشکل 2: API کار نمی‌کند
**علت:** تنظیمات Permalink  
**راه‌حل:**
1. برو به Settings > Permalinks
2. روی "Save Changes" کلیک کن
3. .htaccess را بررسی کن

### مشکل 3: استایل‌ها به هم ریخته
**علت:** تداخل CSS  
**راه‌حل:**
```css
/* اضافه کردن این کد به Elementor > Custom CSS */
.telegram-widget {
    all: initial; /* ریست کردن همه استایل‌ها */
    font-family: inherit;
    direction: rtl;
}
```

## 📋 چک‌لیست نگهداری

### هفتگی:
- [ ] بررسی لاگ‌های خطا
- [ ] تست API endpoints  
- [ ] بررسی عملکرد سایت
- [ ] بک‌آپ از دیتابیس

### ماهانه:
- [ ] به‌روزرسانی افزونه‌ها
- [ ] بررسی امنیت
- [ ] پاک‌سازی فایل‌های موقت
- [ ] بهینه‌سازی دیتابیس

### بک‌آپ ضروری:
```bash
فایل‌های حیاتی برای بک‌آپ:
✓ wp-config.php
✓ پوشه wp-content/plugins/telegram-raffle-plugin/
✓ پوشه wp-content/themes/telegram-raffle-theme/
✓ دیتابیس کامل
✓ فایل .htaccess
```

---

## 📞 پشتیبانی و تماس

اگر مشکلی پیش آمد:
1. ابتدا این راهنما را مطالعه کنید
2. بخش عیب‌یابی را بررسی کنید  
3. در صورت عدم حل مشکل، با سازنده تماس بگیرید

**📧 اطلاعات تماس:** [اطلاعات تماس شما]  
**🌐 وب‌سایت:** [وب‌سایت شما]
**📱 پشتیبانی:** [شماره پشتیبانی]

---
**📅 آخرین بروزرسانی:** $(date)  
**📖 نسخه راهنما:** 1.0  
**✍️ نویسنده:** سیستم هوشمند انتقال مینی‌اپ