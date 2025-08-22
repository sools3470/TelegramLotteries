import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  MessageSquare, 
  Star, 
  Crown, 
  Settings, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Gift, 
  AlertCircle, 
  Eye, 
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  UserPlus,
  Hash,
  Ban,
  UserMinus,
  Activity,
  BarChart3,
  TrendingUp,
  ArrowUp,
  Channel
} from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";

interface AdminBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function AdminBottomNav({ activeTab, onTabChange }: AdminBottomNavProps) {
  const tabs = [
    { id: "raffles", label: "پیام‌های قرعه‌کشی", icon: MessageSquare },
    { id: "channels", label: "کانال‌های اسپانسری", icon: Hash },
    { id: "admins", label: "مدیریت مدیران", icon: Crown },
    { id: "profile", label: "پروفایل", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-telegram-surface border-t border-telegram safe-area-bottom z-50">
      <div className="flex justify-around items-center px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-telegram transition-all duration-200 min-w-0 flex-1 ${
                isActive 
                  ? "bg-telegram-blue text-white shadow-telegram-lg" 
                  : "text-telegram-text-secondary hover:bg-telegram-surface-variant hover:text-telegram-text"
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("raffles");
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [rejectionReason, setRejectionReason] = useState("");
  const [restrictionType, setRestrictionType] = useState<"none" | "temporary" | "permanent">("none");
  const [restrictionEnd, setRestrictionEnd] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Scroll to top function
  const scrollToTop = () => {
    console.log('Admin scroll to top clicked');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      const scrollThreshold = 1;
      
      console.log('Admin scroll detected:', scrollY);
      setShowScrollToTop(scrollY > scrollThreshold);
    };

    // Test scroll button
    setShowScrollToTop(true);

    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => document.removeEventListener('scroll', handleScroll);
  }, []);

  // Queries
  const { data: pendingRaffles = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['/api/raffles', 'pending', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('status', 'pending');
      if (user?.id) params.append('userId', user.id);
      
      const response = await fetch(`/api/raffles?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch pending raffles');
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const { data: allRaffles = [], isLoading: allRafflesLoading } = useQuery({
    queryKey: ['/api/raffles', 'all', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      
      const response = await fetch(`/api/raffles?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch all raffles');
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const { data: sponsorChannels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['/api/sponsor-channels'],
    enabled: !!user?.id,
  });

  const { data: adminUsers = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['/api/admin/users', 'bot_admin'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users?type=bot_admin');
      if (!response.ok) throw new Error('Failed to fetch admin users');
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const { data: stats = { 
    pendingRaffles: 0, 
    approvedRaffles: 0, 
    rejectedRaffles: 0, 
    totalUsers: 0 
  }, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: !!user?.id,
  });

  // Mutations
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
      
      if (!response.ok) throw new Error("Failed to approve raffle");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      setIsApprovalDialogOpen(false);
      setSelectedRaffle(null);
      toast({ title: "قرعه‌کشی با موفقیت تایید شد" });
    },
    onError: () => {
      toast({ title: "خطا در تایید قرعه‌کشی", variant: "destructive" });
    },
  });

