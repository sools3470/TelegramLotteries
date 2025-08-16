import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Check, 
  X, 
  Clock, 
  Users, 
  Star, 
  Crown,
  Gift,
  AlertTriangle,
  Settings,
  Bot
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { BotConfigForm } from "@/components/bot-config-form";
import { type Raffle, type User } from "@shared/schema";

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const queryClient = useQueryClient();

  // Check if user is admin
  const isAdmin = currentUser?.userType === "bot_admin";

  // Get pending raffles
  const { data: pendingRaffles = [], isLoading: rafflesLoading } = useQuery({
    queryKey: ["/api/raffles", "pending"],
    queryFn: () => fetch("/api/raffles?status=pending").then(res => res.json()),
    enabled: isAdmin,
  });

  // Get all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users?type=regular").then(res => res.json()),
    enabled: isAdmin,
  });

  // Approve/reject raffle mutation
  const updateRaffleMutation = useMutation({
    mutationFn: async ({ raffleId, status, levelRequired }: { 
      raffleId: string; 
      status: string; 
      levelRequired?: number;
    }) => {
      const response = await fetch(`/api/raffles/${raffleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, levelRequired }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update raffle');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", "pending"] });
      setSelectedRaffle(null);
    },
  });

  const handleApproveRaffle = (raffleId: string, levelRequired: number = 1) => {
    updateRaffleMutation.mutate({ raffleId, status: "approved", levelRequired });
  };

  const handleRejectRaffle = (raffleId: string) => {
    updateRaffleMutation.mutate({ raffleId, status: "rejected" });
  };

  if (!currentUser || (currentUser as User).userType !== "bot_admin") {
    return (
      <div className="p-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            شما دسترسی مدیریت ندارید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Admin Header */}
      <Card className="telegram-card bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">پنل مدیریت</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">مدیریت قرعه‌کشی‌ها و کاربران</p>
            </div>
            <Badge className="bg-red-500 text-white">مدیر</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{(pendingRaffles as Raffle[]).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">در انتظار تایید</div>
          </CardContent>
        </Card>
        <Card className="telegram-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{(allUsers as User[]).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">کل کاربران</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Raffles */}
      <Card className="telegram-card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              قرعه‌کشی‌های در انتظار تایید
            </h3>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock size={12} />
              {(pendingRaffles as Raffle[]).length}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4">
          {rafflesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram"></div>
            </div>
          ) : (pendingRaffles as Raffle[]).length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              هیچ قرعه‌کشی در انتظار تایید وجود ندارد
            </div>
          ) : (
            <div className="space-y-4">
              {(pendingRaffles as Raffle[]).map((raffle: Raffle) => (
                <div key={raffle.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        Request #{raffle.requestNumber}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {raffle.prizeType === "stars" ? `${raffle.prizeValue || 0} ستاره` : 
                         raffle.prizeType === "premium" ? `${raffle.prizeValue || 0} ماه پریمیوم` : 
                         raffle.prizeType === "mixed" ? `${Math.floor((raffle.prizeValue || 0) / 2)} ستاره + ${Math.floor((raffle.prizeValue || 0) / 2)} ماه پریمیوم` :
                         `${raffle.prizeValue || 0} واحد`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {raffle.prizeType === "stars" ? (
                            <Star size={12} className="text-yellow-500" />
                          ) : raffle.prizeType === "premium" ? (
                            <Crown size={12} className="text-orange-500" />
                          ) : raffle.prizeType === "mixed" ? (
                            <div className="flex items-center gap-0.5">
                              <Star size={10} className="text-yellow-500" />
                              <Crown size={10} className="text-orange-500" />
                            </div>
                          ) : (
                            <Gift size={12} className="text-blue-500" />
                          )}
                          {raffle.prizeType === "stars" ? "استارز" : 
                           raffle.prizeType === "premium" ? "پریمیوم" : "ترکیبی"}
                        </span>
                        <span>{new Date(raffle.raffleDateTime).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      در انتظار تایید
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedRaffle(raffle)}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Eye size={14} />
                      بررسی جزئیات
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveRaffle(raffle.id)}
                      className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"
                    >
                      <Check size={14} />
                      تایید
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRejectRaffle(raffle.id)}
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <X size={14} />
                      رد
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="telegram-card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            مدیریت کاربران
          </h3>
        </div>
        
        <CardContent className="p-4">
          <div className="grid gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-between p-4 h-auto"
            >
              <div className="flex items-center gap-3">
                <Users className="text-telegram" />
                <div className="text-right">
                  <div className="font-medium">مشاهده همه کاربران</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(allUsers as User[]).length} کاربر ثبت‌نام شده
                  </div>
                </div>
              </div>
              <span className="text-gray-400">←</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center justify-between p-4 h-auto"
            >
              <div className="flex items-center gap-3">
                <Settings className="text-telegram" />
                <div className="text-right">
                  <div className="font-medium">تنظیمات سیستم</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    مدیریت کانال‌های اسپانسر و تنظیمات
                  </div>
                </div>
              </div>
              <span className="text-gray-400">←</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Raffle Details Modal */}
      {selectedRaffle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="telegram-card w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">جزئیات قرعه‌کشی</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRaffle(null)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">شماره درخواست</label>
                <p className="text-gray-800 dark:text-gray-200">#{selectedRaffle.requestNumber}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">توضیحات جایزه</label>
                <p className="text-gray-800 dark:text-gray-200">
                  {selectedRaffle.prizeType === "stars" ? `${selectedRaffle.prizeValue || 0} ستاره` : 
                   selectedRaffle.prizeType === "premium" ? `${selectedRaffle.prizeValue || 0} ماه پریمیوم` : 
                   selectedRaffle.prizeType === "mixed" ? `${Math.floor((selectedRaffle.prizeValue || 0) / 2)} ستاره + ${Math.floor((selectedRaffle.prizeValue || 0) / 2)} ماه پریمیوم` :
                   `${selectedRaffle.prizeValue || 0} واحد`}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">نوع جایزه</label>
                <p className="text-gray-800 dark:text-gray-200">
                  {selectedRaffle.prizeType === "stars" ? "استارز تلگرام" :
                   selectedRaffle.prizeType === "premium" ? "اشتراک پریمیوم" : "ترکیبی"}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">تاریخ قرعه‌کشی</label>
                <p className="text-gray-800 dark:text-gray-200">
                  {new Date(selectedRaffle.raffleDateTime).toLocaleDateString('fa-IR')}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">کانال‌های مورد نیاز</label>
                <div className="space-y-1">
                  {((selectedRaffle.requiredChannels as string[]) || []).map((channel: string, index: number) => (
                    <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      {channel}
                    </p>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleApproveRaffle(selectedRaffle.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  تایید
                </Button>
                <Button
                  onClick={() => handleRejectRaffle(selectedRaffle.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  رد
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
