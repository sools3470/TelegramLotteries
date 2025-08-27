# راهنمای تفصیلی فایل‌ها و نحوه استفاده

## 📂 فایل‌های ایجاد شده

### ۱. فایل‌های راهنما:

#### 📄 `wordpress-deployment-guide.md`
**نقش:** راهنمای قدم‌به‌قدم انتقال کامل مینی‌اپ به وردپرس
**محتویات:**
- نصب وردپرس فارسی
- تنظیم افزونه‌های مورد نیاز
- ساختار پوشه‌ها و فایل‌ها
- تنظیمات دیتابیس
- تنظیمات wp-config.php
- عیب‌یابی مشکلات رایج

**چگونه استفاده کنید:**
1. قبل از شروع، این فایل را از ابتدا تا انتها بخوانید
2. مرحله‌به‌مرحله دستورات را اجرا کنید
3. هر مرحله را تیک بزنید تا گم نشوید

#### 📄 `elementor-integration-guide.md`
**نقش:** راهنمای ادغام کامل با Elementor و ایجاد ویجت‌های سفارشی
**محتویات:**
- نصب و تنظیم Elementor
- ایجاد ویجت‌های مینی‌اپ
- تنظیمات ریسپانسیو
- بهینه‌سازی عملکرد
- الگوهای آماده

**چگونه استفاده کنید:**
1. بعد از نصب وردپرس، این راهنما را دنبال کنید
2. ویجت‌های معرفی شده را پیاده‌سازی کنید
3. تنظیمات ریسپانسیو را اعمال کنید

#### 📄 `theme-compatibility-guide.md`
**نقش:** راهنمای سازگاری با تم‌های مختلف و مدیریت فایل‌ها
**محتویات:**
- ساختار کامل فایل‌های پروژه
- توضیح نقش هر فایل
- راهنمای سازگاری تم‌ها
- فرآیند به‌روزرسانی
- عیب‌یابی پیشرفته

**چگونه استفاده کنید:**
1. هنگام تغییر تم از این راهنما استفاده کنید
2. برای درک ساختار پروژه مطالعه کنید
3. برای حل مشکلات پیچیده مراجعه کنید

#### 📄 `file-descriptions.md` (همین فایل)
**نقش:** راهنمای کلی همه فایل‌ها و نحوه استفاده

---

## 🎯 نحوه شروع کار

### مرحله ۱: آماده‌سازی
```bash
مطالعه ضروری:
1️⃣ ابتدا file-descriptions.md (همین فایل)
2️⃣ سپس wordpress-deployment-guide.md
3️⃣ در آخر elementor-integration-guide.md
4️⃣ در صورت نیاز theme-compatibility-guide.md
```

### مرحله ۲: اجرای عملیات
```bash
ترتیب اجرا:
1. نصب وردپرس فارسی روی هاست
2. دانلود و آماده‌سازی فایل‌های مینی‌اپ  
3. پیروی از wordpress-deployment-guide.md
4. پیاده‌سازی ویجت‌ها با elementor-integration-guide.md
5. تست و عیب‌یابی
```

---

## 🔧 فایل‌هایی که باید خودتان ایجاد کنید

### ۱. قالب وردپرس (Theme)
**مسیر:** `wp-content/themes/telegram-raffle-theme/`

#### 📄 `style.css`
```css
/*
Theme Name: قالب مینی‌اپ قرعه‌کشی تلگرام
Description: قالب سازگار با Elementor برای مینی‌اپ تلگرام
Version: 1.0
Author: نام شما
*/

/* استایل‌های اصلی */
:root {
    --telegram-blue: #2196F3;
    --telegram-secondary: #FFC107;
    --telegram-success: #4CAF50;
    --telegram-warning: #FF9800;
    --telegram-danger: #F44336;
    --telegram-dark: #212121;
    --telegram-light: #FAFAFA;
}

body {
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    direction: rtl;
    text-align: right;
}

/* ریسپانسیو */
@media (max-width: 768px) {
    .telegram-container {
        padding: 15px;
    }
}

@media (min-width: 769px) {
    .telegram-container {
        padding: 30px;
        max-width: 1200px;
        margin: 0 auto;
    }
}

/* سازگاری با تم‌های مختلف */
.telegram-widget {
    background: var(--theme-bg-color, white);
    color: var(--theme-text-color, var(--telegram-dark));
    border-radius: var(--theme-border-radius, 8px);
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}

.telegram-button {
    background: var(--theme-primary-color, var(--telegram-blue));
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: var(--theme-border-radius, 6px);
    cursor: pointer;
    transition: all 0.3s ease;
}

.telegram-button:hover {
    background: var(--theme-primary-hover, #1976D2);
    transform: translateY(-2px);
}

/* انیمیشن‌ها */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
}
```

