import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Users, Award, TrendingUp, Star } from "lucide-react";

export function ReferralSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Get user referral data
  const { data: referralData, isLoading } = useQuery({
    queryKey: ['/api/referral', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}/referral`);
      if (!response.ok) throw new Error('Failed to fetch referral data');
      return await response.json();
    },
    enabled: !!user?.id
  });

  // Generate referral link if doesn't exist
  const generateReferralMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/generate-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate referral link');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referral'] });
      toast({
        title: "موفقیت",
        description: "لینک رفرال شما ایجاد شد"
      });
    }
  });

  const copyReferralLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "کپی شد",
        description: "لینک رفرال کپی شد"
      });
    }
  };

  const shareReferralLink = () => {
    if (navigator.share && referralData?.referralLink) {
      navigator.share({
        title: 'دنیای قرعه‌کشی',
        text: 'به من در دنیای قرعه‌کشی بپیوندید!',
        url: referralData.referralLink
      });
    } else {
      copyReferralLink();
    }
  };

  if (isLoading) {
    return (
      <Card className="telegram-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-telegram-blue"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="telegram-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-telegram-blue" />
          سیستم دعوت دوستان
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-telegram-surface-variant rounded-telegram p-4 text-center">
            <Users className="w-6 h-6 text-telegram-blue mx-auto mb-2" />
            <div className="text-2xl font-bold text-telegram">{referralData?.referredCount || 0}</div>
            <div className="text-sm text-telegram-text-secondary">دوستان دعوت شده</div>
          </div>
          <div className="bg-telegram-surface-variant rounded-telegram p-4 text-center">
            <Award className="w-6 h-6 text-telegram-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-telegram">{referralData?.referralPoints || 0}</div>
            <div className="text-sm text-telegram-text-secondary">امتیاز دعوت</div>
          </div>
        </div>

        {/* Referral Link Section */}
        {referralData?.referralLink ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-telegram block mb-2">
                لینک دعوت شما
              </label>
              <div className="flex gap-2">
                <Input
                  value={referralData.referralLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={copyReferralLink}
                  variant="outline"
                  className="px-3"
                >
                  {copied ? (
                    <span className="text-telegram-success">✓</span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={shareReferralLink}
                className="flex-1 bg-telegram-blue hover:bg-telegram-blue-dark"
              >
                <Share2 className="w-4 h-4 ml-2" />
                اشتراک‌گذاری
              </Button>
              <Button
                onClick={copyReferralLink}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 ml-2" />
                کپی لینک
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-telegram-text-secondary mx-auto mb-4" />
            <p className="text-telegram-text-secondary mb-4">
              هنوز لینک رفرال شما ایجاد نشده است
            </p>
            <Button
              onClick={() => generateReferralMutation.mutate()}
              disabled={generateReferralMutation.isPending}
              className="bg-telegram-blue hover:bg-telegram-blue-dark"
            >
              {generateReferralMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
              ) : (
                <Share2 className="w-4 h-4 ml-2" />
              )}
              ایجاد لینک دعوت
            </Button>
          </div>
        )}

        {/* Referral Benefits */}
        <div className="bg-telegram-surface-variant rounded-telegram p-4">
          <h4 className="font-medium text-telegram mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-telegram-success" />
            مزایای دعوت دوستان
          </h4>
          <ul className="space-y-2 text-sm text-telegram-text-secondary">
            <li className="flex items-center gap-2">
              <Star className="w-3 h-3 star-icon" />
              ۵۰ امتیاز برای هر دعوت موفق
            </li>
            <li className="flex items-center gap-2">
              <Award className="w-3 h-3 text-telegram-warning" />
              ارتقاء سطح دسترسی با جمع‌آوری امتیازات
            </li>
            <li className="flex items-center gap-2">
              <Users className="w-3 h-3 text-telegram-blue" />
              دسترسی به قرعه‌کشی‌های ویژه
            </li>
          </ul>
        </div>

        {/* Referred Users List */}
        {referralData?.referredUsers && referralData.referredUsers.length > 0 && (
          <div>
            <h4 className="font-medium text-telegram mb-3">دوستان دعوت شده</h4>
            <div className="space-y-2">
              {referralData.referredUsers.map((referredUser: any) => (
                <div key={referredUser.id} className="flex items-center justify-between py-2 px-3 bg-telegram-surface-variant rounded-telegram">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-telegram-blue rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {referredUser.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-telegram">
                        {referredUser.firstName} {referredUser.lastName}
                      </div>
                      <div className="text-xs text-telegram-text-secondary">
                        دعوت شده در {new Date(referredUser.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    +{referralData?.referralReward || 50} امتیاز
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}