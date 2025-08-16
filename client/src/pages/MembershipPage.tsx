import { useQuery } from "@tanstack/react-query";
import { MembershipCard } from "@/components/MembershipCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Star, Shield, RefreshCw } from "lucide-react";
import { useState } from "react";

interface MembershipPageProps {
  userId: string;
}

export function MembershipPage({ userId }: MembershipPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: channels, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/user/${userId}/available-channels`, refreshKey],
    enabled: !!userId,
  });

  const { data: memberships } = useQuery({
    queryKey: [`/api/user/${userId}/sponsor-memberships`, refreshKey],
    enabled: !!userId,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">خطا در بارگذاری</CardTitle>
            <CardDescription>
              خطا در دریافت اطلاعات کانال‌های اسپانسری
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} className="w-full">
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const channelsData = Array.isArray(channels) ? channels : [];
  const memberChannels = channelsData.filter((c: any) => c.isMember);
  const nonMemberChannels = channelsData.filter((c: any) => !c.isMember);
  const membershipData = Array.isArray(memberships) ? memberships : [];
  const totalPoints = membershipData.reduce((sum: number, m: any) => sum + (m.pointsEarned || 0), 0);
  const accessibleChannels = channelsData.filter((c: any) => c.botHasAccess);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">کانال‌های اسپانسری</h1>
          <p className="text-muted-foreground mt-1">
            با عضویت در کانال‌های اسپانسری امتیاز کسب کنید
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          بروزرسانی
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">کل کانال‌ها</p>
                <p className="text-2xl font-bold">{channelsData.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">عضو هستم</p>
                <p className="text-2xl font-bold">{memberChannels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">امتیاز کل</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">قابل بررسی</p>
                <p className="text-2xl font-bold">{accessibleChannels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Non-Member Channels */}
      {nonMemberChannels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">کانال‌های جدید</h2>
            <Badge variant="secondary">
              {nonMemberChannels.length} کانال
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nonMemberChannels.map((channel: any) => (
              <MembershipCard
                key={channel.id}
                channel={channel}
                userId={userId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Member Channels */}
      {memberChannels && memberChannels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">عضویت‌های من</h2>
            <Badge variant="default">
              {memberChannels.length} کانال
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberChannels.map((channel: any) => (
              <MembershipCard
                key={channel.id}
                channel={channel}
                userId={userId}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Channels Message */}
      {channelsData.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">هیچ کانال اسپانسری موجود نیست</h3>
            <p className="text-muted-foreground">
              در حال حاضر کانال اسپانسری برای عضویت وجود ندارد
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}