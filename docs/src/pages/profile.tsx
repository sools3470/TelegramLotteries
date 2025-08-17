import { useQuery } from "@tanstack/react-query";
import { useTelegram } from "@/hooks/use-telegram";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Star, 
  Trophy, 
  Gift, 
  Users, 
  Share2, 
  Crown,
  CheckCircle,
  Clock
} from "lucide-react";
import { type User as UserType } from "@shared/schema";

export default function Profile() {
  const { user: telegramUser } = useTelegram();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/users/telegram", telegramUser?.id],
    queryFn: () => fetch(`/api/users/telegram/${telegramUser?.id}`).then(res => {
      if (res.status === 404) {
        return null;
      }
      return res.json();
    }),
    enabled: !!telegramUser?.id,
  });

  const { data: sponsorChannels = [] } = useQuery({
    queryKey: ["/api/sponsor-channels"],
    queryFn: () => fetch("/api/sponsor-channels").then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-telegram"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-4">
        <Card className="telegram-card p-6 text-center">
          <CardContent>
            <User className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 dark:text-gray-400">کاربر یافت نشد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = currentUser as UserType;

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "admin":
        return "مدیر";
      case "channel_admin":
        return "مدیر کانال";
      case "regular":
        return "کاربر عادی";
      default:
        return "نامشخص";
    }
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case "admin":
        return "bg-red-500";
      case "channel_admin":
        return "bg-purple-500";
      case "regular":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <Card className="telegram-card animate-telegram-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center space-x-reverse space-x-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg bg-telegram text-white">
                {user.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${getUserTypeBadgeColor(user.userType)} text-white`}>
                  {getUserTypeLabel(user.userType)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Trophy size={12} />
                  سطح {user.level}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-telegram">{user.points.toLocaleString('fa-IR')}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">امتیاز</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{user.level}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">سطح</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">برنده شده</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card className="telegram-card animate-telegram-slide-up" style={{ animationDelay: "0.1s" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">کد معرفی</h3>
            <Share2 className="text-telegram" size={20} />
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4">
            <code className="text-telegram font-mono text-sm">{user.referralCode}</code>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            با معرفی دوستان امتیاز کسب کنید. هر دوست معرفی شده ۱۰۰ امتیاز!
          </p>
          
          <Button className="w-full bg-telegram hover:bg-telegram-dark">
            <Share2 size={16} className="ml-2" />
            اشتراک‌گذاری کد معرفی
          </Button>
        </CardContent>
      </Card>

      {/* Sponsor Channels */}
      <Card className="telegram-card animate-telegram-slide-up" style={{ animationDelay: "0.2s" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">کانال‌های اسپانسر</h3>
            <Users className="text-telegram" size={20} />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            با عضویت در کانال‌های زیر امتیاز کسب کنید
          </p>
          
          <div className="space-y-3">
            {(sponsorChannels as any[]).map((channel: any) => (
              <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className="w-10 h-10 bg-telegram/10 rounded-full flex items-center justify-center">
                    <Star className="text-telegram" size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">{channel.channelName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      +{channel.pointsReward} امتیاز
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  عضویت
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Progress */}
      <Card className="telegram-card animate-telegram-slide-up" style={{ animationDelay: "0.3s" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">پیشرفت سطح</h3>
            <Trophy className="text-telegram" size={20} />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>سطح فعلی: {user.level}</span>
              <span>سطح بعدی: {user.level + 1}</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-telegram to-telegram-light h-3 rounded-full transition-all duration-300" 
                style={{ width: `${(user.points % 1000) / 10}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {1000 - (user.points % 1000)} امتیاز تا سطح بعدی
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={16} />
                سطح {user.level} - برنز
              </span>
              <span className="text-green-500">✓</span>
            </div>
            
            {user.level >= 5 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  سطح ۵ - نقره
                </span>
                <span className="text-green-500">✓</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="text-gray-400" size={16} />
                  سطح ۵ - نقره
                </span>
                <span className="text-gray-400">در انتظار</span>
              </div>
            )}
            
            {user.level >= 10 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Crown className="text-yellow-500" size={16} />
                  سطح ۱۰ - طلا
                </span>
                <span className="text-green-500">✓</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="text-gray-400" size={16} />
                  سطح ۱۰ - طلا
                </span>
                <span className="text-gray-400">در انتظار</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
