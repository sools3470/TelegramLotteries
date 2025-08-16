import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  Crown, 
  Calendar, 
  Clock, 
  Users, 
  Eye, 
  Heart,
  Filter,
  Gift,
  TrendingUp,
  Trophy,
  CheckCircle
} from "lucide-react";

export default function RegularUserPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Get raffles based on user level and filter
  const { data: raffles = [], isLoading: rafflesLoading } = useQuery({
    queryKey: ['/api/raffles', user?.id, activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      if (activeFilter && activeFilter !== 'all') params.append('filter', activeFilter);
      
      const response = await fetch(`/api/raffles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch raffles');
      }
      return await response.json();
    },
    enabled: !!user?.id,
  });

  // Get user's interactions
  const { data: seenRaffles = [] } = useQuery({
    queryKey: ['/api/user/seen-raffles', user?.id],
    enabled: !!user?.id,
  }) as { data: string[] };

  const { data: joinedRaffles = [] } = useQuery({
    queryKey: ['/api/user/joined-raffles', user?.id],
    enabled: !!user?.id,
  }) as { data: string[] };

  const joinRaffleMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await fetch(`/api/raffles/${raffleId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to join raffle");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "با موفقیت در قرعه‌کشی شرکت کردید",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/joined-raffles'] });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در شرکت در قرعه‌کشی",
        variant: "destructive",
      });
      console.error("Join raffle error:", error);
    },
  });

  const markSeenMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await fetch(`/api/raffles/${raffleId}/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark as seen");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/seen-raffles'] });
    },
  });

  const handleJoinRaffle = (raffleId: string) => {
    joinRaffleMutation.mutate(raffleId);
  };

  const handleMarkSeen = (raffleId: string) => {
    if (!seenRaffles?.includes?.(raffleId)) {
      markSeenMutation.mutate(raffleId);
    }
  };

  const getFilteredRaffles = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (activeFilter) {
      case "today":
        return raffles.filter((raffle: any) => {
          const raffleDate = new Date(raffle.raffleDateTime);
          return raffleDate >= today && raffleDate < tomorrow;
        });
      case "seen":
        return raffles.filter((raffle: any) => seenRaffles?.includes?.(raffle.id));
      case "joined":
        return raffles.filter((raffle: any) => joinedRaffles?.includes?.(raffle.id));
      case "ended":
        return raffles.filter((raffle: any) => new Date(raffle.raffleDateTime) < now);
      case "favorites":
        // TODO: Implement favorites functionality
        return raffles.filter((raffle: any) => raffle.isFavorite);
      default:
        return raffles;
    }
  };

  const filteredRaffles = getFilteredRaffles();

  const getPrizeIcon = (prizeType: string) => {
    switch (prizeType) {
      case "stars":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "premium":
        return <Crown className="w-4 h-4 text-orange-500" />;
      case "mixed":
        return (
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-yellow-500" />
            <Crown className="w-3 h-3 text-orange-500" />
          </div>
        );
      default:
        return <Gift className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPrizeTypeText = (prizeType: string) => {
    switch (prizeType) {
      case "stars":
        return "استارز";
      case "premium":
        return "پریمیوم";
      default:
        return "ترکیبی";
    }
  };

  const isRaffleEnded = (raffleDateTime: string) => {
    return new Date(raffleDateTime) < new Date();
  };

  const isUserJoined = (raffleId: string) => {
    return joinedRaffles?.includes?.(raffleId) || false;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          دنیای قرعه‌کشی
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          در قرعه‌کشی‌های مناسب سطح خود شرکت کنید
        </p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-blue-600">{user?.level}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">سطح شما</div>
          </CardContent>
        </Card>
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-green-600">{user?.points}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">امتیاز</div>
          </CardContent>
        </Card>
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-yellow-600">{joinedRaffles?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">شرکت کرده</div>
          </CardContent>
        </Card>
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-purple-600">{seenRaffles?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">مشاهده شده</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
          <TabsTrigger value="today" className="text-xs">امروز</TabsTrigger>
          <TabsTrigger value="seen" className="text-xs">مشاهده شده</TabsTrigger>
          <TabsTrigger value="joined" className="text-xs">شرکت کرده</TabsTrigger>
          <TabsTrigger value="ended" className="text-xs">پایان یافته</TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs">مورد علاقه</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="space-y-4">
          {/* Filter Description */}
          <Card className="telegram-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Filter className="w-4 h-4" />
                {activeFilter === "all" && "تمام قرعه‌کشی‌های مناسب سطح شما"}
                {activeFilter === "today" && "قرعه‌کشی‌های امروز"}
                {activeFilter === "seen" && "قرعه‌کشی‌هایی که مشاهده کرده‌اید"}
                {activeFilter === "joined" && "قرعه‌کشی‌هایی که در آن شرکت کرده‌اید"}
                {activeFilter === "ended" && "قرعه‌کشی‌های پایان یافته"}
                {activeFilter === "favorites" && "قرعه‌کشی‌های مورد علاقه شما"}
                <Badge variant="outline" className="ml-auto">
                  {filteredRaffles.length} مورد
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Raffles List */}
          {rafflesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
            </div>
          ) : filteredRaffles.length === 0 ? (
            <Card className="telegram-card">
              <CardContent className="p-8 text-center">
                <div className="text-gray-600 dark:text-gray-400">
                  {activeFilter === "all" && "قرعه‌کشی‌ای برای سطح شما موجود نیست"}
                  {activeFilter === "today" && "قرعه‌کشی امروز موجود نیست"}
                  {activeFilter === "seen" && "هنوز قرعه‌کشی‌ای مشاهده نکرده‌اید"}
                  {activeFilter === "joined" && "هنوز در قرعه‌کشی‌ای شرکت نکرده‌اید"}
                  {activeFilter === "ended" && "قرعه‌کشی پایان یافته‌ای موجود نیست"}
                  {activeFilter === "favorites" && "هنوز قرعه‌کشی‌ای به علاقه‌مندی‌ها اضافه نکرده‌اید"}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRaffles.map((raffle: any) => (
                <Card 
                  key={raffle.id} 
                  className={`telegram-card cursor-pointer transition-all hover:shadow-md ${
                    seenRaffles?.includes?.(raffle.id) ? 'opacity-75' : ''
                  }`}
                  onClick={() => handleMarkSeen(raffle.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex-1">
                            {raffle.title}
                          </h3>
                          {!seenRaffles?.includes?.(raffle.id) && (
                            <div className="w-2 h-2 bg-telegram rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {raffle.prizeDescription}
                        </p>
                        
                        {/* Raffle Info */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            {getPrizeIcon(raffle.prizeType)}
                            {getPrizeTypeText(raffle.prizeType)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(raffle.raffleDateTime).toLocaleDateString('fa-IR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(raffle.raffleDateTime).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            سطح {raffle.levelRequired}
                          </span>
                        </div>

                        {/* Required Channels */}
                        {raffle.requiredChannels?.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-gray-500">عضویت در:</span>
                            <div className="flex gap-1 flex-wrap">
                              {raffle.requiredChannels.slice(0, 3).map((channel: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                                  {channel}
                                </Badge>
                              ))}
                              {raffle.requiredChannels.length > 3 && (
                                <Badge variant="outline" className="text-xs px-2 py-0">
                                  +{raffle.requiredChannels.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {raffle.participantCount || 0}
                        </span>
                        {seenRaffles?.includes?.(raffle.id) && (
                          <span className="flex items-center gap-1 text-blue-500">
                            <CheckCircle className="w-3 h-3" />
                            مشاهده شده
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Favorite Button */}
                        <Button variant="ghost" size="sm" className="p-2">
                          <Heart className="w-4 h-4" />
                        </Button>
                        
                        {/* Join Button */}
                        {isRaffleEnded(raffle.raffleDateTime) ? (
                          <Badge variant="outline" className="text-gray-500">
                            <Trophy className="w-3 h-3 mr-1" />
                            پایان یافته
                          </Badge>
                        ) : isUserJoined(raffle.id) ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            شرکت کرده
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinRaffle(raffle.id);
                            }}
                            disabled={joinRaffleMutation.isPending}
                            className="bg-telegram hover:bg-telegram/90 text-white text-xs px-3 py-1"
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            شرکت
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}