#### 📄 `functions.php`
```php
<?php
// جلوگیری از دسترسی مستقیم
if (!defined('ABSPATH')) exit;

// بارگذاری استایل‌ها و اسکریپت‌ها
function telegram_raffle_enqueue_assets() {
    // CSS اصلی
    wp_enqueue_style(
        'telegram-raffle-style',
        get_template_directory_uri() . '/style.css',
        array(),
        '1.0.0'
    );
    
    // فونت فارسی
    wp_enqueue_style(
        'vazirmatn-font',
        'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap',
        array(),
        null
    );
    
    // JavaScript اصلی
    wp_enqueue_script(
        'telegram-raffle-script',
        get_template_directory_uri() . '/assets/js/main.js',
        array('jquery'),
        '1.0.0',
        true
    );
    
    // تنظیمات AJAX
    wp_localize_script('telegram-raffle-script', 'telegram_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('telegram_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'telegram_raffle_enqueue_assets');

// پشتیبانی از Elementor
function telegram_raffle_theme_support() {
    // پشتیبانی از تصاویر شاخص
    add_theme_support('post-thumbnails');
    
    // پشتیبانی از عنوان خودکار
    add_theme_support('title-tag');
    
    // پشتیبانی از HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form', 
        'comment-list',
        'gallery',
        'caption'
    ));
    
    // پشتیبانی از رنگ‌های سفارشی
    add_theme_support('custom-background');
    add_theme_support('custom-logo');
    
    // پشتیبانی از Elementor
    add_theme_support('elementor');
}
add_action('after_setup_theme', 'telegram_raffle_theme_support');

// ثبت منوها
function telegram_raffle_register_menus() {
    register_nav_menus(array(
        'main-menu' => 'منوی اصلی',
        'footer-menu' => 'منوی فوتر'
    ));
}
add_action('init', 'telegram_raffle_register_menus');

// ثبت sidebar ها
function telegram_raffle_register_sidebars() {
    register_sidebar(array(
        'name' => 'نوار کناری اصلی',
        'id' => 'main-sidebar',
        'description' => 'نوار کناری صفحات اصلی',
        'before_widget' => '<div class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>'
    ));
}
add_action('widgets_init', 'telegram_raffle_register_sidebars');

// حذف نسخه وردپرس از header (امنیت)
remove_action('wp_head', 'wp_generator');

// فعال‌سازی کش
function telegram_raffle_cache_headers() {
    if (!is_admin()) {
        header('Cache-Control: max-age=3600');
    }
}
add_action('send_headers', 'telegram_raffle_cache_headers');
```

#### 📄 `index.php`
```php
<?php get_header(); ?>

<div class="telegram-container">
    <main class="main-content">
        
        <?php if (have_posts()) : ?>
            <div class="posts-container">
                <?php while (have_posts()) : the_post(); ?>
                    <article class="telegram-widget animate-fade-in-up">
                        <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                        <div class="post-meta">
                            <span>تاریخ: <?php echo get_the_date('j F Y'); ?></span>
                            <span>نویسنده: <?php the_author(); ?></span>
                        </div>
                        
                        <?php if (has_post_thumbnail()) : ?>
                            <div class="post-thumbnail">
                                <?php the_post_thumbnail('medium'); ?>
                            </div>
                        <?php endif; ?>
                        
                        <div class="post-excerpt">
                            <?php the_excerpt(); ?>
                        </div>
                        
                        <a href="<?php the_permalink(); ?>" class="telegram-button">
                            ادامه مطلب
                        </a>
                    </article>
                <?php endwhile; ?>
            </div>
            
            <!-- صفحه‌بندی -->
            <div class="pagination">
                <?php
                echo paginate_links(array(
                    'prev_text' => '← قبلی',
                    'next_text' => 'بعدی →'
                ));
                ?>
            </div>
            
        <?php else : ?>
            <div class="telegram-widget">
                <h2>محتوایی یافت نشد</h2>
                <p>متأسفانه محتوای مورد نظر پیدا نشد.</p>
            </div>
        <?php endif; ?>
        
    </main>
    
    <?php get_sidebar(); ?>
</div>

<?php get_footer(); ?>
```

### ۲. افزونه اصلی (Plugin)
**مسیر:** `wp-content/plugins/telegram-raffle-plugin/`

#### 📄 `telegram-raffle.php`
```php
<?php
/**
 * Plugin Name: مینی‌اپ قرعه‌کشی تلگرام
 * Plugin URI: https://yourdomain.com
 * Description: سیستم کامل مدیریت قرعه‌کشی تلگرام برای وردپرس با پشتیبانی از Elementor
 * Version: 1.0.0
 * Author: نام شما
 * Author URI: https://yourdomain.com
 * Text Domain: telegram-raffle
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// امنیت - جلوگیری از دسترسی مستقیم
if (!defined('ABSPATH')) {
    exit('دسترسی مستقیم مجاز نیست.');
}

// تعریف ثوابت
define('TELEGRAM_RAFFLE_VERSION', '1.0.0');
define('TELEGRAM_RAFFLE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('TELEGRAM_RAFFLE_PLUGIN_PATH', plugin_dir_path(__FILE__));

// بارگذاری کلاس اصلی
require_once TELEGRAM_RAFFLE_PLUGIN_PATH . 'includes/class-telegram-raffle.php';

// فعال‌سازی افزونه
register_activation_hook(__FILE__, array('TelegramRaffle', 'activate'));

// غیرفعال‌سازی افزونه  
register_deactivation_hook(__FILE__, array('TelegramRaffle', 'deactivate'));

// حذف افزونه
register_uninstall_hook(__FILE__, array('TelegramRaffle', 'uninstall'));

// راه‌اندازی افزونه
function telegram_raffle_init() {
    new TelegramRaffle();
}
add_action('plugins_loaded', 'telegram_raffle_init');

// بارگذاری متن‌های ترجمه
function telegram_raffle_load_textdomain() {
    load_plugin_textdomain('telegram-raffle', false, dirname(plugin_basename(__FILE__)) . '/languages');
}
add_action('plugins_loaded', 'telegram_raffle_load_textdomain');
```

