import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useTelegram } from "@/hooks/use-telegram";
import { Mail, MessageCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AuthScreen() {
  const { loginWithTelegram, isLoading } = useAuth();
  const { isInTelegram } = useTelegram();
  const { toast } = useToast();

  const handleTelegramLogin = async () => {
    try {
      await loginWithTelegram();
      toast({
        title: "ورود موفق",
        description: "به دنیای قرعه‌کشی خوش آمدید!",
      });
    } catch (error) {
      toast({
        title: "خطا در ورود",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  const botStartLink = "https://t.me/your_raffle_bot"; // این باید از API گرفته شود

  if (isLoading && isInTelegram) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
          <div className="text-center">
            <p className="text-telegram-text font-medium">در حال آماده‌سازی مینی‌اپ...</p>
            <p className="text-telegram-hint text-sm mt-1">لطفاً چند لحظه صبر کنید</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            دنیای قرعه‌کشی
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ورود به سیستم قرعه‌کشی‌های استارز تلگرام
          </p>
        </div>

        {/* Telegram Login */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              ورود با تلگرام
            </CardTitle>
            <CardDescription>
              برای استفاده از این مینی‌اپ باید در تلگرام باشید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInTelegram ? (
              <Button 
                onClick={handleTelegramLogin}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    در حال ورود...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    ورود خودکار
                  </div>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <Button 
                  asChild
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <a href={botStartLink} target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      ورود به تلگرام
                    </div>
                  </a>
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  برای استفاده از این مینی‌اپ، ابتدا در تلگرام وارد شوید
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}