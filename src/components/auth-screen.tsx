import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useTelegram } from "@/hooks/use-telegram";
import { Mail, MessageCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isGmailLogin, setIsGmailLogin] = useState(false);
  const { loginWithTelegram, loginWithGmail, isLoading } = useAuth();
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

  const handleGmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    try {
      await loginWithGmail(email, name);
      toast({
        title: "ورود موفق",
        description: "به دنیای قرعه‌کشی خوش آمدید!",
      });
    } catch (error) {
      toast({
        title: "خطا در ورود",
        description: "لطفاً اطلاعات صحیح وارد کنید",
        variant: "destructive",
      });
    }
  };

  const botStartLink = "https://t.me/your_raffle_bot"; // این باید از API گرفته شود

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

        {/* Authentication Options */}
        <div className="space-y-4">
          {/* Telegram Login */}
          {isInTelegram ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  ورود با تلگرام
                </CardTitle>
                <CardDescription>
                  با اکانت تلگرام خود وارد شوید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleTelegramLogin}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  {isLoading ? "در حال ورود..." : "ورود با تلگرام"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  از طریق تلگرام ورود کنید
                </CardTitle>
                <CardDescription>
                  برای بهترین تجربه، از طریق ربات تلگرام استفاده کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => window.open(botStartLink, '_blank')}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  رفتن به ربات تلگرام
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                یا
              </span>
            </div>
          </div>

          {/* Gmail Login */}
          {!isGmailLogin ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5 text-red-500" />
                  ورود با ایمیل
                </CardTitle>
                <CardDescription>
                  اگر کاربر تلگرام نیستید، با ایمیل وارد شوید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setIsGmailLogin(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 ml-2" />
                  ورود با ایمیل
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>ورود با ایمیل</CardTitle>
                <CardDescription>
                  اطلاعات خود را وارد کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">نام کامل</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="نام و نام خانوادگی"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading || !email || !name}
                      className="flex-1"
                    >
                      {isLoading ? "در حال ورود..." : "ورود"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsGmailLogin(false)}
                    >
                      بازگشت
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>با ورود به سیستم، شرایط استفاده را می‌پذیرید</p>
        </div>
      </div>
    </div>
  );
}