---

## 🚀 مراحل پیاده‌سازی

### گام ۱: ایجاد ساختار پایه
```bash
1. ایجاد پوشه قالب: wp-content/themes/telegram-raffle-theme/
2. ایجاد پوشه افزونه: wp-content/plugins/telegram-raffle-plugin/
3. کپی فایل‌های موجود مینی‌اپ
4. تبدیل React components به PHP templates
5. تبدیل Express.js routes به WordPress REST API
```

### گام ۲: تنظیم دیتابیس
```sql
-- جداولی که باید ایجاد شوند:
wp_telegram_users
wp_telegram_raffles  
wp_telegram_participants
wp_telegram_messages
wp_telegram_referrals
```

### گام ۳: پیاده‌سازی API
```php
// مسیرهای API که باید ایجاد شوند:
/wp-json/telegram/v1/webhook          # Webhook تلگرام
/wp-json/telegram/v1/raffles          # لیست قرعه‌کشی‌ها
/wp-json/telegram/v1/raffles/{id}/join # شرکت در قرعه‌کشی
/wp-json/telegram/v1/user/profile     # پروفایل کاربر  
/wp-json/telegram/v1/user/stats       # آمار کاربر
/wp-json/telegram/v1/admin/manage     # پنل مدیریت
```

### گام ۴: ایجاد ویجت‌های Elementor
```php
// ویجت‌هایی که باید ایجاد شوند:
- Telegram_Raffle_Card_Widget         # کارت قرعه‌کشی
- Telegram_User_Stats_Widget          # آمار کاربر
- Telegram_Referral_Widget            # سیستم ارجاع  
- Telegram_Admin_Panel_Widget         # پنل مدیریت
```

---

## 📞 راهنمای پشتیبانی

### مشکلات رایج و راه‌حل:

#### ❌ خطا: "افزونه فعال نمی‌شود"
**علت:** مشکل در کد PHP یا عدم سازگاری نسخه  
**راه‌حل:** 
1. لاگ‌های خطا را بررسی کنید
2. نسخه PHP را چک کنید (حداقل 7.4)
3. کد PHP را از نظر syntax بررسی کنید

#### ❌ خطا: "API کار نمی‌کند"  
**علت:** تنظیمات Permalink یا .htaccess
**راه‌حل:**
1. Settings > Permalinks > Save Changes
2. .htaccess را بررسی کنید
3. مجوزهای فایل‌ها را چک کنید

#### ❌ خطا: "ویجت‌ها نمایش داده نمی‌شوند"
**علت:** تداخل CSS یا JavaScript
**راه‌حل:**
1. Elementor > Tools > Regenerate CSS
2. کش مرورگر را پاک کنید
3. تم را موقتاً تغییر دهید و دوباره فعال کنید

---

## ✅ چک‌لیست نهایی

### قبل از انتشار:
- [ ] تمام فایل‌های راهنما مطالعه شده
- [ ] وردپرس نصب و تست شده  
- [ ] افزونه‌های مورد نیاز نصب شده
- [ ] قالب آپلود و فعال شده
- [ ] افزونه اصلی آپلود و فعال شده
- [ ] تنظیمات wp-config.php انجام شده
- [ ] API endpoints تست شده
- [ ] ویجت‌های Elementor کار می‌کنند
- [ ] طراحی در موبایل و دسکتاپ تست شده
- [ ] تغییر تم تست شده
- [ ] بک‌آپ کامل گرفته شده

### بعد از انتشار:
- [ ] SSL نصب شده (https)
- [ ] Webhook تلگرام تنظیم شده
- [ ] کش فعال شده
- [ ] آمار و مانیتورینگ راه‌اندازی شده
- [ ] بک‌آپ‌گیری خودکار تنظیم شده

---

**📚 یادآوری:** این فایل‌ها راهنمای کاملی هستند. حتماً به ترتیب مطالعه کنید و هر مرحله را با دقت اجرا نمایید.

**🎯 هدف نهایی:** داشتن یک مینی‌اپ کاملاً کاربردی در وردپرس که با هر تمی سازگار باشد و امکانات کامل تلگرام را داشته باشد.