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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RaffleSubmissionDialog } from "@/components/raffle-submission-dialog";
import { ReferralSystem } from "@/components/referral-system";
import { RaffleCard } from "@/components/raffle-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
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
  Award
} from "lucide-react";
import { format } from "date-fns";

// Form schema for raffle submission
const raffleFormSchema = z.object({
  title: z.string().min(3, "عنوان باید حداقل ۳ کاراکتر باشد"),
  prizeType: z.enum(["stars", "premium", "mixed"], {
    required_error: "نوع جایزه را انتخاب کنید"
  }),
  prizeValue: z.number().min(1, "مقدار جایزه باید مثبت باشد").optional(),
  requiredChannels: z.string().min(1, "حداقل یک کانال الزامی است"),
  raffleDateTime: z.string().min(1, "تاریخ و زمان الزامی است"),
  channelId: z.string().min(1, "شناسه کانال الزامی است"),
  messageId: z.string().min(1, "شناسه پیام الزامی است"),
});

type RaffleFormData = z.infer<typeof raffleFormSchema>;

export default function EnhancedUserMainPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [submissionFilter, setSubmissionFilter] = useState<string>("all");
  const [editingRaffle, setEditingRaffle] = useState<any>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);

  const form = useForm<RaffleFormData>({
    resolver: zodResolver(raffleFormSchema),
    defaultValues: {
      title: "",
      prizeType: "stars",
      prizeValue: undefined,
      requiredChannels: "",
      raffleDateTime: "",
      channelId: "",
      messageId: "",
    },
  });

  // Get user statistics
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/stats`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return await response.json();
    },
    enabled: !!user?.id,
  });

  // Generate unique referral link
  const referralLink = user?.referralCode 
    ? `https://t.me/YourBotName?start=${user.referralCode}`
    : "";

  // Queries
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

  const { data: submittedRaffles = [], isLoading: submittedLoading } = useQuery({
    queryKey: ['/api/raffles/submitted', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/raffles/submitted/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch submitted raffles');
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
  });



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
        ...data,
        requiredChannels: data.requiredChannels.split(',').map(ch => ch.trim()),
        submitterId: user?.id,
        raffleDateTime: new Date(data.raffleDateTime).toISOString(),
      };

      const response = await fetch('/api/raffles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) throw new Error('Failed to submit raffle');
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "قرعه‌کشی با موفقیت ارسال شد و در انتظار تایید است" });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles/submitted'] });
      form.reset();
      setIsSubmitDialogOpen(false);
      setEditingRaffle(null);
    },
    onError: () => {
      toast({ title: "خطا در ارسال قرعه‌کشی", variant: "destructive" });
    },
  });

  const joinSponsorChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/sponsor-channels/${channelId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      
      if (!response.ok) throw new Error("Failed to join sponsor channel");
      return await response.json();
    },
    onSuccess: (data) => {
      toast({ title: `${data.pointsEarned} امتیاز دریافت کردید!` });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
    },
    onError: () => {
      toast({ title: "خطا در عضویت در کانال", variant: "destructive" });
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
      case "favorites":
        return raffles.filter((raffle: any) => raffle.isFavorite);
      default:
        return raffles;
    }
  };

  const getFilteredSubmissions = () => {
    switch (submissionFilter) {
      case "pending":
        return submittedRaffles.filter((r: any) => r.status === "pending");
      case "approved":
        return submittedRaffles.filter((r: any) => r.status === "approved");
      case "rejected":
        return submittedRaffles.filter((r: any) => r.status === "rejected");
      default:
        return submittedRaffles;
    }
  };

  const getPrizeIcon = (prizeType: string) => {
    switch (prizeType) {
      case "stars":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "premium":
        return <Crown className="w-4 h-4 text-orange-500" />;
      default:
        return <Gift className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="status-badge-pending">در انتظار بررسی</Badge>;
      case "approved":
        return <Badge className="status-badge-approved">تایید شده</Badge>;
      case "rejected":
        return <Badge className="status-badge-rejected">رد شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const handleEditRaffle = (raffle: any) => {
    setEditingRaffle(raffle);
    form.reset({
      title: raffle.title,
      prizeType: raffle.prizeType,
      prizeValue: raffle.prizeValue ?? undefined,
      requiredChannels: raffle.requiredChannels?.join(', ') || "",
      raffleDateTime: new Date(raffle.raffleDateTime).toISOString().slice(0, 16),
      channelId: raffle.channelId,
      messageId: raffle.messageId,
    });
    setIsSubmitDialogOpen(true);
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
  const filteredSubmissions = getFilteredSubmissions();

  return (
    <div className="app-container bg-telegram-bg">
      <div className="main-content p-4 pb-20">
        {/* Enhanced Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="relative">
            <h1 className="text-3xl font-bold text-telegram mb-2 animate-fade-in">
              دنیای قرعه‌کشی
            </h1>
            <div className="absolute -top-2 -right-2">
              <Trophy className="text-telegram-blue animate-pulse" size={24} />
            </div>
          </div>
          <p className="text-telegram-text-secondary">
            در قرعه‌کشی‌ها شرکت کنید، امتیاز کسب کنید و سطح خود را ارتقا دهید
          </p>
        </div>

        {/* Enhanced User Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-telegram animate-slide-up">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="text-telegram-blue" size={20} />
              </div>
              <div className="text-2xl font-bold text-telegram-blue">{user?.level}</div>
              <div className="text-xs text-telegram-text-secondary">سطح فعلی</div>
              <div className="w-full bg-telegram-surface-variant rounded-full h-1 mt-2">
                <div 
                  className="bg-telegram-blue h-1 rounded-full transition-all duration-500"
                  style={{ width: `${(userStats?.levelProgress || 0)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-telegram animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="text-telegram-warning" size={20} />
              </div>
              <div className="text-2xl font-bold text-telegram-warning">{user?.points}</div>
              <div className="text-xs text-telegram-text-secondary">امتیاز کل</div>
              <div className="text-xs text-telegram-text-secondary mt-1">
                {(userStats?.nextLevelPoints || 0) - (user?.points || 0)} تا سطح بعد
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-telegram animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="text-telegram-success" size={20} />
              </div>
              <div className="text-2xl font-bold text-telegram-success">{joinedRaffles?.length || 0}</div>
              <div className="text-xs text-telegram-text-secondary">شرکت کرده</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-telegram animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Share2 className="text-telegram-blue" size={20} />
              </div>
              <div className="text-2xl font-bold text-telegram-blue">{userStats?.referralCount || 0}</div>
              <div className="text-xs text-telegram-text-secondary">دعوت شده</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Section */}
        <Card className="shadow-telegram-lg mb-6 bg-gradient-to-r from-telegram-blue/10 to-telegram-surface border border-telegram-blue/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-telegram mb-2 flex items-center gap-2">
                  <Share2 size={20} />
                  دعوت از دوستان
                </h3>
                <p className="text-sm text-telegram-text-secondary mb-4">
                  با دعوت از دوستان {user?.referralReward || 50} امتیاز دریافت کنید
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={shareReferralLink}
                    className="bg-telegram-blue hover:bg-telegram-blue-dark"
                  >
                    <Share2 size={14} className="ml-1" />
                    اشتراک‌گذاری
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={copyReferralLink}
                  >
                    <Link2 size={14} className="ml-1" />
                    کپی لینک
                  </Button>
                </div>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </CardContent>
        </Card>

        {/* Sponsor Channels */}
        {(sponsorChannels as any[]).length > 0 && (
          <Card className="shadow-telegram-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                کانال‌های اسپانسری - امتیاز رایگان!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {(sponsorChannels as any[]).filter((channel: any) => channel.isActive).map((channel: any) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 border border-telegram rounded-telegram hover:bg-telegram-surface-variant transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-telegram">{channel.channelName}</h4>
                      <p className="text-sm text-telegram-text-secondary">{channel.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star size={14} className="text-telegram-warning" />
                        <span className="text-sm font-medium text-telegram-warning">
                          {channel.pointsReward} امتیاز
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => joinSponsorChannelMutation.mutate(channel.id)}
                      disabled={joinSponsorChannelMutation.isPending}
                    >
                      عضویت
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="participate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="participate" className="flex items-center gap-2">
              <Trophy size={16} />
              شرکت در قرعه‌کشی
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Plus size={16} />
              ثبت قرعه‌کشی جدید
            </TabsTrigger>
          </TabsList>

          {/* Participate Tab */}
          <TabsContent value="participate" className="space-y-6">
            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-4">
                <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
                <TabsTrigger value="today" className="text-xs">امروز</TabsTrigger>
                <TabsTrigger value="seen" className="text-xs">مشاهده شده</TabsTrigger>
                <TabsTrigger value="joined" className="text-xs">شرکت کرده</TabsTrigger>
                <TabsTrigger value="ended" className="text-xs">پایان یافته</TabsTrigger>
                <TabsTrigger value="favorites" className="text-xs">مورد علاقه</TabsTrigger>
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
                      {activeFilter === "ended" && "قرعه‌کشی‌های پایان یافته"}
                      {activeFilter === "favorites" && "قرعه‌کشی‌های مورد علاقه شما"}
                      <Badge variant="outline" className="ml-auto">
                        {filteredRaffles.length} مورد
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Raffles Grid */}
                <div className="grid gap-4">
                  {filteredRaffles.map((raffle: any, index: number) => (
                    <Card 
                      key={raffle.id} 
                      className="shadow-telegram-lg hover:shadow-telegram-xl transition-all duration-300 animate-fade-in border border-telegram"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-telegram mb-2">{raffle.title}</h3>
                            {raffle.description && (
                              <p className="text-telegram-text-secondary text-sm mb-3">{raffle.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-telegram-text-secondary mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {format(new Date(raffle.raffleDateTime), "yyyy/MM/dd")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {format(new Date(raffle.raffleDateTime), "HH:mm")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                {raffle.participantCount} نفر
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-4">
                              {getPrizeIcon(raffle.prizeType)}
                              <span className="font-medium text-telegram">{raffle.prizeDescription}</span>
                            </div>
                          </div>
                          
                          <Badge className={`ml-2 ${raffle.levelRequired <= (user?.level || 1) ? 'bg-telegram-success' : 'bg-telegram-warning'}`}>
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
                                className="bg-telegram-success hover:bg-telegram-success/90"
                              >
                                <Gift size={14} className="ml-1" />
                                شرکت در قرعه‌کشی
                              </Button>
                            )}
                            
                            {joinedRaffles?.includes?.(raffle.id) && (
                              <Badge className="status-badge-approved">شرکت کرده‌اید</Badge>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkSeen(raffle.id)}
                            >
                              <Eye size={14} className="ml-1" />
                              {seenRaffles?.includes?.(raffle.id) ? "مشاهده شده" : "مشاهده"}
                            </Button>
                          </div>
                          
                          <Button size="sm" variant="ghost">
                            <Heart size={14} />
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

          {/* Submit Tab */}
          <TabsContent value="submit" className="space-y-6">
            {/* Quick Submit Button */}
            <Card className="shadow-telegram-lg bg-gradient-to-r from-telegram-blue/5 to-telegram-surface">
              <CardContent className="p-6 text-center">
                <FileText className="mx-auto mb-4 text-telegram-blue" size={48} />
                <h3 className="font-bold text-lg text-telegram mb-2">ثبت قرعه‌کشی جدید</h3>
                <p className="text-telegram-text-secondary mb-4">
                  قرعه‌کشی خود را ثبت کنید تا پس از تایید مدیران در اختیار کاربران قرار گیرد
                </p>
                <Button 
                  onClick={() => setIsSubmitDialogOpen(true)}
                  className="bg-telegram-blue hover:bg-telegram-blue-dark"
                >
                  <Plus size={16} className="ml-2" />
                  شروع ثبت قرعه‌کشی
                </Button>
              </CardContent>
            </Card>

            {/* Submitted Raffles */}
            <Card className="shadow-telegram-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={20} />
                    قرعه‌کشی‌های ارسالی شما
                  </div>
                  <Select value={submissionFilter} onValueChange={setSubmissionFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="فیلتر وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="approved">تایید شده</SelectItem>
                      <SelectItem value="rejected">رد شده</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="table-modern">
                    <TableHeader>
                      <TableRow>
                        <TableHead>عنوان</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>تاریخ ارسال</TableHead>
                        <TableHead>تاریخ قرعه‌کشی</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((submission: any) => (
                        <TableRow key={submission.id} className="animate-fade-in">
                          <TableCell className="font-medium">{submission.title}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell>{format(new Date(submission.createdAt), "yyyy/MM/dd HH:mm")}</TableCell>
                          <TableCell>{format(new Date(submission.raffleDateTime), "yyyy/MM/dd HH:mm")}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {submission.status === "rejected" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleEditRaffle(submission)}
                                  variant="outline"
                                >
                                  <Edit size={14} className="ml-1" />
                                  ویرایش
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <Eye size={14} className="ml-1" />
                                مشاهده
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {filteredSubmissions.length === 0 && !submittedLoading && (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto mb-4 text-telegram-text-secondary" size={48} />
                    <h3 className="font-medium text-telegram mb-2">هیچ ارسالی یافت نشد</h3>
                    <p className="text-telegram-text-secondary">قرعه‌کشی خود را ثبت کنید</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submit Raffle Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          <DialogHeader>
            <DialogTitle>
              {editingRaffle ? "ویرایش قرعه‌کشی" : "ثبت قرعه‌کشی جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات قرعه‌کشی خود را با دقت وارد کنید
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitRaffle)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان قرعه‌کشی *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="عنوان جذاب برای قرعه‌کشی" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prizeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع جایزه *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="نوع جایزه را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="stars">استارز تلگرام</SelectItem>
                          <SelectItem value="premium">پریمیوم تلگرام</SelectItem>
                          <SelectItem value="mixed">ترکیبی</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات (اختیاری)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="توضیحات اضافی درباره قرعه‌کشی" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prizeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات جایزه *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: 100 استار تلگرام" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prizeValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مقدار جایزه</FormLabel>
                      <FormControl>
                        <Input
                          name={field.name}
                          ref={field.ref}
                          type="text"
                          value={field.value ?? ''}
                          inputMode="numeric"
                          pattern="[0-9۰-۹٠-٩]*"
                          placeholder="عدد (اختیاری)"
                          onChange={(e) => {
                            const raw = e.target.value;
                            const normalized = raw
                              .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0))
                              .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
                              .replace(/[^0-9]/g, '');
                            field.onChange(normalized === '' ? undefined : Number(normalized));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="requiredChannels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کانال‌های مورد نیاز *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@channel1, @channel2 (با کاما جدا کنید)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="raffleDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ و زمان قرعه‌کشی *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="channelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شناسه کانال *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="@yourchannel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="messageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شناسه پیام *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123456" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSubmitDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitRaffleMutation.isPending}
                  className="bg-telegram-blue hover:bg-telegram-blue-dark"
                >
                  {submitRaffleMutation.isPending ? "در حال ارسال..." : (editingRaffle ? "بروزرسانی" : "ارسال")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}