import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Star, Crown, Gift, Clock, ExternalLink, CheckCircle } from "lucide-react";
import { type Raffle, type User } from "@shared/schema";
import { useTelegram } from "@/hooks/use-telegram";
import { useToast } from "@/hooks/use-toast";

interface RaffleCardProps {
  raffle: Raffle;
  currentUser?: User;
}

export function RaffleCard({ raffle, currentUser }: RaffleCardProps) {
  const { user: telegramUser } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  // Check if user has joined this raffle
  const { data: joinStatus } = useQuery({
    queryKey: ["/api/raffles", raffle.id, "joined", currentUser?.id],
    queryFn: () => 
      fetch(`/api/raffles/${raffle.id}/joined/${currentUser?.id}`)
        .then(res => res.json()),
    enabled: !!currentUser?.id,
  });

  const hasJoined = joinStatus?.hasJoined || false;

  // Mark raffle as seen when component mounts
  useEffect(() => {
    if (currentUser?.id && !hasBeenSeen) {
      fetch(`/api/raffles/${raffle.id}/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      }).then(() => {
        setHasBeenSeen(true);
      }).catch(console.error);
    }
  }, [currentUser?.id, raffle.id, hasBeenSeen]);

  // Join raffle mutation
  const joinRaffleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/raffles/${raffle.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", raffle.id, "joined"] });
      toast({
        title: "موفقیت",
        description: "با موفقیت در قرعه‌کشی شرکت کردید",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در شرکت در قرعه‌کشی",
        variant: "destructive",
      });
    },
  });

  const handleJoinRaffle = () => {
    if (!currentUser) {
      toast({
        title: "خطا", 
        description: "لطفاً ابتدا وارد شوید",
        variant: "destructive",
      });
      return;
    }
    
    if (hasJoined) {
      toast({
        title: "اطلاع",
        description: "شما قبلاً در این قرعه‌کشی شرکت کرده‌اید",
      });
      return;
    }

    joinRaffleMutation.mutate();
  };

  const getPrizeIcon = (prizeType: string) => {
    switch (prizeType) {
      case "stars":
        return <Star className="text-yellow-400" size={20} />;
      case "premium":
        return <Crown className="text-purple-500" size={20} />;
      case "mixed":
        return (
          <div className="flex items-center gap-0.5">
            <Star className="text-yellow-400" size={16} />
            <Crown className="text-purple-500" size={16} />
          </div>
        );
      default:
        return <Gift className="text-gray-400" size={20} />;
    }
  };

  const getPrizeBadgeColor = (prizeType: string) => {
    switch (prizeType) {
      case "stars":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "premium":
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "mixed":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getPrizeTypeLabel = (prizeType: string) => {
    switch (prizeType) {
      case "stars":
        return "استارز تلگرام";
      case "premium":
        return "اشتراک پریمیم";
      case "mixed":
        return "جایزه ترکیبی";
      default:
        return "نامشخص";
    }
  };

  const formatDateTime = (dateTime: Date) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('fa-IR') + ' ساعت ' + date.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get sponsor channels to find channelUrl for proper navigation
  const { data: sponsorChannels } = useQuery({
    queryKey: ['/api/sponsor-channels'],
  });

  const openChannelLink = (channelId: string) => {
    // Find the sponsor channel to get the proper channelUrl
    const sponsorChannelsArray = Array.isArray(sponsorChannels) ? sponsorChannels : [];
    const sponsorChannel = sponsorChannelsArray.find((ch: any) => ch.channelId === channelId);
    
    if (sponsorChannel?.channelUrl) {
      // Use channelUrl from sponsor channel - this is the correct URL for navigation
      window.open(sponsorChannel.channelUrl, '_blank');
    } else {
      console.error(`Channel with ID ${channelId} not found in sponsor channels or has no valid channelUrl`);
    }
  };

  const isExpired = new Date(raffle.raffleDateTime) < new Date();
  const timeLeft = new Date(raffle.raffleDateTime).getTime() - new Date().getTime();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <Card className={`telegram-card hover:shadow-lg transition-all duration-300 ${hasJoined ? 'ring-2 ring-green-200' : ''}`}>
      <CardContent className="p-6">
        {/* Header with prize info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-reverse space-x-3">
            {getPrizeIcon(raffle.prizeType)}
            <div>
              <h3 className="font-bold text-lg text-telegram">قرعه‌کشی #{raffle.requestNumber}</h3>
              <Badge className={`text-xs ${getPrizeBadgeColor(raffle.prizeType)}`}>
                {getPrizeTypeLabel(raffle.prizeType)}
              </Badge>
            </div>
          </div>
          {hasJoined && (
            <CheckCircle className="text-green-500" size={24} />
          )}
        </div>

        {/* Prize information */}
        <div className="mb-4 p-3 bg-telegram-surface-variant rounded-lg">
          {raffle.prizeValue && (
            <p className="text-sm text-telegram-secondary mt-1">
              {raffle.prizeType === "stars" ? `${raffle.prizeValue} استارز` : 
               raffle.prizeType === "premium" ? `${raffle.prizeValue} ماه پریمیوم` : 
               raffle.prizeType === "mixed" ? `${Math.floor(raffle.prizeValue / 2)} استارز + ${Math.floor(raffle.prizeValue / 2)} ماه پریمیوم` :
               `${raffle.prizeValue} واحد`}
            </p>
          )}
        </div>



        {/* Time info */}
        <div className="flex items-center space-x-reverse space-x-2 mb-4 text-sm text-telegram-secondary">
          <Clock size={16} />
          <span>قرعه‌کشی: {formatDateTime(raffle.raffleDateTime)}</span>
          {!isExpired && timeLeft > 0 && (
            <Badge variant="outline" className="text-xs">
              {daysLeft > 0 ? `${daysLeft} روز` : `${hoursLeft} ساعت`} باقی‌مانده
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="text-xs">
              منقضی شده
            </Badge>
          )}
        </div>

        {/* Participant count */}
        <div className="flex items-center space-x-reverse space-x-2 mb-4 text-sm text-telegram-secondary">
          <Users size={16} />
          <span>{raffle.participantCount} نفر شرکت کرده‌اند</span>
        </div>

        {/* Required channels */}
        <div className="mb-4">
          <p className="text-sm font-medium text-telegram mb-2">کانال‌های مورد نیاز:</p>
          <div className="space-y-2">
            {raffle.requiredChannels.map((channelId, index) => (
              <button
                key={index}
                onClick={() => openChannelLink(channelId)}
                className="flex items-center justify-between w-full p-2 bg-telegram-blue/5 hover:bg-telegram-blue/10 rounded-lg transition-colors"
              >
                <span className="text-sm text-telegram">{channelId}</span>
                <ExternalLink size={14} className="text-telegram-secondary" />
              </button>
            ))}
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={handleJoinRaffle}
          disabled={hasJoined || isExpired || joinRaffleMutation.isPending || !currentUser}
          className={`w-full ${hasJoined ? 'bg-green-500 hover:bg-green-600' : 'bg-telegram-blue hover:bg-telegram-blue-dark'} text-white rounded-telegram`}
        >
          {joinRaffleMutation.isPending ? (
            "در حال پردازش..."
          ) : hasJoined ? (
            "شرکت کرده‌اید ✓"
          ) : isExpired ? (
            "قرعه‌کشی منقضی شده"
          ) : !currentUser ? (
            "ابتدا وارد شوید"
          ) : (
            "شرکت در قرعه‌کشی"
          )}
        </Button>

        {/* Level requirement */}
        {raffle.levelRequired > 1 && (
          <p className="text-xs text-telegram-secondary mt-2 text-center">
            سطح مورد نیاز: {raffle.levelRequired}
            {currentUser && currentUser.level < raffle.levelRequired && (
              <span className="text-red-500 block">سطح شما کافی نیست</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}