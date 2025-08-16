import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Settings } from "lucide-react";
import type { BotConfig } from "@shared/schema";

const botConfigSchema = z.object({
  botToken: z.string().min(1, "توکن ربات الزامی است"),
  botUsername: z.string().min(1, "نام کاربری ربات الزامی است").regex(/^[a-zA-Z0-9_]+$/, "نام کاربری نامعتبر"),
  startLink: z.string().url("لینک استارت معتبر وارد کنید"),
  adminTelegramIds: z.string().min(1, "حداقل یک شناسه مدیر وارد کنید"),
});

type BotConfigFormData = z.infer<typeof botConfigSchema>;

interface BotConfigFormProps {
  onSuccess?: () => void;
}

export function BotConfigForm({ onSuccess }: BotConfigFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing bot config
  const { data: existingConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/bot/config'],
    retry: false,
  });

  const form = useForm<BotConfigFormData>({
    resolver: zodResolver(botConfigSchema),
    defaultValues: {
      botToken: "",
      botUsername: "",
      startLink: "",
      adminTelegramIds: "",
    },
  });

  // Update form when config loads
  useEffect(() => {
    if (existingConfig) {
      form.reset({
        botToken: existingConfig.botToken || "",
        botUsername: existingConfig.botUsername || "",
        startLink: existingConfig.startLink || "",
        adminTelegramIds: existingConfig.adminTelegramIds?.join(',') || "",
      });
    }
  }, [existingConfig, form]);

  const createConfigMutation = useMutation({
    mutationFn: async (data: BotConfigFormData) => {
      const response = await fetch("/api/bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          adminTelegramIds: data.adminTelegramIds.split(',').map(id => id.trim()).filter(Boolean),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save bot configuration");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "تنظیمات ربات با موفقیت ذخیره شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/config'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره تنظیمات ربات",
        variant: "destructive",
      });
      console.error("Bot config error:", error);
    },
  });

  const onSubmit = (data: BotConfigFormData) => {
    createConfigMutation.mutate(data);
  };

  // Generate start link automatically when bot username changes
  const botUsername = form.watch("botUsername");
  useEffect(() => {
    if (botUsername && !form.getValues("startLink")) {
      form.setValue("startLink", `https://t.me/${botUsername}?start=raffle`);
    }
  }, [botUsername, form]);

  if (isLoadingConfig) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">در حال بارگذاری...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          تنظیمات ربات تلگرام
        </CardTitle>
        <CardDescription>
          تنظیمات ربات تلگرام را برای اتصال به مینی‌اپ پیکربندی کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="botToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توکن ربات</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    توکن ربات را از @BotFather دریافت کنید
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="botUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام کاربری ربات</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your_raffle_bot"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    نام کاربری ربات بدون @ (مثال: my_raffle_bot)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>لینک استارت ربات</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://t.me/your_raffle_bot?start=raffle"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    لینک مستقیم برای شروع ربات
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminTelegramIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شناسه‌های تلگرام مدیران</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123456789,987654321,555666777"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    شناسه‌های عددی تلگرام مدیران را با کاما جدا کنید
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createConfigMutation.isPending}
                className="flex-1"
              >
                <Settings className="w-4 h-4 ml-2" />
                {createConfigMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}