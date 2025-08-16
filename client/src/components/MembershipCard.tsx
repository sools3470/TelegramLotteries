import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MembershipCardProps {
  channel: {
    id: string;
    channelId: string;
    channelName: string;
    channelUrl: string;
    pointsReward: number;
    isSpecial: boolean;
    botHasAccess: boolean;
    membership?: {
      isMember: boolean;
      pointsEarned: number;
      joinedAt: string | null;
      leftAt: string | null;
      lastChecked: string;
    } | null;
    isMember: boolean;
  };
  userId: string;
}

export function MembershipCard({ channel, userId }: MembershipCardProps) {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkMembershipMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/user/${userId}/check-membership/${channel.channelId}`, "POST");
    },
    onSuccess: (data: any) => {
      if (data.pointsEarned > 0) {
        toast({
          title: "تبریک!",
          description: `عضویت شما تایید شد و ${data.pointsEarned} امتیاز دریافت کردید`,
        });
      } else if (data.isMember) {
        toast({
          title: "عضو هستید",
          description: "عضویت شما در این کانال تایید شد",
        });
      } else {
        toast({
          title: "عضو نیستید", 
          description: "لطفاً ابتدا در کانال عضو شوید",
          variant: "destructive",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/available-channels`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/sponsor-memberships`] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در بررسی عضویت",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsChecking(false);
    },
  });

  const handleCheckMembership = async () => {
    if (!channel.botHasAccess) {
      toast({
        title: "عدم دسترسی ربات",
        description: "ربات به این کانال دسترسی ندارد. لطفاً با ادمین تماس بگیرید",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    checkMembershipMutation.mutate();
  };

  const getMembershipStatus = () => {
    if (!channel.membership) {
      return { icon: Clock, text: "بررسی نشده", variant: "secondary" };
    }
    
    if (channel.membership.isMember) {
      return { icon: CheckCircle, text: "عضو", variant: "default" };
    } else {
      return { icon: XCircle, text: "عضو نیست", variant: "destructive" };
    }
  };

  const status = getMembershipStatus();
  const StatusIcon = status.icon;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{channel.channelName}</CardTitle>
          <div className="flex items-center gap-2">
            {channel.isSpecial && (
              <Badge variant="secondary" className="text-xs">
                ⭐ ویژه
              </Badge>
            )}
            <Badge variant={status.variant as any} className="flex items-center gap-1">
              <StatusIcon className="w-3 h-3" />
              {status.text}
            </Badge>
          </div>
        </div>
        <CardDescription>
          امتیاز عضویت: {channel.pointsReward} امتیاز
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Membership Details */}
        {channel.membership && (
          <div className="text-sm text-muted-foreground space-y-1">
            {channel.membership.joinedAt && (
              <div>تاریخ عضویت: {formatDate(channel.membership.joinedAt)}</div>
            )}
            {channel.membership.leftAt && (
              <div>تاریخ ترک: {formatDate(channel.membership.leftAt)}</div>
            )}
            <div>آخرین بررسی: {formatDate(channel.membership.lastChecked)}</div>
            {channel.membership.pointsEarned > 0 && (
              <div>امتیاز دریافتی: {channel.membership.pointsEarned}</div>
            )}
          </div>
        )}

        {/* Bot Access Warning */}
        {!channel.botHasAccess && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-700">
              ⚠️ ربات به این کانال دسترسی ندارد
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(channel.channelUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            مشاهده کانال
          </Button>

          <Button
            onClick={handleCheckMembership}
            disabled={isChecking || !channel.botHasAccess}
            size="sm"
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {isChecking ? "در حال بررسی..." : "بررسی عضویت"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}