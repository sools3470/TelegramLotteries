import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { 
  User as UserIcon,
  Star, 
  Crown, 
  Calendar, 
  Clock, 
  Users, 
  Eye, 
  Heart,
  Filter,
  Gift,
  Trophy,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Send,
  AlertCircle,
  FileText,
  Share2,
  Link2,
  TrendingUp,
  Award,
  Copy,
  ExternalLink,
  Target,
  RefreshCw,
  Calendar as CalendarIcon,
  MapPin,
  MessageCircle,
  Settings
} from "lucide-react";

import { format } from "date-fns";

// Form schema for raffle submission
const raffleFormSchema = z.object({
  messageUrl: z.string()
    .min(1, "لینک پیام قرعه‌کشی الزامی است")
    .refine((url) => url.startsWith('https://t.me/'), {
      message: "لینک باید با https://t.me/ شروع شود"
    }),
});

type RaffleFormData = z.infer<typeof raffleFormSchema>;

export default function UserTabsMainPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("participate"); // Default to participate tab
  const [submissionFilter, setSubmissionFilter] = useState<string>("all"); // For submitted raffles status filter
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const form = useForm<RaffleFormData>({
    resolver: zodResolver(raffleFormSchema),
    defaultValues: {
      messageUrl: "",
    },
  });

  // User statistics and data queries
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/stats`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const { data: raffles = [], isLoading: rafflesLoading } = useQuery({
    queryKey: ['/api/raffles', user?.id, activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      if (activeFilter && activeFilter !== 'all') params.append('filter', activeFilter);
      
      const response = await fetch(`/api/raffles?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch raffles');
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const { data: seenRaffles = [] } = useQuery({
    queryKey: ['/api/user/seen-raffles', user?.id],
    enabled: !!user?.id,
  }) as { data: string[] };

  const { data: joinedRaffles = [] } = useQuery({
    queryKey: ['/api/user/joined-raffles', user?.id],
    enabled: !!user?.id,
  }) as { data: string[] };

  const { data: sponsorChannels = [] } = useQuery({
    queryKey: ['/api/sponsor-channels'],
    enabled: !!user?.id,
  }) as { data: any[] };

  const { data: submittedRaffles = [] } = useQuery({
    queryKey: ['/api/raffles/submitted', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/raffles/submitted/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch submitted raffles');
      return await response.json();
    },
    enabled: !!user?.id && activeTab === 'submit',
  });

  // Generate unique referral link
  const referralLink = user?.referralCode 
    ? `https://t.me/YourBotName?start=${user.referralCode}`
    : "";

  // Mutations
  const joinRaffleMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await fetch(`/api/raffles/${raffleId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      
      if (!response.ok) throw new Error("Failed to join raffle");
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "با موفقیت در قرعه‌کشی شرکت کردید" });
      queryClient.invalidateQueries({ queryKey: ['/api/user/joined-raffles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
    },
    onError: () => {
      toast({ title: "خطا در شرکت در قرعه‌کشی", variant: "destructive" });
    },
  });

  const markSeenMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await fetch(`/api/raffles/${raffleId}/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      
      if (!response.ok) throw new Error("Failed to mark as seen");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/seen-raffles'] });
    },
  });

  const submitRaffleMutation = useMutation({
    mutationFn: async (data: RaffleFormData) => {
      const requestData = {
        messageUrl: data.messageUrl,
        submitterId: user?.id,
        originalData: data,
      };

      const response = await fetch('/api/raffles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Raffle submission error:', errorData);
        
        // Check if it's a duplicate error with status information
        if (errorData.message && errorData.message.includes('وضعیت:')) {
          const statusMatch = errorData.message.match(/وضعیت:\s*(.+)$/);
          if (statusMatch) {
            const status = statusMatch[1].trim();
            const isApproved = status === 'منتشر شده';
            const isPending = status === 'در انتظار بررسی';
            
            // Create colored status display
            const statusColor = isApproved ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-gray-600';
            const statusDisplay = `<span class="${statusColor} font-semibold">${status}</span>`;
            
            // Replace status in message with colored version
            const coloredMessage = errorData.message.replace(/وضعیت:\s*.+$/, `وضعیت: ${statusDisplay}`);
            
            throw new Error(coloredMessage);
          }
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "قرعه‌کشی با موفقیت ارسال شد و در انتظار تایید است" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/raffles/submitted'] });
    },
    onError: (error: any) => {
      console.error('Raffle submission error:', error);
      
      // Check if error message contains HTML (colored status)
      if (error.message && error.message.includes('<span')) {
        // For HTML content, we need to use a custom toast or alert
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = error.message;
        const statusElement = tempDiv.querySelector('span');
        const statusText = statusElement?.textContent || '';
        const statusColor = statusElement?.className || '';
        
        // Create a custom error message with status
        const baseMessage = error.message.replace(/<span[^>]*>.*?<\/span>/, '').trim();
        
        toast({ 
          title: baseMessage,
          description: statusText,
          variant: "destructive",
          duration: 5000
        });
      } else {
        toast({ 
          title: "خطا در ارسال قرعه‌کشی", 
          description: error.message || "خطای نامشخص رخ داده است",
          variant: "destructive" 
        });
      }
    },
  });



  // Helper functions
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
      default:
        return raffles;
    }
  };

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

  const handleJoinRaffle = (raffleId: string) => {
    joinRaffleMutation.mutate(raffleId);
  };

  const handleMarkSeen = (raffleId: string) => {
    if (!seenRaffles?.includes?.(raffleId)) {
      markSeenMutation.mutate(raffleId);
    }
  };

  const handleSubmitRaffle = (data: RaffleFormData) => {
    submitRaffleMutation.mutate(data);
  };

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast({ title: "لینک رفرال کپی شد" });
    }
  };

  const shareReferralLink = () => {
    if (referralLink && navigator.share) {
      navigator.share({
        title: 'دعوت به دنیای قرعه‌کشی',
        text: 'با استفاده از این لینک به ما بپیوندید!',
        url: referralLink
      });
    } else {
      copyReferralLink();
    }
  };

  const filteredRaffles = getFilteredRaffles();
  const levelProgress = ((user?.points || 0) / (userStats?.nextLevelPoints || 1)) * 100;

  return (
    <div className="p-4 h-full overflow-y-auto tab-content-enter">
        {/* Header */}
        <div className="text-center space-y-4 mb-6">
          <h1 className="text-2xl font-bold text-telegram mb-2 animate-fade-in">
            دنیای قرعه‌کشی
          </h1>
          <p className="text-telegram-text-secondary text-sm">
            در قرعه‌کشی‌ها شرکت کنید، امتیاز کسب کنید و سطح خود را ارتقا دهید
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="tabs-list-responsive mb-6">
            <TabsTrigger value="participate" className="tabs-trigger-responsive">
              <Trophy size={16} />
              <span>شرکت</span>
            </TabsTrigger>
            <TabsTrigger value="submit" className="tabs-trigger-responsive">
              <Plus size={16} />
              <span>ثبت قرعه کشی</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="tabs-trigger-responsive">
              <Star size={16} />
              <span>امتیازات</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="tabs-trigger-responsive">
              <UserIcon size={16} />
              <span>پروفایل</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: User Profile */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-telegram-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-telegram-blue text-white">
                      {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.username || 'کاربر'}
                    </h3>
                    <p className="text-telegram-text-secondary text-sm">
                      سطح {user?.level} • {user?.points} امتیاز
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="responsive-grid">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">نام کامل</Label>
                    <div className="p-3 bg-telegram-surface-variant rounded-lg">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : 'تعریف نشده'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">شناسه تلگرام</Label>
                    <div className="p-3 bg-telegram-surface-variant rounded-lg">
                      {user?.telegramId || 'تعریف نشده'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">سطح کاربر</Label>
                    <div className="p-3 bg-telegram-surface-variant rounded-lg flex items-center gap-2">
                      <Award className="w-4 h-4 text-telegram-blue" />
                      سطح {user?.level}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">تاریخ عضویت</Label>
                    <div className="p-3 bg-telegram-surface-variant rounded-lg flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-telegram-text-secondary" />
                      {user?.createdAt 
                        ? format(new Date(user.createdAt), "yyyy/MM/dd")
                        : 'نامشخص'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Points and Level System */}
          <TabsContent value="points" className="space-y-6 tab-content-enter">
            {/* Level Progress */}
            <Card className="shadow-telegram-lg bg-gradient-to-r from-telegram-blue/10 to-telegram-surface border border-telegram-blue/20">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-telegram-blue/20 mb-4">
                    <Award className="w-10 h-10 text-telegram-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-telegram-blue">سطح {user?.level}</h3>
                  <p className="text-telegram-text-secondary">{user?.points} از {userStats?.nextLevelPoints || 0} امتیاز</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>پیشرفت تا سطح بعد</span>
                    <span>{Math.round(levelProgress)}%</span>
                  </div>
                  <Progress value={levelProgress} className="h-3" />
                  <p className="text-xs text-telegram-text-secondary text-center">
                    {(userStats?.nextLevelPoints || 0) - (user?.points || 0)} امتیاز تا سطح بعد
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="responsive-grid">
              <Card className="shadow-telegram card-hover-transition">
                <CardContent className="p-4 text-center">
                  <Star className="mx-auto mb-2 text-telegram-warning" size={24} />
                  <div className="text-xl font-bold text-telegram-warning">{user?.points}</div>
                  <div className="text-xs text-telegram-text-secondary">امتیاز کل</div>
                </CardContent>
              </Card>
              
              <Card className="shadow-telegram card-hover-transition">
                <CardContent className="p-4 text-center">
                  <Users className="mx-auto mb-2 text-telegram-success" size={24} />
                  <div className="text-xl font-bold text-telegram-success">{joinedRaffles?.length || 0}</div>
                  <div className="text-xs text-telegram-text-secondary">شرکت در قرعه‌کشی</div>
                </CardContent>
              </Card>
              
              <Card className="shadow-telegram card-hover-transition">
                <CardContent className="p-4 text-center">
                  <Share2 className="mx-auto mb-2 text-telegram-blue" size={24} />
                  <div className="text-xl font-bold text-telegram-blue">{userStats?.referralCount || 0}</div>
                  <div className="text-xs text-telegram-text-secondary">دعوت شده</div>
                </CardContent>
              </Card>
            </div>

            {/* Referral System */}
            <Card className="shadow-telegram-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 size={20} />
                  سیستم دعوت از دوستان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-telegram-surface-variant rounded-lg">
                  <p className="text-sm text-telegram-text-secondary mb-2">لینک دعوت شما:</p>
                  <div className="flex gap-2">
                    <Input 
                      value={referralLink || ""} 
                      readOnly 
                      className="text-xs"
                    />
                    <Button size="sm" onClick={copyReferralLink} className="btn-press">
                      <Copy size={14} />
                    </Button>
                    <Button size="sm" onClick={shareReferralLink} className="btn-press">
                      <Share2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-telegram-text-secondary">
                  • با دعوت هر دوست {user?.referralReward || 50} امتیاز دریافت کنید<br/>
                  • تعداد افراد دعوت شده: {userStats?.referralCount || 0} نفر<br/>
                  • امتیاز کسب شده از دعوت: {(userStats?.referralCount || 0) * (user?.referralReward || 50)} امتیاز
                </div>
              </CardContent>
            </Card>

            {/* Sponsor Channels */}
            {sponsorChannels.length > 0 && (
              <Card className="shadow-telegram-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink size={20} />
                    کانال‌های اسپانسری
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sponsorChannels.map((channel: any) => (
                      <div key={channel.id} className="flex items-center justify-between p-3 border border-telegram rounded-lg">
                        <div>
                          <h4 className="font-medium">{channel.channelName}</h4>
                          <p className="text-xs text-telegram-text-secondary">{channel.description}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-telegram-warning" />
                            <span className="text-xs font-medium text-telegram-warning">
                              {channel.pointsReward} امتیاز
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (channel.channelUrl) {
                              window.open(channel.channelUrl, '_blank');
                            }
                          }}
                          className="btn-press"
                        >
                          <ExternalLink className="w-3 h-3 ml-1" />
                          عضویت
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>



          {/* Tab 3: Participate in Raffles */}
          <TabsContent value="participate" className="space-y-6 tab-content-enter">
            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
              <TabsList className="filter-tabs-responsive mb-4">
                <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
                <TabsTrigger value="today" className="text-xs">امروز</TabsTrigger>
                <TabsTrigger value="seen" className="text-xs">دیده شده</TabsTrigger>
                <TabsTrigger value="joined" className="text-xs">شرکت کرده</TabsTrigger>
              </TabsList>

              <TabsContent value={activeFilter} className="space-y-4">
                {/* Filter Description */}
                <Card className="shadow-telegram">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-telegram-text-secondary">
                      <Filter className="w-4 h-4" />
                      {activeFilter === "all" && "تمام قرعه‌کشی‌های مناسب سطح شما"}
                      {activeFilter === "today" && "قرعه‌کشی‌های امروز"}
                      {activeFilter === "seen" && "قرعه‌کشی‌هایی که مشاهده کرده‌اید"}
                      {activeFilter === "joined" && "قرعه‌کشی‌هایی که در آن شرکت کرده‌اید"}
                      <Badge variant="outline" className="ml-auto">
                        {filteredRaffles.length} مورد
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Raffles Grid */}
                <div className="space-y-4">
                  {filteredRaffles.map((raffle: any, index: number) => (
                    <Card 
                      key={raffle.id} 
                      className="shadow-telegram-lg hover:shadow-telegram-xl transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-telegram mb-1">{raffle.title}</h3>
                            
                            <div className="flex items-center gap-3 text-xs text-telegram-text-secondary mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                {format(new Date(raffle.raffleDateTime), "MM/dd")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                {format(new Date(raffle.raffleDateTime), "HH:mm")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users size={12} />
                                {raffle.participantCount}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              {getPrizeIcon(raffle.prizeType)}
                              <span className="font-medium text-telegram text-sm">
                                {raffle.prizeType === "stars" ? `${raffle.prizeValue} ستاره` : 
                                 raffle.prizeType === "premium" ? `${raffle.prizeValue} ماه پریمیوم` : 
                                 raffle.prizeType === "mixed" ? `${Math.floor(raffle.prizeValue / 2)} ستاره + ${Math.floor(raffle.prizeValue / 2)} ماه پریمیوم` :
                                 `${raffle.prizeValue} واحد`}
                              </span>
                            </div>
                          </div>
                          
                          <Badge className={`${raffle.levelRequired <= (user?.level || 1) ? 'bg-telegram-success' : 'bg-telegram-warning'}`}>
                            سطح {raffle.levelRequired}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {!joinedRaffles?.includes?.(raffle.id) && 
                             new Date(raffle.raffleDateTime) > new Date() && 
                             raffle.levelRequired <= (user?.level || 1) && (
                              <Button 
                                size="sm"
                                onClick={() => handleJoinRaffle(raffle.id)}
                                disabled={joinRaffleMutation.isPending}
                                className="bg-telegram-success hover:bg-telegram-success/90 btn-press"
                              >
                                <Gift size={12} className="ml-1" />
                                شرکت
                              </Button>
                            )}
                            
                            {joinedRaffles?.includes?.(raffle.id) && (
                              <Badge className="status-badge-approved text-xs">شرکت کرده</Badge>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkSeen(raffle.id)}
                              className="btn-press"
                            >
                              <Eye size={12} className="ml-1" />
                              {seenRaffles?.includes?.(raffle.id) ? "مشاهده شده" : "مشاهده"}
                            </Button>
                          </div>
                          
                          <Button size="sm" variant="ghost" className="btn-press">
                            <Heart size={12} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredRaffles.length === 0 && !rafflesLoading && (
                  <Card className="shadow-telegram">
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="mx-auto mb-4 text-telegram-text-secondary" size={48} />
                      <h3 className="font-medium text-telegram mb-2">قرعه‌کشی موجود نیست</h3>
                      <p className="text-telegram-text-secondary">در این دسته‌بندی قرعه‌کشی یافت نشد</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Tab 4: Submit New Raffle */}
          <TabsContent value="submit" className="space-y-6 tab-content-enter">
            {/* Submission Filter Tabs */}
            <Tabs value={submissionFilter} onValueChange={setSubmissionFilter} className="w-full">
              <TabsList className="filter-tabs-responsive mb-4">
                <TabsTrigger value="all" className="text-xs">ثبت جدید</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">در انتظار</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs">تایید شده</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">رد شده</TabsTrigger>
              </TabsList>

              {/* Show form only when "all" filter is selected */}
              {submissionFilter === "all" && (
                <Card className="shadow-telegram-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText size={20} />
                      ثبت قرعه‌کشی جدید
                    </CardTitle>
                  </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmitRaffle)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="messageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>لینک پیام قرعه‌کشی (از کانال برگزارکننده)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://t.me/channel/12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full btn-press"
                      disabled={submitRaffleMutation.isPending}
                    >
                      {submitRaffleMutation.isPending && <RefreshCw className="w-4 h-4 ml-2 animate-spin" />}
                      ارسال قرعه‌کشی
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
              )}

              {/* Show submitted raffles list for other filters */}
              {submissionFilter !== "all" && (
                <div className="space-y-4">
                  <Card className="shadow-telegram">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm text-telegram-text-secondary">
                        <Filter className="w-4 h-4" />
                        {submissionFilter === "pending" && "قرعه‌کشی‌های در انتظار تایید"}
                        {submissionFilter === "approved" && "قرعه‌کشی‌های تایید شده"}
                        {submissionFilter === "rejected" && "قرعه‌کشی‌های رد شده"}
                        <Badge variant="outline" className="ml-auto">
                          {(() => {
                            const list = submittedRaffles as any[];
                            const count = submissionFilter === 'pending'
                              ? list.filter(r => r.status === 'pending').length
                              : submissionFilter === 'approved'
                                ? list.filter(r => r.status === 'approved').length
                                : submissionFilter === 'rejected'
                                  ? list.filter(r => r.status === 'rejected').length
                                  : list.length;
                            return count;
                          })()} مورد
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submitted Raffles List */}
                  <div className="space-y-4">
                    {(submittedRaffles as any[])
                      .filter((raffle: any) => {
                        if (submissionFilter === 'pending') return raffle.status === 'pending';
                        if (submissionFilter === 'approved') return raffle.status === 'approved';
                        if (submissionFilter === 'rejected') return raffle.status === 'rejected';
                        return true;
                      })
                      .map((raffle: any, index: number) => (
                      <Card 
                        key={raffle.id} 
                        className="shadow-telegram-lg hover:shadow-telegram-xl transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-telegram mb-1">{raffle.title}</h3>
                              
                              <div className="flex items-center gap-3 text-xs text-telegram-text-secondary mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {format(new Date(raffle.createdAt || Date.now()), "MM/dd")}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {format(new Date(raffle.raffleDateTime), "HH:mm")}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-3">
                                {getPrizeIcon(raffle.prizeType)}
                                <span className="font-medium text-telegram text-sm">
                                  {raffle.prizeType === "stars" ? `${raffle.prizeValue} ستاره` : 
                                   raffle.prizeType === "premium" ? `${raffle.prizeValue} ماه پریمیوم` : 
                                   raffle.prizeType === "mixed" ? `${Math.floor(raffle.prizeValue / 2)} ستاره + ${Math.floor(raffle.prizeValue / 2)} ماه پریمیوم` :
                                   `${raffle.prizeValue} واحد`}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                className={`${
                                  raffle.status === 'approved' ? 'status-badge-approved' :
                                  raffle.status === 'rejected' ? 'status-badge-rejected' :
                                  'status-badge-pending'
                                }`}
                              >
                                {raffle.status === 'approved' ? 'تایید شده' :
                                 raffle.status === 'rejected' ? 'رد شده' :
                                 'در انتظار'}
                              </Badge>
                              {raffle.levelRequired && (
                                <Badge variant="outline">
                                  سطح {raffle.levelRequired}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {raffle.status === 'rejected' && raffle.rejectionReason && (
                                <Button size="sm" variant="destructive">
                                  <AlertCircle size={12} className="ml-1" />
                                  دلیل رد
                                </Button>
                              )}
                              {raffle.status === 'approved' && (
                                <Button size="sm" variant="outline">
                                  <ExternalLink size={12} className="ml-1" />
                                  مشاهده
                                </Button>
                              )}
                            </div>
                            
                            <div className="text-xs text-telegram-text-secondary">
                              {raffle.status === 'pending' && 'منتظر بررسی ادمین'}
                              {raffle.status === 'approved' && `${raffle.participantCount || 0} شرکت‌کننده`}
                            </div>
                          </div>
                          
                          {raffle.rejectionReason && raffle.status === 'rejected' && (
                            <div className="mt-3 p-3 bg-telegram-error/10 border border-telegram-error/20 rounded-lg">
                              <p className="text-sm text-telegram-error">
                                <strong>دلیل رد:</strong> {raffle.rejectionReason}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {submittedRaffles.length === 0 && (
                    <Card className="shadow-telegram">
                      <CardContent className="p-8 text-center">
                        <AlertCircle className="mx-auto mb-4 text-telegram-text-secondary" size={48} />
                        <h3 className="font-medium text-telegram mb-2">قرعه‌کشی موجود نیست</h3>
                        <p className="text-telegram-text-secondary">
                          {submissionFilter === "pending" && "هیچ قرعه‌کشی در انتظار تایید ندارید"}
                          {submissionFilter === "approved" && "هیچ قرعه‌کشی تایید شده ندارید"}
                          {submissionFilter === "rejected" && "هیچ قرعه‌کشی رد شده ندارید"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </Tabs>
          </TabsContent>
        </Tabs>
        
        {/* Enhanced Floating Support Button - only for non-admin users */}
        {user?.userType !== "bot_admin" && (
          <div 
            className="fixed bottom-20 left-4 z-50 animate-slideUp"
            style={{ opacity: 1, transform: "translateY(0)" }}
          >
            <button
              onClick={() => window.open("https://t.me/support_channel", "_blank")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              title="پشتیبانی"
              aria-label="دکمه پشتیبانی"
            >
              <MessageCircle size={20} className="text-white" />
              <span className="text-sm font-medium whitespace-nowrap text-white">پشتیبانی</span>
            </button>
          </div>
        )}
    </div>
  );
}