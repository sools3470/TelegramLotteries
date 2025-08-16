import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Users, Star, Crown, Settings, TrendingUp, CheckCircle, XCircle, Clock, Calendar, Gift, AlertCircle, Eye, UserCheck } from "lucide-react";

export default function BotAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Get pending raffles for review
  const { data: pendingRaffles = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['/api/raffles', 'pending', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('status', 'pending');
      if (user?.id) params.append('userId', user.id);
      
      const response = await fetch(`/api/raffles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending raffles');
      }
      return await response.json();
    },
    enabled: !!user?.id,
  });

  // Get all raffles stats
  const { data: allRaffles = [], isLoading: allRafflesLoading } = useQuery({
    queryKey: ['/api/raffles', 'all', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      
      const response = await fetch(`/api/raffles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch all raffles');
      }
      return await response.json();
    },
    enabled: !!user?.id,
  });

  // Get users stats
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user?.id,
  });

  const approveRaffleMutation = useMutation({
    mutationFn: async ({ raffleId, levelRequired }: { raffleId: string; levelRequired: number }) => {
      const response = await fetch(`/api/raffles/${raffleId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          levelRequired,
          adminUserId: user?.id 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to approve raffle");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "قرعه‌کشی با موفقیت تایید شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      setIsApprovalDialogOpen(false);
      setSelectedRaffle(null);
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در تایید قرعه‌کشی",
        variant: "destructive",
      });
      console.error("Approve raffle error:", error);
    },
  });

  const rejectRaffleMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await fetch(`/api/raffles/${raffleId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          adminUserId: user?.id 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reject raffle");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "قرعه‌کشی رد شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      setIsRejectDialogOpen(false);
      setSelectedRaffle(null);
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در رد قرعه‌کشی",
        variant: "destructive",
      });
      console.error("Reject raffle error:", error);
    },
  });

  const handleApprove = () => {
    if (selectedRaffle && selectedLevel) {
      approveRaffleMutation.mutate({
        raffleId: selectedRaffle.id,
        levelRequired: selectedLevel
      });
    }
  };

  const handleReject = () => {
    if (selectedRaffle) {
      rejectRaffleMutation.mutate(selectedRaffle.id);
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

  const approvedRaffles = allRaffles.filter((r: any) => r.status === "approved");
  const rejectedRaffles = allRaffles.filter((r: any) => r.status === "rejected");
  const regularUsers = (users as any[])?.filter?.((u: any) => u.userType === "regular") || [];
  const channelAdmins = (users as any[])?.filter?.((u: any) => u.userType === "channel_admin") || [];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          پنل مدیریت ربات
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          مدیریت قرعه‌کشی‌ها و کاربران سیستم
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingRaffles.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              در انتظار بررسی
            </div>
          </CardContent>
        </Card>
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{approvedRaffles.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              تایید شده
            </div>
          </CardContent>
        </Card>
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{regularUsers.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              کاربران عادی
            </div>
          </CardContent>
        </Card>
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{channelAdmins.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <UserCheck className="w-3 h-3" />
              ادمین کانال
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">در انتظار بررسی ({pendingRaffles.length})</TabsTrigger>
          <TabsTrigger value="approved">تایید شده ({approvedRaffles.length})</TabsTrigger>
          <TabsTrigger value="rejected">رد شده ({rejectedRaffles.length})</TabsTrigger>
        </TabsList>

        {/* Pending Raffles Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="telegram-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                فرم‌های ارسالی نیازمند بررسی
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
                </div>
              ) : pendingRaffles.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  فرم جدیدی برای بررسی موجود نیست
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRaffles.map((raffle: any) => (
                    <div key={raffle.id} className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50/50 dark:bg-orange-900/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            {raffle.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {raffle.prizeType === "stars" ? `${raffle.prizeValue} ستاره` : 
                             raffle.prizeType === "premium" ? `${raffle.prizeValue} ماه پریمیوم` : 
                             raffle.prizeType === "mixed" ? `${Math.floor(raffle.prizeValue / 2)} ستاره + ${Math.floor(raffle.prizeValue / 2)} ماه پریمیوم` :
                             `${raffle.prizeValue} واحد`}
                          </p>
                          
                          {/* Raffle Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">نوع جایزه:</span>
                                <div className="flex items-center gap-1">
                                  {getPrizeIcon(raffle.prizeType)}
                                  {getPrizeTypeText(raffle.prizeType)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">مقدار:</span>
                                <span>{raffle.prizeValue}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(raffle.raffleDateTime).toLocaleDateString('fa-IR')}</span>
                                <Clock className="w-4 h-4" />
                                <span>{new Date(raffle.raffleDateTime).toLocaleTimeString('fa-IR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">شناسه کانال:</span>
                                <span className="ml-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {raffle.channelId}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">شناسه پیام:</span>
                                <span className="ml-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {raffle.messageId}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">کانال‌های الزامی:</span>
                                <div className="flex gap-1 flex-wrap mt-1">
                                  {raffle.requiredChannels?.slice(0, 2).map((channel: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {channel}
                                    </Badge>
                                  ))}
                                  {raffle.requiredChannels?.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{raffle.requiredChannels.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>


                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-orange-200 dark:border-orange-800">
                        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setSelectedRaffle(raffle)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              تایید
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>تایید قرعه‌کشی</DialogTitle>
                              <DialogDescription>
                                سطح دسترسی این قرعه‌کشی را تعیین کنید
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="level">سطح مورد نیاز</Label>
                              <Select value={selectedLevel.toString()} onValueChange={(value) => setSelectedLevel(parseInt(value))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="سطح را انتخاب کنید" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">سطح 1 - مبتدی</SelectItem>
                                  <SelectItem value="2">سطح 2 - متوسط</SelectItem>
                                  <SelectItem value="3">سطح 3 - پیشرفته</SelectItem>
                                  <SelectItem value="4">سطح 4 - حرفه‌ای</SelectItem>
                                  <SelectItem value="5">سطح 5 - ویژه</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsApprovalDialogOpen(false)}
                              >
                                انصراف
                              </Button>
                              <Button
                                onClick={handleApprove}
                                disabled={approveRaffleMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {approveRaffleMutation.isPending ? "در حال تایید..." : "تایید"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              onClick={() => setSelectedRaffle(raffle)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              رد
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>رد قرعه‌کشی</DialogTitle>
                              <DialogDescription>
                                آیا از رد این قرعه‌کشی اطمینان دارید؟
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsRejectDialogOpen(false)}
                              >
                                انصراف
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={rejectRaffleMutation.isPending}
                              >
                                {rejectRaffleMutation.isPending ? "در حال رد..." : "رد"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          مشاهده جزئیات
                        </Button>
                      </div>

                      {/* Submission Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span>ارسال شده: {new Date(raffle.createdAt).toLocaleDateString('fa-IR')}</span>
                        <span>توسط: ادمین کانال</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Raffles Tab */}
        <TabsContent value="approved" className="space-y-4">
          <Card className="telegram-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                قرعه‌کشی‌های تایید شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allRafflesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
                </div>
              ) : approvedRaffles.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  قرعه‌کشی تایید شده‌ای موجود نیست
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedRaffles.map((raffle: any) => (
                    <div key={raffle.id} className="border border-green-200 dark:border-green-800 rounded-lg p-3 bg-green-50/50 dark:bg-green-900/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {raffle.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              {getPrizeIcon(raffle.prizeType)}
                              {getPrizeTypeText(raffle.prizeType)}
                            </span>
                            <span>سطح {raffle.levelRequired}</span>
                            <span>{new Date(raffle.raffleDateTime).toLocaleDateString('fa-IR')}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          تایید شده
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Raffles Tab */}
        <TabsContent value="rejected" className="space-y-4">
          <Card className="telegram-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                قرعه‌کشی‌های رد شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allRafflesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
                </div>
              ) : rejectedRaffles.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  قرعه‌کشی رد شده‌ای موجود نیست
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectedRaffles.map((raffle: any) => (
                    <div key={raffle.id} className="border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50/50 dark:bg-red-900/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {raffle.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              {getPrizeIcon(raffle.prizeType)}
                              {getPrizeTypeText(raffle.prizeType)}
                            </span>
                            <span>{new Date(raffle.raffleDateTime).toLocaleDateString('fa-IR')}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          رد شده
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}