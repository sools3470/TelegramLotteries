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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

import { format } from "date-fns";
import Profile from "@/pages/profile";

// New form schema per specs
const raffleFormSchema = z.object({
  messageUrl: z.string().min(1, "لینک پیام الزامی است").refine(v => v.startsWith("https://t.me/"), {
    message: "لینک باید با https://t.me/ شروع شود",
  }),
  raffleDateTime: z.string().min(1, "تاریخ و زمان الزامی است"),
  requiredChannelsCount: z.coerce.number().int().min(1, "تعداد کانال‌ها باید حداقل 1 باشد"),

  prizeChoice: z.enum(["stars", "premium"], { required_error: "انتخاب نوع جایزه الزامی است" }),
  // Stars-only fields
  starsCount: z.coerce.number().int().min(1, "تعداد ستاره باید بیش از 0 باشد").optional(),
  starsWinners: z.coerce.number().int().min(1, "تعداد برندگان باید بیش از 0 باشد").optional(),
  // Premium-only fields
  premiumCount: z.coerce.number().int().min(1, "تعداد اشتراک باید بیش از 0 باشد").optional(),
  premiumDurationMonths: z.enum(["3", "6", "12"]).optional(),

  // Countries
  allCountries: z.boolean().default(true),
  selectedCountries: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.prizeChoice === "stars") {
    if (!data.starsCount || data.starsCount < 1) ctx.addIssue({ code: "custom", path: ["starsCount"], message: "تعداد ستاره باید بیش از 0 باشد" });
    if (!data.starsWinners || data.starsWinners < 1) ctx.addIssue({ code: "custom", path: ["starsWinners"], message: "تعداد برندگان باید بیش از 0 باشد" });
  }
  if (data.prizeChoice === "premium") {
    if (!data.premiumCount || data.premiumCount < 1) ctx.addIssue({ code: "custom", path: ["premiumCount"], message: "تعداد اشتراک باید بیش از 0 باشد" });
    if (!data.premiumDurationMonths) ctx.addIssue({ code: "custom", path: ["premiumDurationMonths"], message: "مدت زمان اشتراک را انتخاب کنید" });
  }
  if (!data.allCountries) {
    if (!data.selectedCountries || data.selectedCountries.length === 0) {
      ctx.addIssue({ code: "custom", path: ["selectedCountries"], message: "حداقل یک کشور را انتخاب کنید" });
    }
  }
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
      prizeChoice: "stars",
      starsCount: undefined,
      starsWinners: undefined,
      premiumCount: undefined,
      premiumDurationMonths: undefined,
      allCountries: true,
      selectedCountries: [],
      raffleDateTime: "",
      requiredChannelsCount: 1,
    },
  });

  // Participate tab data and actions
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

  const joinRaffleMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await fetch(`/api/raffles/${raffleId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!response.ok) throw new Error('Failed to join raffle');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/joined-raffles'] });
      toast({ title: 'موفق', description: 'با موفقیت در قرعه‌کشی شرکت کردید' });
    },
    onError: () => {
      toast({ title: 'خطا', description: 'خطا در شرکت در قرعه‌کشی', variant: 'destructive' });
    }
  });

  const markSeenMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await fetch(`/api/raffles/${raffleId}/seen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!response.ok) throw new Error('Failed to mark as seen');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/seen-raffles'] });
    }
  });

  const getFilteredRaffles = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (activeFilter) {
      case 'today':
        return (raffles as any[]).filter((raffle: any) => {
          const raffleDate = new Date(raffle.raffleDateTime);
          return raffleDate >= today && raffleDate < tomorrow;
        });
      case 'seen':
        return (raffles as any[]).filter((raffle: any) => (seenRaffles as any[])?.includes?.(raffle.id));
      case 'joined':
        return (raffles as any[]).filter((raffle: any) => (joinedRaffles as any[])?.includes?.(raffle.id));
      case 'ended':
        return (raffles as any[]).filter((raffle: any) => new Date(raffle.raffleDateTime) < now);
      default:
        return raffles as any[];
    }
  };

  const filteredRaffles = getFilteredRaffles();
  const isUserJoined = (raffleId: string) => (joinedRaffles as any[])?.includes?.(raffleId) || false;

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

  const isRaffleEnded = (raffleDateTime: string) => new Date(raffleDateTime) < new Date();

  // Submitted raffles for current user
  const { data: submittedRaffles = [], isLoading: submittedLoading } = useQuery({
    queryKey: ['/api/raffles/submitted', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/raffles/submitted/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch submitted raffles');
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const getFilteredSubmissions = () => {
    switch (submissionFilter) {
      case 'pending':
        return (submittedRaffles as any[]).filter(r => r.status === 'pending');
      case 'approved':
        return (submittedRaffles as any[]).filter(r => r.status === 'approved');
      case 'rejected':
        return (submittedRaffles as any[]).filter(r => r.status === 'rejected');
      default:
        return submittedRaffles as any[];
    }
  };
  const filteredSubmissions = getFilteredSubmissions();

  const submitRaffleMutation = useMutation({
    mutationFn: async (requestData: any) => {
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
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles/submitted'] });
    },
    onError: () => {
      toast({ title: "خطا در ارسال قرعه‌کشی", variant: "destructive" });
    },
  });

  const parseMessageUrl = (url: string): { channelId: string; messageId: string } => {
    try {
      // patterns: https://t.me/<channel>/<messageId> or https://t.me/c/<id>/<messageId>
      const withoutProto = url.replace("https://t.me/", "");
      const parts = withoutProto.split("/");
      if (parts[0] === "c" && parts.length >= 3) {
        // private/supergroup style
        const messageId = parts[2];
        return { channelId: "@unknown", messageId };
      }
      const channel = parts[0];
      const messageId = parts[1];
      return { channelId: `@${channel}`, messageId };
    } catch {
      return { channelId: "@unknown", messageId: "" };
    }
  };

  const handleSubmitRaffle = (data: RaffleFormData) => {
    const { channelId, messageId } = parseMessageUrl(data.messageUrl);
    const prizeType = data.prizeChoice;
    const prizeValue = prizeType === 'stars' ? Number(data.starsCount) : Number(data.premiumCount);
    const requiredChannels = Array.from({ length: Number(data.requiredChannelsCount) }, (_, i) => `TBD-${i + 1}`);

    const payload = {
      channelId,
      messageId,
      prizeType,
      prizeValue,
      requiredChannels,
      raffleDateTime: new Date(data.raffleDateTime).toISOString(),
      levelRequired: 1,
      submitterId: user?.id,
      originalData: {
        rawMessageUrl: data.messageUrl,
        stars: data.prizeChoice === 'stars' ? { count: data.starsCount, winners: data.starsWinners } : undefined,
        premium: data.prizeChoice === 'premium' ? { count: data.premiumCount, durationMonths: data.premiumDurationMonths } : undefined,
        countries: { all: data.allCountries, selected: data.selectedCountries },
        requiredChannelsCount: data.requiredChannelsCount,
      },
    };

    submitRaffleMutation.mutate(payload as any);
  };

  // ... UI rendering (keep as is up to Submit Tab header)

  return (
    <div className="p-4 h-full overflow-y-auto tab-content-enter">
      {/* Main user tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-4">
          <TabsTrigger value="participate" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            شرکت
          </TabsTrigger>
          <TabsTrigger value="submit" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            ثبت قرعه کشی
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            امتیازات
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            پروفایل
          </TabsTrigger>
        </TabsList>

        {/* Submit tab */}
        <TabsContent value="submit" className="space-y-6 tab-content-enter">
          {/* Submission Filter Tabs */}
          <Tabs value={submissionFilter} onValueChange={setSubmissionFilter} className="w-full">
            <TabsList className="filter-tabs-responsive mb-4">
              <TabsTrigger value="all" className="text-xs">ثبت جدید</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">در انتظار</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">تایید شده</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">رد شده</TabsTrigger>
            </TabsList>

          {/* ثبت قرعه‌کشی - فرم */}
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
                    {/* بخش 1: لینک پیام */}
                    <FormField
                      control={form.control}
                      name="messageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>لینک پیام قرعه‌کشی (از کانال برگزارکننده) *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://t.me/channel/12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* بخش 2: تاریخ اعلام برنده */}
                    <FormField
                      control={form.control}
                      name="raffleDateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاریخ و زمان اعلام برنده *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* بخش 3: تعداد کانال‌های شرط */}
                    <FormField
                      control={form.control}
                      name="requiredChannelsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تعداد کانال‌های شرط برای شرکت *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              value={field.value as any}
                              onChange={(e) => field.onChange(Math.max(1, Number(e.target.value) || 1))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* بخش 4: جوایز */}
                    <div className="responsive-grid">
                      <FormField
                        control={form.control}
                        name="prizeChoice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع جایزه *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب کنید" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="stars">ستاره</SelectItem>
                                <SelectItem value="premium">اشتراک تلگرام پریمیوم</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch('prizeChoice') === 'stars' && (
                        <div className="responsive-grid">
                          <FormField
                            control={form.control}
                            name="starsCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>تعداد ستاره *</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} value={field.value as any || ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="starsWinners"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>بین چند برنده توزیع شود؟ *</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} value={field.value as any || ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {form.watch('prizeChoice') === 'premium' && (
                        <div className="responsive-grid">
                          <FormField
                            control={form.control}
                            name="premiumCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>تعداد اشتراک *</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} value={field.value as any || ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="premiumDurationMonths"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>مدت زمان هر اشتراک *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="انتخاب مدت" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="3">۳ ماهه</SelectItem>
                                    <SelectItem value="6">۶ ماهه</SelectItem>
                                    <SelectItem value="12">۱۲ ماهه</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* بخش 5: کشورهای واجد شرایط */}
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="allCountries"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>کشورهای واجد شرایط *</FormLabel>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                              <span>تمامی کشورها</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!form.watch('allCountries') && (
                        <FormField
                          control={form.control}
                          name="selectedCountries"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>انتخاب کشورها (یک یا چند)</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border rounded-md">
                                  {[
                                    { code: 'IR', name: 'ایران', flag: '🇮🇷' },
                                    { code: 'TR', name: 'ترکیه', flag: '🇹🇷' },
                                    { code: 'AE', name: 'امارات', flag: '🇦🇪' },
                                    { code: 'US', name: 'آمریکا', flag: '🇺🇸' },
                                    { code: 'DE', name: 'آلمان', flag: '🇩🇪' },
                                    { code: 'RU', name: 'روسیه', flag: '🇷🇺' },
                                  ].map((c) => (
                                    <label key={c.code} className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={field.value?.includes(c.code) || false}
                                        onChange={(e) => {
                                          const current = new Set(field.value || []);
                                          if (e.target.checked) current.add(c.code); else current.delete(c.code);
                                          field.onChange(Array.from(current));
                                        }}
                                      />
                                      <span>{c.flag} {c.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

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
          {/* لیست قرعه‌کشی‌های ارسالی */}
          <Card className="telegram-card">
            <CardHeader>
              <CardTitle className="text-base">قرعه‌کشی‌های ارسالی شما</CardTitle>
            </CardHeader>
            <CardContent>
              {submittedLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
                </div>
              ) : (filteredSubmissions as any[]).length === 0 ? (
                <div className="text-center text-telegram-text-secondary py-6">موردی یافت نشد</div>
              ) : (
                <div className="space-y-3">
                  {(filteredSubmissions as any[]).map((submission: any) => (
                    <Card key={submission.id} className="telegram-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-telegram mb-1">{submission.title || 'قرعه‌کشی'}</div>
                            <div className="text-xs text-telegram-text-secondary flex gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(submission.raffleDateTime).toLocaleDateString('fa-IR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(submission.raffleDateTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(submission.status)}
                            {submission.status === 'rejected' && (
                              <Button size="sm" variant="outline">
                                <Edit className="w-3 h-3 ml-1" />
                                ویرایش
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </Tabs>
        </TabsContent>

        {/* Participate Tab - Old card layout with filters */}
        <TabsContent value="participate">
          <div className="space-y-4">
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

                {rafflesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
                  </div>
                ) : (filteredRaffles as any[]).length === 0 ? (
                  <Card className="telegram-card">
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-600 dark:text-gray-400">در این دسته‌بندی قرعه‌کشی یافت نشد</div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {(filteredRaffles as any[]).map((raffle: any) => (
                      <Card 
                        key={raffle.id} 
                        className={`telegram-card cursor-pointer transition-all hover:shadow-md ${
                          (seenRaffles as any[])?.includes?.(raffle.id) ? 'opacity-75' : ''
                        }`}
                        onClick={() => markSeenMutation.mutate(raffle.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-start gap-2 mb-2">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex-1">
                                  {raffle.title}
                                </h3>
                                {!(seenRaffles as any[])?.includes?.(raffle.id) && (
                                  <div className="w-2 h-2 bg-telegram rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {raffle.prizeDescription}
                              </p>
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
                                  {new Date(raffle.raffleDateTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  سطح {raffle.levelRequired}
                                </span>
                              </div>

                              {raffle.requiredChannels?.length > 0 && (
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs text-gray-500">عضویت در:</span>
                                  <div className="flex gap-1 flex-wrap">
                                    {raffle.requiredChannels.slice(0, 3).map((channel: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">{channel}</Badge>
                                    ))}
                                    {raffle.requiredChannels.length > 3 && (
                                      <Badge variant="outline" className="text-xs">+{raffle.requiredChannels.length - 3}</Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {isRaffleEnded(raffle.raffleDateTime) && (
                                <div className="text-xs text-red-500 flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  پایان یافته
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="outline" className="text-xs">
                                سطح {raffle.levelRequired}
                              </Badge>
                              {(joinedRaffles as any[])?.includes?.(raffle.id) ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  شرکت کرده‌اید
                                </Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); joinRaffleMutation.mutate(raffle.id); }}
                                  disabled={joinRaffleMutation.isPending || isRaffleEnded(raffle.raffleDateTime)}
                                >
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
        </TabsContent>
        {/* Points Tab */}
        <TabsContent value="points">
          <PointsSection />
        </TabsContent>
        <TabsContent value="profile">
          <Profile />
        </TabsContent>
      </Tabs>

      {/* ... rest of component unchanged */}
    </div>
  );
}

function PointsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.id}/stats`);
      if (!res.ok) throw new Error('Failed to fetch user stats');
      return res.json();
    },
    enabled: !!user?.id,
  });

  const referralLink = user?.referralCode ? `https://t.me/YourBotName?start=${user.referralCode}` : '';

  const { data: sponsorChannels = [] } = useQuery({
    queryKey: ['/api/sponsor-channels'],
    enabled: !!user?.id,
  });

  const joinSponsorChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/sponsor-channels/${channelId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to join sponsor channel');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({ title: `${data.pointsEarned} امتیاز دریافت کردید!` });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
    },
    onError: () => { toast({ title: 'خطا در عضویت در کانال', variant: 'destructive' }); }
  });

  const pointsHistory = (userStats?.pointsHistory as Array<{ date: string; points: number }>) || [
    { date: '01', points: Math.max(0, (user?.points || 0) - 30) },
    { date: '08', points: Math.max(0, (user?.points || 0) - 20) },
    { date: '15', points: Math.max(0, (user?.points || 0) - 10) },
    { date: '22', points: user?.points || 0 },
  ];

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast({ title: 'لینک رفرال کپی شد' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="telegram-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-telegram-warning">{user?.points}</div>
              <div className="text-xs text-telegram-text-secondary">امتیاز</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-telegram">{user?.level}</div>
              <div className="text-xs text-telegram-text-secondary">سطح</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats?.joinedCount || 0}</div>
              <div className="text-xs text-telegram-text-secondary">شرکت کرده</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats?.submittedCount || 0}</div>
              <div className="text-xs text-telegram-text-secondary">ثبت شده</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="telegram-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> روند امتیازات</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ points: { label: 'امتیاز', color: 'hsl(43, 96%, 56%)' } }}>
            <LineChart data={pointsHistory} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent nameKey="points" />} />
              <Line type="monotone" dataKey="points" stroke="var(--color-points)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="telegram-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Share2 className="w-4 h-4" /> لینک دعوت دوستان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input readOnly value={referralLink} placeholder="ابتدا کد معرفی دریافت کنید" />
            <Button onClick={copyReferralLink} variant="outline" size="sm"><Link2 className="w-4 h-4 ml-1" /> کپی</Button>
          </div>
        </CardContent>
      </Card>

      {(sponsorChannels as any[]).length > 0 && (
        <Card className="telegram-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> کانال‌های اسپانسری</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {(sponsorChannels as any[]).map((channel: any) => (
                <div key={channel.id} className="flex items-center justify-between p-3 border border-telegram rounded-telegram">
                  <div>
                    <div className="font-medium text-telegram">{channel.channelName}</div>
                    <div className="text-xs text-telegram-text-secondary">+{channel.pointsReward} امتیاز</div>
                  </div>
                  <Button size="sm" onClick={() => joinSponsorChannelMutation.mutate(channel.id)}>عضویت</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
