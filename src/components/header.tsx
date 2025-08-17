import { Bell, UserCircle, Star, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  
  // Determine title and subtitle based on user role
  const getHeaderInfo = () => {
    if (!user) return { title: "دنیای قرعه‌کشی", subtitle: "قرعه‌کشی‌های استارز تلگرام" };
    
    const userRole = user.userType;
    const adminLevel = user.adminLevel;
    
    if (userRole === "bot_admin" && adminLevel === 1) {
      return { 
        title: title || "پنل مدیریت کامل", 
        subtitle: subtitle || "دسترسی مدیر اصلی" 
      };
    } else if (userRole === "bot_admin" && adminLevel === 2) {
      return { 
        title: title || "پنل مدیر محدود", 
        subtitle: subtitle || "دسترسی سطح 2" 
      };
    } else if (userRole === "channel_admin") {
      return { 
        title: title || "پنل مدیر کانال", 
        subtitle: subtitle || "ثبت قرعه‌کشی" 
      };
    } else {
      return { 
        title: title || "دنیای قرعه‌کشی", 
        subtitle: subtitle || "قرعه‌کشی‌های استارز تلگرام" 
      };
    }
  };
  
  const { title: displayTitle, subtitle: displaySubtitle } = getHeaderInfo();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    
    if (newTheme === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemPrefersDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun size={18} />;
    if (theme === "dark") return <Moon size={18} />;
    return <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-blue-600"></div>;
  };

  return (
    <header className="bg-telegram-blue text-white sticky top-0 z-40 animate-telegram-slide-up h-16 flex-shrink-0">
      <div className="px-4 py-2 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Star className="text-yellow-300" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{displayTitle}</h1>
              <p className="text-white/80 text-sm">{displaySubtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25 transition-all duration-200 backdrop-blur-sm"
            >
              {getThemeIcon()}
            </button>
            <button className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25 transition-all duration-200 backdrop-blur-sm">
              <Bell className="text-white" size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
