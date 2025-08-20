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

  // ... keep existing queries/mutations (omitted for brevity)

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
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="participate">شرکت</TabsTrigger>
          <TabsTrigger value="submit">ثبت قرعه کشی</TabsTrigger>
          <TabsTrigger value="points">امتیازات</TabsTrigger>
          <TabsTrigger value="profile">پروفایل</TabsTrigger>
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

          {/* ... rest of submitted list rendering remains unchanged */}
          </Tabs>
        </TabsContent>

        {/* Simple placeholders for other tabs to avoid empty view */}
        <TabsContent value="participate">
          <div className="text-telegram-hint text-sm">بخش شرکت در قرعه‌کشی به‌زودی تکمیل می‌شود.</div>
        </TabsContent>
        <TabsContent value="points">
          <div className="text-telegram-hint text-sm">بخش امتیازات در دست آماده‌سازی است.</div>
        </TabsContent>
        <TabsContent value="profile">
          <div className="text-telegram-hint text-sm">برای مشاهده پروفایل از مسیر پروفایل نیز می‌توانید استفاده کنید.</div>
        </TabsContent>
      </Tabs>

      {/* ... rest of component unchanged */}
    </div>
  );
}
