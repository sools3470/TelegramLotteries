import { Home, Gift, User, History } from "lucide-react";
import { useLocation } from "wouter";

interface NavItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "خانه", path: "/" },
  { icon: Gift, label: "قرعه‌کشی‌ها", path: "/raffles" },
  { icon: User, label: "پروفایل", path: "/profile" },
  { icon: History, label: "تاریخچه", path: "/history" },
];

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-telegram-surface border-t border-telegram backdrop-blur-xl z-40">
      <div className="flex justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "text-telegram-blue bg-telegram-blue/10" 
                  : "text-telegram-secondary hover:text-telegram hover:bg-telegram-surface-variant"
              }`}
            >
              <Icon size={22} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
