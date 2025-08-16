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
  TrendingUp,
  Trophy,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Send,
  AlertCircle,
  FileText
} from "lucide-react";

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

export default function UserMainPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [submissionFilter, setSubmissionFilter] = useState<string>("all");
  const [editingRaffle, setEditingRaffle] = useState<any>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const form = useForm<RaffleFormData>({
    resolver: zodResolver(raffleFormSchema),
    defaultValues: {
      title: "",
      prizeType: "stars",
      prizeValue: 0,
      requiredChannels: "",
      raffleDateTime: "",
      channelId: "",
      messageId: "",
    },
  });

  // Get raffles for participation
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

  // Get user's submitted raffles
  const { data: submittedRaffles = [], isLoading: submittedLoading } = useQuery({
    queryKey: ['/api/raffles/submitted', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/raffles/submitted/${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submitted raffles');
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

  // Mutations
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
      queryClient.invalidateQueries({ queryKey: ['/api/user/joined-raffles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
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

      if (!response.ok) {
        throw new Error('Failed to submit raffle');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "قرعه‌کشی با موفقیت ارسال شد و در انتظار تایید است",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles/submitted'] });
      form.reset();
      setIsSubmitDialogOpen(false);
      setEditingRaffle(null);
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در ارسال قرعه‌کشی",
        variant: "destructive",
      });
      console.error("Submit raffle error:", error);
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

  const handleSubmitRaffle = (data: RaffleFormData) => {
    submitRaffleMutation.mutate(data);
  };

  const handleEditRaffle = (raffle: any) => {
    setEditingRaffle(raffle);
    form.reset({
      title: raffle.title,
      prizeType: raffle.prizeType,
      prizeValue: raffle.prizeValue || 0,
      requiredChannels: raffle.requiredChannels?.join(', ') || "",
      raffleDateTime: new Date(raffle.raffleDateTime).toISOString().slice(0, 16),
      channelId: raffle.channelId,
      messageId: raffle.messageId,
    });
    setIsSubmitDialogOpen(true);
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

  const filteredRaffles = getFilteredRaffles();
  const filteredSubmissions = getFilteredSubmissions();

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-300">تایید شده</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300">رد شده</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">در انتظار بررسی</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          در قرعه‌کشی‌ها شرکت کنید یا قرعه‌کشی خود را ثبت کنید
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
            <div className="text-lg font-bold text-purple-600">{submittedRaffles?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">ثبت شده</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="participate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="participate">شرکت در قرعه‌کشی</TabsTrigger>
          <TabsTrigger value="submit">ثبت قرعه‌کشی جدید</TabsTrigger>
        </TabsList>

        {/* Participate Tab */}
        <TabsContent value="participate" className="space-y-4">
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
                                شرکت در قرعه‌کشی
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
        </TabsContent>

        {/* Submit Tab */}
        <TabsContent value="submit" className="space-y-4">
          {/* Submit New Raffle Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">قرعه‌کشی‌های ارسالی شما</h3>
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-telegram hover:bg-telegram/90">
                  <Plus className="w-4 h-4 mr-2" />
                  ثبت قرعه‌کشی جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingRaffle ? "ویرایش قرعه‌کشی" : "ثبت قرعه‌کشی جدید"}
                  </DialogTitle>
                  <DialogDescription>
                    اطلاعات قرعه‌کشی خود را وارد کنید
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmitRaffle)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان قرعه‌کشی</FormLabel>
                          <FormControl>
                            <Input placeholder="عنوان قرعه‌کشی را وارد کنید" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prizeDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>توضیحات جایزه</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="جایزه قرعه‌کشی را شرح دهید"
                              className="resize-none"
                              {...field}
                            />
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
                          <FormLabel>نوع جایزه</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="requiredChannels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>کانال‌های الزامی</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="@channel1, @channel2"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="raffleDateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاریخ و زمان قرعه‌کشی</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              {...field}
                            />
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
                          <FormLabel>شناسه کانال</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="@your_channel"
                              {...field}
                            />
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
                          <FormLabel>شناسه پیام</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123456"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={submitRaffleMutation.isPending}
                        className="bg-telegram hover:bg-telegram/90"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {editingRaffle ? "بروزرسانی" : "ارسال"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Submission Filter */}
          <Tabs value={submissionFilter} onValueChange={setSubmissionFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">در انتظار</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">تایید شده</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">رد شده</TabsTrigger>
            </TabsList>

            <TabsContent value={submissionFilter} className="space-y-4">
              {/* Submissions List */}
              {submittedLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <Card className="telegram-card">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-600 dark:text-gray-400">
                      {submissionFilter === "all" && "هنوز قرعه‌کشی‌ای ارسال نکرده‌اید"}
                      {submissionFilter === "pending" && "قرعه‌کشی در انتظار بررسی وجود ندارد"}
                      {submissionFilter === "approved" && "قرعه‌کشی تایید شده وجود ندارد"}
                      {submissionFilter === "rejected" && "قرعه‌کشی رد شده وجود ندارد"}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((raffle: any) => (
                    <Card key={raffle.id} className="telegram-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex-1">
                                {raffle.title}
                              </h3>
                              {getStatusBadge(raffle.status)}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {raffle.prizeDescription}
                            </p>
                            
                            {/* Raffle Info */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                {getPrizeIcon(raffle.prizeType)}
                                {getPrizeTypeText(raffle.prizeType)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(raffle.raffleDateTime).toLocaleDateString('fa-IR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {new Date(raffle.createdAt).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {raffle.status === "approved" && (
                              <div className="flex items-center gap-1 text-green-600 text-xs">
                                <CheckCircle className="w-3 h-3" />
                                سطح مورد نیاز: {raffle.levelRequired}
                              </div>
                            )}
                            {raffle.status === "rejected" && (
                              <div className="flex items-center gap-1 text-red-600 text-xs">
                                <XCircle className="w-3 h-3" />
                                رد شده
                              </div>
                            )}
                            {raffle.status === "pending" && (
                              <div className="flex items-center gap-1 text-yellow-600 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                در انتظار بررسی
                              </div>
                            )}
                          </div>
                          
                          {raffle.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRaffle(raffle)}
                              className="text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              ویرایش و ارسال مجدد
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}