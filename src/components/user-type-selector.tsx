import { Gift, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UserTypeSelectorProps {
  onSelectType: (type: "regular" | "channel_admin") => void;
}

export function UserTypeSelector({ onSelectType }: UserTypeSelectorProps) {
  return (
    <div className="p-6 animate-telegram-slide-up">
      <Card className="telegram-card p-8 text-center">
        <div className="w-20 h-20 bg-telegram-blue/10 rounded-full mx-auto mb-6 flex items-center justify-center">
          <div className="w-12 h-12 bg-telegram-blue/20 rounded-full flex items-center justify-center">
            <Star className="text-telegram-blue" size={24} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-telegram mb-3">خوش آمدید!</h2>
        <p className="text-telegram-secondary mb-8 text-base">لطفاً نوع حساب کاربری خود را انتخاب کنید:</p>
        
        <div className="space-y-4">
          <Button
            onClick={() => onSelectType("regular")}
            className="w-full p-6 bg-gradient-to-r from-telegram-blue to-telegram-blue-light text-white rounded-telegram hover:scale-[1.02] transition-all duration-300 animate-telegram-bounce shadow-telegram-lg"
          >
            <div className="flex items-center justify-center space-x-reverse space-x-4">
              <Gift size={28} />
              <div className="text-right">
                <div className="font-bold text-lg">شرکت در قرعه‌کشی</div>
                <div className="text-sm opacity-90">می‌خواهم در قرعه‌کشی‌ها شرکت کنم</div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => onSelectType("channel_admin")}
            className="w-full p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-telegram hover:scale-[1.02] transition-all duration-300 animate-telegram-bounce shadow-telegram-lg"
          >
            <div className="flex items-center justify-center space-x-reverse space-x-4">
              <Crown size={28} />
              <div className="text-right">
                <div className="font-bold text-lg">مدیر کانال هستم</div>
                <div className="text-sm opacity-90">می‌خواهم قرعه‌کشی ارسال کنم</div>
              </div>
            </div>
          </Button>
        </div>
        
        <div className="mt-8 p-4 bg-telegram-surface-variant rounded-telegram">
          <p className="text-xs text-telegram-secondary">
            می‌توانید بعداً نوع حساب کاربری خود را تغییر دهید
          </p>
        </div>
      </Card>
    </div>
  );
}
