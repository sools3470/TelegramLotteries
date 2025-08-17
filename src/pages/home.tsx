import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTelegram } from "@/hooks/use-telegram";
import { UserTypeSelector } from "@/components/user-type-selector";
import { RaffleCard } from "@/components/raffle-card";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, UserPlus, CheckCircle, List, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type User, type Raffle } from "@shared/schema";

export default function Home() {
  const { user: telegramUser, isLoading: telegramLoading } = useTelegram();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Get or create user
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users/telegram", telegramUser?.id],
    queryFn: () => fetch(`/api/users/telegram/${telegramUser?.id}`).then(res => {
      if (res.status === 404) {
        return null; // User doesn't exist yet
      }
      return res.json();
    }),
    enabled: !!telegramUser?.id,
  });

  // Get raffles based on user level
  const { data: raffles = [], isLoading: rafflesLoading } = useQuery({
    queryKey: ["/api/raffles", currentUser?.level],
    queryFn: () => 
      fetch(`/api/raffles?level=${currentUser?.level || 1}`)
        .then(res => res.json()),
    enabled: !!currentUser,
  });

  // Join raffle mutation - Removed since handled in RaffleCard

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userType: "regular" | "channel_admin") => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: telegramUser!.id.toString(),
          username: telegramUser!.username,
          firstName: telegramUser!.first_name,
          lastName: telegramUser!.last_name,
          userType,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: (user: User) => {
      setCurrentUser(user);
      queryClient.setQueryData(["/api/users/telegram", telegramUser?.id], user);
    },
  });

  useEffect(() => {
    if (userData) {
      setCurrentUser(userData as User);
    }
  }, [userData]);

  const handleUserTypeSelect = (userType: "regular" | "channel_admin") => {
    createUserMutation.mutate(userType);
  };

  // Removed handleJoinRaffle since handled in RaffleCard

  if (telegramLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-telegram"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <UserTypeSelector onSelectType={handleUserTypeSelect} />;
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="p-4 animate-telegram-slide-up">
        <div className="grid grid-cols-2 gap-4">
          <Card className="telegram-card p-4 text-center">
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-telegram-blue mb-1">{raffles.length}</div>
              <div className="text-sm text-telegram-secondary">قرعه‌کشی فعال</div>
            </CardContent>
          </Card>
          <Card className="telegram-card p-4 text-center">
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-telegram-blue mb-1">{currentUser.points.toLocaleString('fa-IR')}</div>
              <div className="text-sm text-telegram-secondary">امتیاز شما</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Raffles */}
      <div className="p-4 animate-telegram-slide-up" style={{ animationDelay: "0.1s" }}>
        <Card className="telegram-card">
          <div className="p-4 border-b border-telegram">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-telegram">قرعه‌کشی‌های فعال</h3>
              <span className="text-sm text-telegram-blue cursor-pointer hover:text-telegram-blue-dark transition-colors">مشاهده همه</span>
            </div>
          </div>
          
          <CardContent className="p-4 space-y-4">
            {rafflesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
              </div>
            ) : raffles.length === 0 ? (
              <div className="text-center py-12 text-telegram-secondary">
                <div className="w-16 h-16 bg-telegram-surface-variant rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="text-telegram-blue" size={24} />
                </div>
                <p className="text-base font-medium">هیچ قرعه‌کشی فعالی برای سطح شما وجود ندارد</p>
                <p className="text-sm mt-2">برای مشاهده قرعه‌کشی‌های بیشتر سطح خود را ارتقا دهید</p>
              </div>
            ) : (
              raffles.slice(0, 3).map((raffle: Raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  currentUser={currentUser}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Points and Level */}
      <div className="p-4 animate-telegram-slide-up" style={{ animationDelay: "0.2s" }}>
        <Card className="telegram-card p-4">
          <CardContent className="p-0">
            <h3 className="text-lg font-semibold text-telegram mb-4">سطح و امتیازات</h3>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-10 h-10 bg-telegram-blue/10 rounded-full flex items-center justify-center">
                  <Trophy className="text-telegram-blue" size={20} />
                </div>
                <span className="font-semibold text-telegram text-lg">
                  سطح {currentUser.level}
                </span>
              </div>
              <span className="text-sm text-telegram-secondary font-medium">
                {currentUser.points.toLocaleString('fa-IR')} امتیاز
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-telegram-surface-variant rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-telegram-blue to-telegram-blue-light h-3 rounded-full transition-all duration-500" 
                style={{ width: `${(currentUser.points % 1000) / 10}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-telegram-secondary">
              <span className="font-medium">{1000 - (currentUser.points % 1000)} امتیاز تا سطح بعدی</span>
              <span>{((currentUser.level) * 1000).toLocaleString('fa-IR')} امتیاز</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="p-4 animate-telegram-slide-up" style={{ animationDelay: "0.3s" }}>
        <Card className="telegram-card p-4">
          <CardContent className="p-0">
            <h3 className="text-lg font-semibold text-telegram mb-4">عملیات سریع</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                className="flex flex-col items-center p-4 bg-telegram-blue/5 hover:bg-telegram-blue/10 transition-all duration-200 h-auto rounded-telegram hover:scale-[1.02]"
              >
                <UserPlus className="text-telegram-blue text-xl mb-2" />
                <span className="text-sm font-medium text-telegram">دعوت دوستان</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center p-4 bg-purple-500/5 hover:bg-purple-500/10 transition-all duration-200 h-auto rounded-telegram hover:scale-[1.02]"
              >
                <CheckCircle className="text-purple-600 text-xl mb-2" />
                <span className="text-sm font-medium text-telegram">بررسی عضویت</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center p-4 bg-green-500/5 hover:bg-green-500/10 transition-all duration-200 h-auto rounded-telegram hover:scale-[1.02]"
              >
                <List className="text-green-600 text-xl mb-2" />
                <span className="text-sm font-medium text-telegram">قرعه‌کشی‌هایم</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center p-4 bg-orange-500/5 hover:bg-orange-500/10 transition-all duration-200 h-auto rounded-telegram hover:scale-[1.02]"
              >
                <Settings className="text-orange-600 text-xl mb-2" />
                <span className="text-sm font-medium text-telegram">تنظیمات</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button for channel admins */}
      {currentUser.userType === "channel_admin" && (
        <FloatingActionButton onClick={() => console.log("Create raffle")} />
      )}
    </div>
  );
}
