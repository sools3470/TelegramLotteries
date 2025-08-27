import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Star, Crown, Send, Plus } from "lucide-react";

// Schema for raffle submission form
const raffleSubmissionSchema = z.object({
  channelId: z.string().min(1, "شناسه کانال الزامی است"),
  messageId: z.string().min(1, "شناسه پیام الزامی است"),
  title: z.string().min(3, "عنوان باید حداقل ۳ کاراکتر باشد"),
  prizeType: z.enum(["stars", "premium", "mixed"], {
    required_error: "نوع جایزه را انتخاب کنید"
  }),
  prizeValue: z.number().min(1, "مقدار جایزه باید مثبت باشد").optional(),
  requiredChannels: z.string().min(1, "حداقل یک کانال الزامی است"),
  raffleDateTime: z.string().min(1, "تاریخ و زمان الزامی است"),
});

type RaffleSubmissionData = z.infer<typeof raffleSubmissionSchema>;

interface RaffleSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RaffleSubmissionDialog({ open, onOpenChange }: RaffleSubmissionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RaffleSubmissionData>({
    resolver: zodResolver(raffleSubmissionSchema),
    defaultValues: {
      channelId: "",
      messageId: "",
      title: "",
      prizeType: "stars",
      prizeValue: undefined,
      requiredChannels: "",
      raffleDateTime: "",
    }
  });

  // Submit raffle mutation
  const submitRaffleMutation = useMutation({
    mutationFn: async (data: RaffleSubmissionData) => {
      const response = await fetch('/api/raffles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: data.channelId,
          messageId: data.messageId,
          title: data.title,
          prizeType: data.prizeType,
          prizeValue: typeof data.prizeValue === 'number' ? data.prizeValue : undefined,
          requiredChannels: (data.requiredChannels || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          raffleDateTime: data.raffleDateTime,
          levelRequired: 1,
          submitterId: user?.id || 'unknown'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'خطا در ارسال قرعه‌کشی');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      form.reset();
      onOpenChange(false);
      toast({
        title: "موفقیت",
        description: "قرعه‌کشی شما با موفقیت ارسال شد و در انتظار بررسی مدیران است"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ارسال قرعه‌کشی"
      });
    }
  });

  const onSubmit = (data: RaffleSubmissionData) => {
    submitRaffleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-telegram-blue" />
            ثبت قرعه‌کشی جدید
          </DialogTitle>
          <DialogDescription>
            لطفاً اطلاعات قرعه‌کشی خود را با دقت وارد کنید
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="channelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شناسه کانال</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@channel_username" />
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
                      <Input {...field} placeholder="123456" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان قرعه‌کشی</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="عنوان جذاب برای قرعه‌کشی" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prizeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع جایزه</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع جایزه" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stars">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 star-icon" />
                            Telegram Stars
                          </div>
                        </SelectItem>
                        <SelectItem value="premium">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-telegram-warning" />
                            Telegram Premium
                          </div>
                        </SelectItem>
                        <SelectItem value="mixed">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 star-icon" />
                            <Crown className="w-4 h-4 text-telegram-warning" />
                            ترکیبی
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                        value={field.value ?? ''}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9۰-۹٠-٩]*"
                        placeholder="مثال: 100"
                        onChange={e => {
                          const raw = e.target.value;
                          // Convert Persian/Arabic-Indic digits to ASCII
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
                  <FormLabel>کانال‌های الزامی</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="@channel1, @channel2, @channel3" 
                      rows={2}
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
                    <Input {...field} type="datetime-local" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                لغو
              </Button>
              <Button 
                type="submit" 
                disabled={submitRaffleMutation.isPending}
                className="bg-telegram-blue hover:bg-telegram-blue-dark"
              >
                {submitRaffleMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                ) : (
                  <Send className="w-4 h-4 ml-2" />
                )}
                ارسال برای بررسی
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}