  const rejectRaffleMutation = useMutation({
    mutationFn: async ({ raffleId, reason, restriction }: { 
      raffleId: string; 
      reason: string;
      restriction: {
        type: "none" | "temporary" | "permanent";
        endDate?: string;
      };
    }) => {
      const response = await fetch(`/api/raffles/${raffleId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason,
          restriction,
          adminUserId: user?.id 
        }),
      });
      
      if (!response.ok) throw new Error("Failed to reject raffle");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      setIsRejectDialogOpen(false);
      setSelectedRaffle(null);
      setRejectionReason("");
      setRestrictionType("none");
      setRestrictionEnd("");
      toast({ title: "قرعه‌کشی رد شد" });
    },
    onError: () => {
      toast({ title: "خطا در رد قرعه‌کشی", variant: "destructive" });
    },
  });

  const filteredRaffles = allRaffles.filter((raffle: any) => {
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         raffle.submitterId.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || raffle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleApproveRaffle = () => {
    if (selectedRaffle) {
      approveRaffleMutation.mutate({
        raffleId: selectedRaffle.id,
        levelRequired: selectedLevel,
      });
    }
  };

  const handleRejectRaffle = () => {
    if (selectedRaffle && rejectionReason.trim()) {
      rejectRaffleMutation.mutate({
        raffleId: selectedRaffle.id,
        reason: rejectionReason,
        restriction: {
          type: restrictionType,
          endDate: restrictionType === "temporary" ? restrictionEnd : undefined,
        },
      });
    }
  };

  return (
    <div className="app-container bg-telegram-bg">
      <div className="main-content p-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-telegram mb-2">پنل مدیریت</h1>
          <div className="flex items-center gap-2 text-telegram-text-secondary">
            <Crown size={16} />
            <span>سطح دسترسی: {user?.adminLevel === 1 ? "مدیر اصلی" : "مدیر محدود"}</span>
          </div>
        </div>

        {/* Stats Overview - Always visible */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="shadow-telegram">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-telegram-text-secondary">در انتظار بررسی</p>
                    <p className="text-2xl font-bold text-telegram-pending">{stats.pendingRaffles}</p>
                  </div>
                  <Clock className="text-telegram-pending" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-telegram">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-telegram-text-secondary">تایید شده</p>
                    <p className="text-2xl font-bold text-telegram-success">{stats.approvedRaffles}</p>
                  </div>
                  <CheckCircle className="text-telegram-success" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-telegram">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-telegram-text-secondary">رد شده</p>
                    <p className="text-2xl font-bold text-telegram-error">{stats.rejectedRaffles}</p>
                  </div>
                  <XCircle className="text-telegram-error" size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-telegram">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-telegram-text-secondary">کل کاربران</p>
                    <p className="text-2xl font-bold text-telegram-blue">{stats.totalUsers}</p>
                  </div>
                  <Users className="text-telegram-blue" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "raffles" && (
          <Card className="shadow-telegram-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} />
                مدیریت پیام‌های قرعه‌کشی
              </CardTitle>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-telegram-text-secondary" size={16} />
                    <Input
                      placeholder="جستجو در عنوان یا شناسه کاربر..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="فیلتر وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="pending">در انتظار بررسی</SelectItem>
                    <SelectItem value="approved">تایید شده</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm">
                  <Download size={16} className="ml-2" />
                  خروجی CSV
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="table-modern">
                  <TableHeader>
                    <TableRow>
                      <TableHead>عنوان</TableHead>
                      <TableHead>ارسال‌کننده</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ قرعه‌کشی</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRaffles.map((raffle: any) => (
                      <TableRow key={raffle.id} className="animate-fade-in">
                        <TableCell className="font-medium">{raffle.title}</TableCell>
                        <TableCell>{raffle.submitterId}</TableCell>
                        <TableCell>{getStatusBadge(raffle.status)}</TableCell>
                        <TableCell>{format(new Date(raffle.raffleDateTime), "yyyy/MM/dd HH:mm")}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {raffle.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRaffle(raffle);
                                    setIsApprovalDialogOpen(true);
                                  }}
                                  className="bg-telegram-success hover:bg-telegram-success/90"
                                >
                                  <CheckCircle size={14} className="ml-1" />
                                  تایید
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedRaffle(raffle);
                                    setIsRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle size={14} className="ml-1" />
                                  رد
                                </Button>
                              </>
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
            </CardContent>
          </Card>
        )}

        {activeTab === "channels" && (
          <Card className="shadow-telegram-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Channel size={20} />
                  کانال‌های اسپانسری
                </div>
                <Button>
                  <Plus size={16} className="ml-2" />
                  افزودن کانال
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-4">
                {(sponsorChannels as any[]).map((channel: any) => (
                  <Card key={channel.id} className="border border-telegram">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-telegram">{channel.channelName}</h3>
                          <p className="text-sm text-telegram-text-secondary mt-1">{channel.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-telegram-text-secondary">امتیاز: {channel.pointsReward}</span>
                            <Badge variant={channel.isActive ? "default" : "secondary"}>
                              {channel.isActive ? "فعال" : "غیرفعال"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit size={14} />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "admins" && user?.adminLevel === 1 && (
          <Card className="shadow-telegram-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown size={20} />
                  مدیریت مدیران
                </div>
                <Button>
                  <UserPlus size={16} className="ml-2" />
                  افزودن مدیر
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="table-modern">
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>شناسه تلگرام</TableHead>
                      <TableHead>سطح دسترسی</TableHead>
                      <TableHead>تاریخ ایجاد</TableHead>
                      <TableHead>آخرین ورود</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(adminUsers as any[]).map((admin: any) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                          {admin.firstName} {admin.lastName}
                        </TableCell>
                        <TableCell>@{admin.username}</TableCell>
                        <TableCell>
                          <Badge variant={admin.adminLevel === 1 ? "default" : "secondary"}>
                            {admin.adminLevel === 1 ? "مدیر اصلی" : "مدیر محدود"}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(admin.createdAt), "yyyy/MM/dd")}</TableCell>
                        <TableCell>
                          {admin.lastLoginAt ? format(new Date(admin.lastLoginAt), "yyyy/MM/dd HH:mm") : "هرگز"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit size={14} />
                            </Button>
                            {admin.id !== user?.id && (
                              <Button size="sm" variant="destructive">
                                <UserMinus size={14} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "profile" && (
          <Card className="shadow-telegram-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                پروفایل مدیر
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>نام و نام خانوادگی</Label>
                  <p className="mt-1 font-medium">{user?.firstName} {user?.lastName}</p>
                </div>
                
                <div>
                  <Label>شناسه تلگرام</Label>
                  <p className="mt-1 font-medium">@{user?.username}</p>
                </div>
                
                <div>
                  <Label>سطح دسترسی</Label>
                  <p className="mt-1">
                    <Badge variant={user?.adminLevel === 1 ? "default" : "secondary"}>
                      {user?.adminLevel === 1 ? "مدیر اصلی" : "مدیر محدود"}
                    </Badge>
                  </p>
                </div>
                
                <div>
                  <Label>تاریخ ایجاد</Label>
                  <p className="mt-1">{user?.createdAt ? format(new Date(user.createdAt), "yyyy/MM/dd HH:mm") : "-"}</p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-telegram">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Activity size={16} />
                  آمار عملیات
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-telegram-success">12</p>
                    <p className="text-sm text-telegram-text-secondary">تایید شده</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-telegram-error">3</p>
                    <p className="text-sm text-telegram-text-secondary">رد شده</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-telegram-blue">5</p>
                    <p className="text-sm text-telegram-text-secondary">کانال اضافه شده</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-telegram-pending">2</p>
                    <p className="text-sm text-telegram-text-secondary">مدیر اضافه شده</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <AdminBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="animate-slide-up">
          <DialogHeader>
            <DialogTitle>تایید قرعه‌کشی</DialogTitle>
            <DialogDescription>
              سطح مورد نیاز برای مشاهده این قرعه‌کشی را تعیین کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>سطح مورد نیاز</Label>
              <Select value={selectedLevel.toString()} onValueChange={(value) => setSelectedLevel(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      سطح {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              انصراف
            </Button>
            <Button 
              onClick={handleApproveRaffle}
              disabled={approveRaffleMutation.isPending}
              className="bg-telegram-success hover:bg-telegram-success/90"
            >
              {approveRaffleMutation.isPending ? "در حال تایید..." : "تایید"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="animate-slide-up max-w-lg">
          <DialogHeader>
            <DialogTitle>رد قرعه‌کشی</DialogTitle>
            <DialogDescription>
              دلیل رد را مشخص کنید و در صورت نیاز کاربر را محدود کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>دلیل رد *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="دلیل رد قرعه‌کشی را بنویسید..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>نوع محدودیت</Label>
              <Select value={restrictionType} onValueChange={(value: any) => setRestrictionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون محدودیت</SelectItem>
                  <SelectItem value="temporary">محدودیت موقت</SelectItem>
                  <SelectItem value="permanent">مسدودیت دائم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {restrictionType === "temporary" && (
              <div>
                <Label>تاریخ پایان محدودیت</Label>
                <Input
                  type="datetime-local"
                  value={restrictionEnd}
                  onChange={(e) => setRestrictionEnd(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              انصراف
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectRaffle}
              disabled={rejectRaffleMutation.isPending || !rejectionReason.trim()}
            >
              {rejectRaffleMutation.isPending ? "در حال رد..." : "رد کردن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scroll to Top Button - for admin */}
      {showScrollToTop && (
        <div 
          className="fixed bottom-20 left-4 z-[9999] animate-slideUp"
          style={{ opacity: 1, transform: "translateY(0)", pointerEvents: "auto" }}
        >
          <Button
            onClick={scrollToTop}
            className="flex items-center gap-2 bg-telegram-blue hover:bg-telegram-blue/90 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="به بالا"
            aria-label="به بالا"
            style={{ pointerEvents: "auto" }}
          >
            <ArrowUp size={20} className="text-white" />
            <span className="text-sm font-medium whitespace-nowrap text-white">به بالا</span>
          </Button>
        </div>
      )}

      {/* Debug info for admin */}
      <div className="fixed top-4 right-4 z-[9999] bg-black text-white p-2 text-xs" style={{ pointerEvents: "auto" }}>
        <div>showScrollToTop: {showScrollToTop ? 'true' : 'false'}</div>
        <div>userType: {user?.userType}</div>
        <div>scrollY: {typeof window !== 'undefined' ? (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop) : 'N/A'}</div>
        <button 
          onClick={scrollToTop}
          className="mt-2 bg-red-500 text-white px-2 py-1 text-xs cursor-pointer"
          style={{ pointerEvents: "auto" }}
        >
          Test Scroll to Top
        </button>
      </div>
    </div>
  );
}