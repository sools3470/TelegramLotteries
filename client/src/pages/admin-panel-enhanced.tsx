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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useEffect } from "react";
import {
  MessageCircle,
  Star,
  Users,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Shield,
  Settings,
  Calendar,
  Gift,
  AlertTriangle,
  Eye,
  TrendingUp,
  Award,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Crown,
  GripVertical,
  ArrowUp
} from "lucide-react";
import {
  DndContext, 
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { format } from "date-fns";

// Schema for level approval
const levelApprovalSchema = z.object({
  level: z.number().min(1).max(10),
  reason: z.string().optional()
});

// Schema for rejection with restriction
const rejectionSchema = z.object({
  reason: z.string().min(1, "دلیل رد الزامی است"),
  restrictionType: z.enum(["none", "temporary", "permanent"]),
  restrictionStart: z.string().optional(),
  restrictionEnd: z.string().optional()
});

// Schema for sponsor channel
const sponsorChannelSchema = z.object({
  channelId: z.string()
    .min(1, "شناسه کانال الزامی است")
    .refine((id) => {
      // Channel ID must start with @ and contain only 0-9, a-z, @, _ with minimum 5 chars after @
      if (!id.startsWith('@')) return false;
      const usernamePartLength = id.length - 1; // exclude @
      if (usernamePartLength < 5) return false;
      return /^@[0-9a-z_]+$/.test(id);
    }, "شناسه کانال باید با @ شروع شود، فقط شامل 0-9، a-z، _ باشد و حداقل 5 کاراکتر بعد از @ داشته باشد"),
  channelName: z.string().min(1, "نام کانال الزامی است"),
  channelUrl: z.string()
    .min(1, "آدرس کانال الزامی است")
    .refine((url) => {
      return url.startsWith('https://') || url.startsWith('http://');
    }, "آدرس کانال باید با https:// یا http:// شروع شود"),
  description: z.string().optional(),
  pointsReward: z.number().min(1, "امتیاز باید حداقل 1 باشد"),
  isSpecial: z.boolean().default(false)
});

// Schema for admin creation
const adminSchema = z.object({
  telegramId: z.string().min(1, "شناسه تلگرام الزامی است"),
  adminLevel: z.enum(["1", "2"]).transform(val => parseInt(val))
});

type LevelApprovalData = z.infer<typeof levelApprovalSchema>;
type RejectionData = z.infer<typeof rejectionSchema>;
type SponsorChannelData = z.infer<typeof sponsorChannelSchema>;
type AdminData = z.infer<typeof adminSchema>;

// Sortable Channel Item Component
function SortableChannelItem({ 
  channel, 
  onEdit, 
  onDelete, 
  isDeleting 
}: { 
  channel: any, 
  onEdit: (channel: any) => void,
  onDelete: (id: string) => void,
  isDeleting: boolean 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: channel.id.toString() // Ensure ID is string for @dnd-kit
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`${isDragging ? 'shadow-lg' : ''}`}
    >
      <Card className={`telegram-card border border-telegram-border hover:border-telegram-blue transition-colors ${
        isDragging ? 'border-telegram-blue scale-105' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Drag Handle - Fixed positioning and styling */}
              <button 
                type="button"
                {...attributes} 
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2 rounded-md hover:bg-telegram-bg-secondary transition-all flex-shrink-0 mt-1 touch-none select-none border border-telegram-border"
                style={{ touchAction: 'none' }}
              >
                <GripVertical className="w-4 h-4 text-telegram-text-secondary" />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-telegram truncate">{channel.channelName}</h4>
                  {channel.isSpecial && (
                    <Badge variant="destructive" className="text-xs flex-shrink-0">
                      ویژه
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-telegram-blue hover:underline break-all">
                  <a href={channel.channelUrl} target="_blank" rel="noopener noreferrer">
                    {channel.channelUrl}
                  </a>
                </p>
                {channel.description && (
                  <p className="text-sm text-telegram-text-secondary mt-1 break-words">{channel.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-telegram-warning text-white text-xs">
                    <Award className="w-3 h-3 ml-1" />
                    {channel.pointsReward} امتیاز
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ترتیب: {channel.displayOrder}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(channel)}
                className="text-xs"
              >
                <Edit className="w-3 h-3 ml-1" />
                ویرایش
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(channel.id)}
                disabled={isDeleting}
                className="text-xs"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 ml-1" />
                    حذف
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// RafflesList Component
function RafflesList({ 
  status, 
  onApprove, 
  onReject,
  onDeleteRaffle,
  onBulkDelete,
  adminLevel,
  setSelectedRaffle,
  setShowReviewDialog
}: { 
  status: string,
  onApprove?: (raffle: any) => void,
  onReject?: (raffle: any) => void,
  onDeleteRaffle?: (raffleId: string) => void,
  onBulkDelete?: () => void,
  adminLevel?: number | null,
  setSelectedRaffle?: (raffle: any) => void,
  setShowReviewDialog?: (show: boolean) => void
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if user can delete (not level 2 admin)
  const canDelete = adminLevel !== 2;
  
  // Check if any operations are available for current status
  const hasOperations = status === 'pending' || (canDelete && (status === 'approved' || status === 'rejected'));
  
  // Get raffles by status
  const { data: raffles = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/raffles', status],
    queryFn: async () => {
      const response = await fetch(`/api/raffles?status=${status}&userId=${user?.id}&userRole=bot_admin&_t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch raffles');
      return await response.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 0, // Don't cache the data (replaces cacheTime in v5)
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    refetchIntervalInBackground: true
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="status-badge-pending"><Clock className="w-3 h-3 ml-1" />در انتظار</Badge>;
      case 'approved':
        return <Badge className="status-badge-approved"><CheckCircle className="w-3 h-3 ml-1" />تأیید شده</Badge>;
      case 'rejected':
        return <Badge className="status-badge-rejected"><XCircle className="w-3 h-3 ml-1" />رد شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram-blue"></div>
      </div>
    );
  }

  if (raffles.length === 0) {
    const emptyMessages = {
      pending: "درخواست‌ی برای بررسی وجود ندارد",
      approved: "آگهی تایید شده‌ای وجود ندارد", 
      rejected: "آگهی رد شده‌ای وجود ندارد"
    };
    
    return (
      <div className="text-center py-8">
        <Gift className="w-12 h-12 text-telegram-text-secondary mx-auto mb-4" />
        <p className="text-telegram-text-secondary">
          {emptyMessages[status as keyof typeof emptyMessages] || "آگهی‌ای وجود ندارد"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Delete Button for approved/rejected tabs - Only for admins who can delete */}
      {canDelete && (status === 'approved' || status === 'rejected') && raffles.length > 0 && onBulkDelete && (
        <div className="flex justify-end">
          <Button
            onClick={onBulkDelete}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            حذف همه آگهی‌های {status === 'approved' ? 'تایید شده' : 'رد شده'}
          </Button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table className="table-modern">
          <TableHeader>
          <TableRow>
            <TableHead>درخواست</TableHead>
            <TableHead>ارسال‌کننده</TableHead>
            <TableHead>سطح‌کاربر</TableHead>
            <TableHead>وضعیت</TableHead>
            {hasOperations && <TableHead>عملیات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {raffles.map((raffle: any) => (
            <TableRow key={raffle.id}>
              <TableCell className="font-medium">{raffle.requestNumber}</TableCell>
              <TableCell>{raffle.submitter?.telegramId || 'نامشخص'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-telegram-primary" />
                  <span>سطح {raffle.submitter?.level || 1}</span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(raffle.status)}</TableCell>
              {hasOperations && (
                <TableCell>
                  <div className="flex gap-2">
                    {status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => {
                          setSelectedRaffle?.(raffle);
                          setShowReviewDialog?.(true);
                        }}
                      >
                        <Settings className="w-4 h-4 ml-1" />
                        بررسی
                      </Button>
                    )}
                    {canDelete && (status === 'approved' || status === 'rejected') && onDeleteRaffle && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteRaffle(raffle.id)}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function AdminPanelEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("raffles");
  const [raffleFilter, setRaffleFilter] = useState("pending");
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [rejectionReason, setRejectionReason] = useState("");
  const [restrictionType, setRestrictionType] = useState<"none" | "temporary" | "permanent">("none");
  const [restrictionEnd, setRestrictionEnd] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [deleteRaffleId, setDeleteRaffleId] = useState<string>("");
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState<string>("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Scroll to top function
  const scrollToTop = () => {
    try {
      // Find the main scrollable container
      const mainContainer = document.querySelector('.main-content') || 
                           document.querySelector('[data-radix-tabs-content]') ||
                           document.querySelector('.app-container');
      if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Fallback to window scroll
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Scroll to top error:', error);
    }
  };

  // Scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      // Check scroll on the main container
      const mainContainer = document.querySelector('.main-content') || 
                           document.querySelector('[data-radix-tabs-content]') ||
                           document.querySelector('.app-container');
      let scrollY = 0;
      
      if (mainContainer) {
        scrollY = mainContainer.scrollTop;
      } else {
        scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      }
      
      const scrollThreshold = 1;
      const shouldShow = scrollY > scrollThreshold;
      
      console.log('Admin scroll debug:', {
        mainContainer: !!mainContainer,
        scrollY,
        scrollThreshold,
        shouldShow,
        currentShowState: showScrollToTop
      });
      
      setShowScrollToTop(shouldShow);
    };

    // Add scroll listener to the main container
    const mainContainer = document.querySelector('.main-content') || 
                         document.querySelector('[data-radix-tabs-content]') ||
                         document.querySelector('.app-container');
    if (mainContainer) {
      mainContainer.addEventListener('scroll', handleScroll, { passive: true });
      console.log('Admin: Added scroll listener to main container');
      return () => mainContainer.removeEventListener('scroll', handleScroll);
    } else {
      // Fallback to document scroll
      document.addEventListener('scroll', handleScroll, { passive: true });
      console.log('Admin: Added scroll listener to document');
      return () => document.removeEventListener('scroll', handleScroll);
    }
  }, [showScrollToTop]);

  // Forms
  const levelApprovalForm = useForm<LevelApprovalData>({
    resolver: zodResolver(levelApprovalSchema),
    defaultValues: { level: 1 }
  });

  const rejectionForm = useForm<RejectionData>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { 
      restrictionType: "none"
    }
  });

  const sponsorChannelForm = useForm<SponsorChannelData>({
    resolver: zodResolver(sponsorChannelSchema),
    defaultValues: {
      isSpecial: false
    }
  });

  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const adminForm = useForm<AdminData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {}
  });

  // Drag and drop sensors and handlers
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Require a minimum of 5px movement to start dragging
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Add delay for touch to prevent accidental drags
        tolerance: 5,
      },
    })
  );

  // Handle drag start for debugging
  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag started:', event);
  };

  // Handle drag end for sponsor channels reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag ended:', { active: active?.id, over: over?.id });

    if (!over || active.id === over.id) {
      console.log('Drag cancelled or same position');
      return;
    }

    // Convert IDs to strings for comparison
    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeIndex = sponsorChannels.findIndex((item: any) => item.id.toString() === activeId);
    const overIndex = sponsorChannels.findIndex((item: any) => item.id.toString() === overId);

    console.log('Found indexes:', { activeIndex, overIndex, activeId, overId });

    if (activeIndex !== -1 && overIndex !== -1) {
      // Create reordered array
      const reorderedChannels = arrayMove(sponsorChannels, activeIndex, overIndex);
      
      // Create new order mapping based on displayOrder DESC (higher numbers first)
      const channelOrders = reorderedChannels.map((channel: any, index: number) => ({
        id: channel.id,
        displayOrder: reorderedChannels.length - index // Higher displayOrder for items at the top
      }));

      console.log('Applying reorder:', channelOrders);
      // Apply the reordering
      reorderSponsorChannelsMutation.mutate(channelOrders);
    }
  };

  // Get pending raffles for review
  const { data: pendingRaffles = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['/api/raffles', 'pending'],
    queryFn: async () => {
      const response = await fetch('/api/raffles?status=pending');
      if (!response.ok) throw new Error('Failed to fetch pending raffles');
      return await response.json();
    }
  });

  // Get sponsor channels
  const { data: sponsorChannels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['/api/sponsor-channels'],
    queryFn: async () => {
      const response = await fetch('/api/sponsor-channels');
      if (!response.ok) throw new Error('Failed to fetch sponsor channels');
      return await response.json();
    }
  });

  // Get admins list
  const { data: admins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['/api/admin/users', 'bot_admin'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users?type=bot_admin&_t=' + Date.now(), {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch admins');
      return await response.json();
    },
    enabled: user?.userType === "bot_admin" && (user?.adminLevel === 0 || user?.adminLevel === 1),
    refetchInterval: false,
    staleTime: Infinity // Don't refetch automatically
  });

  // Approve raffle mutation
  const approveRaffleMutation = useMutation({
    mutationFn: async (data: { raffleId: string; level: number; reason?: string }) => {
      const response = await fetch(`/api/raffles/${data.raffleId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          levelRequired: data.level,
          adminUserId: user?.id,
          reason: data.reason
        })
      });
      if (!response.ok) throw new Error('Failed to approve raffle');
      return await response.json();
    },
    onSuccess: () => {
      // Force complete cache invalidation
      queryClient.clear();
      queryClient.invalidateQueries();
      setShowReviewDialog(false);
      setIsApprovalDialogOpen(false);
      setSelectedRaffle(null);
      setSelectedAction(null);
      levelApprovalForm.reset();
      toast({
        title: "موفقیت",
        description: "قرعه‌کشی با موفقیت تأیید شد"
      });
    }
  });

  // Reject raffle mutation
  const rejectRaffleMutation = useMutation({
    mutationFn: async (data: { raffleId: string } & RejectionData) => {
      const restriction = data.restrictionType !== "none" ? {
        type: data.restrictionType,
        start: data.restrictionStart,
        end: data.restrictionEnd
      } : null;

      const response = await fetch(`/api/raffles/${data.raffleId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          reason: data.reason,
          restriction,
          adminUserId: user?.id
        })
      });
      if (!response.ok) throw new Error('Failed to reject raffle');
      return await response.json();
    },
    onSuccess: () => {
      // Force complete cache invalidation
      queryClient.clear();
      queryClient.invalidateQueries();
      setShowReviewDialog(false);
      setIsRejectDialogOpen(false);
      setSelectedRaffle(null);
      setSelectedAction(null);
      rejectionForm.reset();
      toast({
        title: "موفقیت",
        description: "قرعه‌کشی رد شد و اطلاعات به کاربر ارسال شد"
      });
    }
  });

  // Create sponsor channel mutation
  const createSponsorChannelMutation = useMutation({
    mutationFn: async (data: SponsorChannelData) => {
      console.log("Sending sponsor channel data:", data);
      const response = await fetch('/api/sponsor-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Sponsor channel creation failed:", errorData);
        throw new Error(errorData.error || 'Failed to create sponsor channel');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-channels'] });
      sponsorChannelForm.reset();
      toast({
        title: "موفقیت",
        description: "کانال اسپانسری با موفقیت اضافه شد"
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: `خطا در ایجاد کانال اسپانسری: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete sponsor channel mutation
  const deleteSponsorChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/sponsor-channels/${channelId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete sponsor channel');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-channels'] });
      toast({
        title: "موفقیت",
        description: "کانال اسپانسری با موفقیت حذف شد"
      });
    }
  });

  // Reorder sponsor channels mutation
  const reorderSponsorChannelsMutation = useMutation({
    mutationFn: async (channelOrders: { id: string; displayOrder: number }[]) => {
      const response = await fetch('/api/sponsor-channels-reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelOrders })
      });
      if (!response.ok) throw new Error('Failed to reorder sponsor channels');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-channels'] });
      toast({
        title: "موفقیت",
        description: "ترتیب کانال‌های اسپانسری با موفقیت به‌روزرسانی شد"
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: `خطا در تغییر ترتیب: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (data: AdminData) => {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: data.telegramId,
          userType: 'bot_admin', // همه مدیران bot_admin هستند، تفاوت در adminLevel است
          adminLevel: data.adminLevel
        })
      });
      if (!response.ok) throw new Error('Failed to create admin');
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate admin queries to refresh the list without page reload
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', 'bot_admin'] });
      adminForm.reset();
      toast({
        title: "موفقیت",
        description: "مدیر جدید با موفقیت اضافه شد"
      });
    }
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (telegramId: string) => {
      const response = await fetch(`/api/admins/${telegramId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove admin');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Immediately invalidate and refetch admin list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', 'bot_admin'] });
      toast({
        title: "موفقیت",
        description: "مدیر با موفقیت برکنار شد و به کاربر عادی تبدیل شد"
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: `خطا در برکناری مدیر: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete individual raffle mutation
  const deleteRaffleMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await fetch(`/api/raffles/${raffleId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete raffle');
      return await response.json();
    },
    onSuccess: () => {
      // Force complete cache invalidation and immediate refetch
      queryClient.clear(); // Clear all cache
      queryClient.invalidateQueries(); // Invalidate all queries
      toast({
        title: "موفقیت",
        description: "آگهی با موفقیت حذف شد"
      });
    }
  });

  // Bulk delete mutation  
  const bulkDeleteMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/raffles/bulk-delete?status=${status}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to bulk delete raffles');
      return await response.json();
    },
    onSuccess: (data, status) => {
      // Force complete cache invalidation and immediate refetch
      queryClient.clear(); // Clear all cache
      queryClient.invalidateQueries(); // Invalidate all queries
      toast({
        title: "موفقیت", 
        description: `${data.deletedCount || 0} آگهی ${status === 'approved' ? 'تایید شده' : 'رد شده'} با موفقیت حذف شدند`
      });
    }
  });

  // Handler functions for buttons
  const handleApproveRaffle = (raffle: any) => {
    setSelectedRaffle(raffle);
    setIsApprovalDialogOpen(true);
  };

  const handleRejectRaffle = (raffle: any) => {
    setSelectedRaffle(raffle);
    setIsRejectDialogOpen(true);
  };

  const onLevelApprovalSubmit = (data: LevelApprovalData) => {
    if (!selectedRaffle) return;
    approveRaffleMutation.mutate({
      raffleId: selectedRaffle.id,
      level: data.level,
      reason: data.reason
    });
  };

  const onRejectionSubmit = (data: RejectionData) => {
    if (!selectedRaffle) return;
    rejectRaffleMutation.mutate({
      raffleId: selectedRaffle.id,
      ...data
    });
  };

  const onSponsorChannelSubmit = (data: SponsorChannelData) => {
    createSponsorChannelMutation.mutate(data);
  };

  const onAdminSubmit = (data: AdminData) => {
    createAdminMutation.mutate(data);
  };

  const handleDeleteRaffle = (raffleId: string) => {
    setDeleteRaffleId(raffleId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRaffle = () => {
    if (deleteRaffleId) {
      deleteRaffleMutation.mutate(deleteRaffleId);
      setIsDeleteDialogOpen(false);
      setDeleteRaffleId("");
    }
  };

  const handleBulkDelete = (status: string) => {
    setBulkDeleteStatus(status);
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    if (bulkDeleteStatus) {
      bulkDeleteMutation.mutate(bulkDeleteStatus);
      setIsBulkDeleteDialogOpen(false);
      setBulkDeleteStatus("");
    }
  };

  const handleEditChannel = (channel: any) => {
    setEditingChannel(channel);
    sponsorChannelForm.reset({
      channelId: channel.channelId,
      channelName: channel.channelName,
      channelUrl: channel.channelUrl,
      description: channel.description || "",
      pointsReward: channel.pointsReward,
      isSpecial: channel.isSpecial
    });
    setEditDialogOpen(true);
  };

  // Update channel mutation
  const updateSponsorChannelMutation = useMutation({
    mutationFn: async (data: { id: string, updates: any }) => {
      const response = await fetch(`/api/sponsor-channels/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("خطا در به‌روزرسانی کانال");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-channels"] });
      setEditDialogOpen(false);
      setEditingChannel(null);
      sponsorChannelForm.reset();
      toast({
        title: "موفق",
        description: "کانال اسپانسری با موفقیت به‌روزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی کانال اسپانسری",
        variant: "destructive",
      });
    },
  });

  const onEditSubmit = (data: SponsorChannelData) => {
    if (editingChannel) {
      updateSponsorChannelMutation.mutate({
        id: editingChannel.id,
        updates: data
      });
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="status-badge-pending"><Clock className="w-3 h-3 ml-1" />در انتظار</Badge>;
      case 'approved':
        return <Badge className="status-badge-approved"><CheckCircle className="w-3 h-3 ml-1" />تأیید شده</Badge>;
      case 'rejected':
        return <Badge className="status-badge-rejected"><XCircle className="w-3 h-3 ml-1" />رد شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get admin level from user data
  const adminLevel = user?.adminLevel ?? null;
  const isKing = adminLevel === 0;
  const isLevel1Admin = adminLevel === 1;
  const isLevel2Admin = adminLevel === 2;

  if (!user || user.userType !== "bot_admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardContent className="text-center">
            <AlertTriangle className="w-12 h-12 text-telegram-warning mx-auto mb-4" />
            <p className="text-telegram-text-secondary">شما دسترسی مدیریت ندارید</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Debug Panel - for admin */}
      <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs z-[9999]">
        <div>showScrollToTop: {showScrollToTop.toString()}</div>
        <div>userType: {user?.userType}</div>
        <div>adminLevel: {user?.adminLevel}</div>
        <div>activeTab: {activeTab}</div>
      </div>

      <div className="main-content p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-6 ${
            isKing ? 'grid-cols-4' : 
            isLevel1Admin ? 'grid-cols-3' : 
            'grid-cols-2'
          }`}>
            <TabsTrigger value="raffles" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              آگهی‌ها
            </TabsTrigger>
            {(isKing || isLevel1Admin) && (
              <TabsTrigger value="sponsors" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                اسپانسری
              </TabsTrigger>
            )}
            {isKing && (
              <TabsTrigger value="admins" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <Users className="w-4 h-4" />
                مدیران
              </TabsTrigger>
            )}
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              پروفایل
            </TabsTrigger>
          </TabsList>

          {/* Raffles Management Tab */}
          <TabsContent value="raffles" className="space-y-6 animate-fade-in">
            <Card className="telegram-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-telegram-blue" />
                  مدیریت آگهی‌های قرعه‌کشی
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filter Tabs */}
                <div className="mb-6">
                  <Tabs value={raffleFilter} onValueChange={setRaffleFilter} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-transparent rounded-lg p-2 gap-2">
                      <TabsTrigger value="pending" className="raffle-tab raffle-tab-pending">
                        <Clock className="w-4 h-4 ml-1" />
                        در انتظار بررسی
                      </TabsTrigger>
                      <TabsTrigger value="rejected" className="raffle-tab raffle-tab-rejected">
                        <XCircle className="w-4 h-4 ml-1" />
                        رد شده‌ها
                      </TabsTrigger>
                      <TabsTrigger value="approved" className="raffle-tab raffle-tab-approved">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        تایید شده‌ها
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Raffles List Based on Filter */}
                <RafflesList 
                  status={raffleFilter} 
                  onApprove={handleApproveRaffle}
                  onReject={handleRejectRaffle}
                  onDeleteRaffle={isLevel2Admin ? undefined : handleDeleteRaffle}
                  onBulkDelete={isLevel2Admin ? undefined : () => handleBulkDelete(raffleFilter)}
                  adminLevel={adminLevel}
                  setSelectedRaffle={setSelectedRaffle}
                  setShowReviewDialog={setShowReviewDialog}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sponsor Channels Tab - Only for King and Level 1 Admins */}
          {(isKing || isLevel1Admin) && (
            <TabsContent value="sponsors" className="space-y-6 animate-fade-in">
            <Card className="telegram-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-telegram-warning" />
                  مدیریت کانال‌های اسپانسری
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...sponsorChannelForm}>
                  <form onSubmit={sponsorChannelForm.handleSubmit(onSponsorChannelSubmit)} className="form-modern space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={sponsorChannelForm.control}
                        name="channelId"
                        render={({ field }) => (
                          <FormItem className="form-field">
                            <FormLabel className="form-label">شناسه کانال</FormLabel>
                            <FormControl>
                              <Input {...field} className="form-input" placeholder="@channel_name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sponsorChannelForm.control}
                        name="channelName"
                        render={({ field }) => (
                          <FormItem className="form-field">
                            <FormLabel className="form-label">نام کانال</FormLabel>
                            <FormControl>
                              <Input {...field} className="form-input" placeholder="نام کانال" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sponsorChannelForm.control}
                        name="channelUrl"
                        render={({ field }) => (
                          <FormItem className="form-field">
                            <FormLabel className="form-label">آدرس کانال</FormLabel>
                            <FormControl>
                              <Input {...field} className="form-input" placeholder="https://t.me/channel_name یا http://..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={sponsorChannelForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="form-field">
                          <FormLabel className="form-label">توضیحات</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="form-input" placeholder="توضیحات کانال" rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sponsorChannelForm.control}
                      name="pointsReward"
                      render={({ field }) => (
                        <FormItem className="form-field">
                          <FormLabel className="form-label">امتیاز عضویت</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              className="form-input"
                              placeholder="امتیازی که کاربر دریافت می‌کند"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={sponsorChannelForm.control}
                      name="isSpecial"
                      render={({ field }) => (
                        <FormItem className="form-field flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="form-label">کانال ویژه</FormLabel>
                            <FormDescription>
                              کانال‌های ویژه با برچسب قرمز نمایش داده می‌شوند
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={createSponsorChannelMutation.isPending}
                      className="w-full bg-telegram-blue hover:bg-telegram-blue-dark"
                    >
                      {createSponsorChannelMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      ) : (
                        <Plus className="w-4 h-4 ml-2" />
                      )}
                      افزودن کانال اسپانسری
                    </Button>
                  </form>
                </Form>

                {/* Existing Sponsor Channels with Drag and Drop */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-telegram">کانال‌های اسپانسری موجود</h3>
                    <Badge variant="outline" className="text-xs">
                      <GripVertical className="w-3 h-3 ml-1" />
                      قابل مرتب‌سازی
                    </Badge>
                  </div>
                  
                  {channelsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-telegram-blue"></div>
                    </div>
                  ) : sponsorChannels.length === 0 ? (
                    <p className="text-telegram-text-secondary text-center py-4">کانال اسپانسری‌ای وجود ندارد</p>
                  ) : (
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={sponsorChannels.map((channel: any) => channel.id.toString())}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {sponsorChannels.map((channel: any) => (
                            <SortableChannelItem
                              key={channel.id}
                              channel={channel}
                              onEdit={handleEditChannel}
                              onDelete={(id) => deleteSponsorChannelMutation.mutate(id)}
                              isDeleting={deleteSponsorChannelMutation.isPending}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                {/* Edit Channel Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>ویرایش کانال اسپانسری</DialogTitle>
                      <DialogDescription>
                        تغییرات مورد نظر را اعمال کنید
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...sponsorChannelForm}>
                      <form onSubmit={sponsorChannelForm.handleSubmit(onEditSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={sponsorChannelForm.control}
                            name="channelId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>شناسه کانال</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="@channel_name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={sponsorChannelForm.control}
                            name="channelName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نام کانال</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="نام کانال" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={sponsorChannelForm.control}
                            name="channelUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>آدرس کانال</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="https://t.me/channel_name یا http://..." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={sponsorChannelForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>توضیحات</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="توضیحات کانال" rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={sponsorChannelForm.control}
                          name="pointsReward"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>امتیاز عضویت</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                  placeholder="امتیاز"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={sponsorChannelForm.control}
                          name="isSpecial"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>کانال ویژه</FormLabel>
                                <FormDescription>
                                  کانال‌های ویژه با برچسب قرمز نمایش داده می‌شوند
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setEditDialogOpen(false)}
                          >
                            انصراف
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateSponsorChannelMutation.isPending}
                            className="bg-telegram-blue hover:bg-telegram-blue-dark"
                          >
                            {updateSponsorChannelMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                            ) : null}
                            ذخیره تغییرات
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Admins Management Tab - Only for King */}
          {isKing && (
            <TabsContent value="admins" className="space-y-6 animate-fade-in">
            {isKing ? (
              <Card className="telegram-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-telegram-blue" />
                    مدیریت مدیران
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...adminForm}>
                    <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="form-modern space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={adminForm.control}
                          name="telegramId"
                          render={({ field }) => (
                            <FormItem className="form-field">
                              <FormLabel className="form-label">شناسه تلگرام</FormLabel>
                              <FormControl>
                                <Input {...field} className="form-input" placeholder="123456789" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={adminForm.control}
                          name="adminLevel"
                          render={({ field }) => (
                            <FormItem className="form-field">
                              <FormLabel className="form-label">سطح دسترسی</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="form-input">
                                    <SelectValue placeholder="انتخاب سطح دسترسی" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">Level 1 (مدیر اصلی)</SelectItem>
                                  <SelectItem value="2">Level 2 (مدیر محدود)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={createAdminMutation.isPending}
                        className="w-full bg-telegram-blue hover:bg-telegram-blue-dark"
                      >
                        {createAdminMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        ) : (
                          <UserCheck className="w-4 h-4 ml-2" />
                        )}
                        افزودن مدیر جدید
                      </Button>
                    </form>
                  </Form>

                  {/* Existing Admins List */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-telegram">مدیران موجود</h3>
                    {adminsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-telegram-blue"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table className="table-modern">
                          <TableHeader>
                            <TableRow>
                              <TableHead>نام</TableHead>
                              <TableHead>شناسه تلگرام</TableHead>
                              <TableHead>سطح دسترسی</TableHead>
                              <TableHead>تاریخ ایجاد</TableHead>
                              <TableHead>عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {admins.map((admin: any) => (
                              <TableRow key={admin.id}>
                                <TableCell className="font-medium">
                                  {admin.firstName} {admin.lastName}
                                </TableCell>
                                <TableCell>{admin.telegramId}</TableCell>
                                <TableCell>
                                  <Badge variant={admin.adminLevel === 0 ? "destructive" : admin.adminLevel === 1 ? "default" : "secondary"}>
                                    {admin.adminLevel === 0 && <Crown className="w-3 h-3 ml-1" />}
                                    {admin.adminLevel === 0 ? "👑 King" : admin.adminLevel === 1 ? "مدیر سطح 1" : "مدیر سطح 2"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {admin.createdAt ? format(new Date(admin.createdAt), 'yyyy/MM/dd') : 'نامشخص'}
                                </TableCell>
                                <TableCell>
                                  {admin.telegramId !== user.telegramId && (
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      onClick={() => removeAdminMutation.mutate(admin.telegramId)}
                                      disabled={removeAdminMutation.isPending}
                                    >
                                      {removeAdminMutation.isPending ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <Trash2 className="w-4 h-4 ml-1" />
                                      )}
                                      برکناری
                                    </Button>
                                  )}
                                  {admin.telegramId === user.telegramId && (
                                    <Badge variant="outline">مدیر اصلی</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="telegram-card">
                <CardContent className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-telegram-warning mx-auto mb-4" />
                  <p className="text-telegram-text-secondary">شما دسترسی مدیریت مدیران ندارید</p>
                  <p className="text-sm text-telegram-text-secondary mt-2">فقط مدیران سطح 1 می‌توانند مدیران جدید اضافه کنند</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 animate-fade-in">
            <Card className="telegram-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-telegram-blue" />
                  پروفایل مدیر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-telegram-text-secondary">نام</Label>
                    <p className="text-telegram font-medium">{user.firstName} {user.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-telegram-text-secondary">شناسه تلگرام</Label>
                    <p className="text-telegram font-medium">{user.telegramId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-telegram-text-secondary">سطح دسترسی</Label>
                    <Badge variant={isKing ? "destructive" : isLevel1Admin ? "default" : "secondary"}>
                      {isKing && <Crown className="w-3 h-3 ml-1" />}
                      {isKing ? "👑 King Admin" : isLevel1Admin ? "مدیر سطح 1" : "مدیر سطح 2"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-telegram-text-secondary">تاریخ ایجاد</Label>
                    <p className="text-telegram font-medium">
                      {user.createdAt ? format(new Date(user.createdAt), 'yyyy/MM/dd') : 'نامشخص'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Dialog - Combined Approval/Rejection */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>بررسی درخواست قرعه‌کشی</DialogTitle>
              <DialogDescription>
                <div className="space-y-1">
                  <div>درخواست شماره: {selectedRaffle?.requestNumber}</div>
                  <div>ارسال‌کننده: {selectedRaffle?.submitter?.telegramId || 'نامشخص'}</div>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            {selectedRaffle && (
              <div className="space-y-6">
                {/* Raffle Information */}
                <div className="bg-telegram-bg-secondary dark:bg-telegram-bg-dark border border-telegram-border dark:border-telegram-border-dark p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-telegram dark:text-telegram-dark">اطلاعات درخواست:</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedRaffle.prizeType === 'stars' && <Star className="w-4 h-4 star-icon" />}
                    {selectedRaffle.prizeType === 'premium' && <Crown className="w-4 h-4 text-telegram-warning" />}
                    {selectedRaffle.prizeType === 'mixed' && <Crown className="w-4 h-4 text-purple-500" />}
                    <span className="font-medium text-telegram dark:text-telegram-dark">
                      {selectedRaffle.prizeType === 'stars' && `${selectedRaffle.prizeValue} ستاره`}
                      {selectedRaffle.prizeType === 'premium' && `${selectedRaffle.prizeValue} ماه پرمیوم`}
                      {selectedRaffle.prizeType === 'mixed' && `${selectedRaffle.prizeValue} ستاره + پرمیوم`}
                    </span>
                  </div>

                </div>

                {/* Action Selection */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      className={`flex-1 ${selectedAction === 'approve' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                      onClick={() => setSelectedAction('approve')}
                    >
                      <CheckCircle className="w-4 h-4 ml-1" />
                      تأیید
                    </Button>
                    <Button
                      type="button"
                      className={`flex-1 ${selectedAction === 'reject' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
                      onClick={() => setSelectedAction('reject')}
                    >
                      <XCircle className="w-4 h-4 ml-1" />
                      رد
                    </Button>
                  </div>

                  {/* Approval Form */}
                  {selectedAction === 'approve' && (
                    <Form {...levelApprovalForm}>
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-medium text-green-700">تنظیمات تأیید:</h3>
                        <FormField
                          control={levelApprovalForm.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>سطح مورد نیاز</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="انتخاب سطح" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[...Array(10)].map((_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      سطح {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={levelApprovalForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>دلیل انتخاب سطح (اختیاری)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="توضیحات..." rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  )}

                  {/* Rejection Form */}
                  {selectedAction === 'reject' && (
                    <Form {...rejectionForm}>
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-medium text-red-700">تنظیمات رد:</h3>
                        <FormField
                          control={rejectionForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>دلیل رد (الزامی)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="دلیل رد قرعه‌کشی..." rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={rejectionForm.control}
                          name="restrictionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع محدودسازی</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="انتخاب نوع محدودسازی" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">بدون محدودسازی</SelectItem>
                                  <SelectItem value="temporary">محدودسازی موقت</SelectItem>
                                  <SelectItem value="permanent">مسدودسازی دائم</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {rejectionForm.watch("restrictionType") === "temporary" && (
                          <>
                            <FormField
                              control={rejectionForm.control}
                              name="restrictionStart"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>تاریخ شروع محدودسازی</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="datetime-local" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={rejectionForm.control}
                              name="restrictionEnd"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>تاریخ پایان محدودسازی</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="datetime-local" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </Form>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowReviewDialog(false);
                      setSelectedAction(null);
                    }}
                    className="flex-1"
                  >
                    لغو
                  </Button>
                  {selectedAction === 'approve' && (
                    <Button
                      onClick={levelApprovalForm.handleSubmit(onLevelApprovalSubmit)}
                      disabled={approveRaffleMutation.isPending}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      {approveRaffleMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4 ml-2" />
                      )}
                      تأیید نهایی
                    </Button>
                  )}
                  {selectedAction === 'reject' && (
                    <Button
                      onClick={rejectionForm.handleSubmit(onRejectionSubmit)}
                      disabled={rejectRaffleMutation.isPending}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      {rejectRaffleMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      ) : (
                        <XCircle className="w-4 h-4 ml-2" />
                      )}
                      رد نهایی
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأیید قرعه‌کشی</DialogTitle>
              <DialogDescription>
                لطفاً سطح دسترسی مورد نیاز برای مشاهده این قرعه‌کشی را مشخص کنید
              </DialogDescription>
            </DialogHeader>
            <Form {...levelApprovalForm}>
              <form onSubmit={levelApprovalForm.handleSubmit(onLevelApprovalSubmit)} className="space-y-4">
                <FormField
                  control={levelApprovalForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سطح مورد نیاز</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب سطح" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              سطح {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={levelApprovalForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دلیل انتخاب سطح (اختیاری)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="توضیحات..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                    لغو
                  </Button>
                  <Button type="submit" disabled={approveRaffleMutation.isPending}>
                    {approveRaffleMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4 ml-2" />
                    )}
                    تأیید
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رد قرعه‌کشی</DialogTitle>
              <DialogDescription>
                لطفاً دلیل رد و نوع محدودسازی را مشخص کنید
              </DialogDescription>
            </DialogHeader>
            <Form {...rejectionForm}>
              <form onSubmit={rejectionForm.handleSubmit(onRejectionSubmit)} className="space-y-4">
                <FormField
                  control={rejectionForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دلیل رد (الزامی)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="دلیل رد قرعه‌کشی..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rejectionForm.control}
                  name="restrictionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع محدودسازی</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب نوع محدودسازی" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">بدون محدودسازی</SelectItem>
                          <SelectItem value="temporary">محدودسازی موقت</SelectItem>
                          <SelectItem value="permanent">مسدودسازی دائم</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {rejectionForm.watch("restrictionType") === "temporary" && (
                  <>
                    <FormField
                      control={rejectionForm.control}
                      name="restrictionStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاریخ شروع محدودسازی</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={rejectionForm.control}
                      name="restrictionEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاریخ پایان محدودسازی</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                    لغو
                  </Button>
                  <Button type="submit" variant="destructive" disabled={rejectRaffleMutation.isPending}>
                    {rejectRaffleMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    ) : (
                      <XCircle className="w-4 h-4 ml-2" />
                    )}
                    رد و ارسال
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="telegram-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-telegram">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                تأیید حذف آگهی
              </DialogTitle>
              <DialogDescription className="text-telegram-text-secondary">
                آیا از حذف این آگهی اطمینان دارید؟ این عمل غیر قابل بازگشت است.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="border-telegram-border text-telegram-text"
              >
                لغو
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRaffle}
                disabled={deleteRaffleMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteRaffleMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                ) : (
                  <Trash2 className="w-4 h-4 ml-2" />
                )}
                حذف آگهی
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent className="telegram-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-telegram">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                تأیید حذف دسته‌جمعی
              </DialogTitle>
              <DialogDescription className="text-telegram-text-secondary">
                آیا از حذف تمام آگهی‌های {bulkDeleteStatus === 'approved' ? 'تایید شده' : 'رد شده'} اطمینان دارید؟ 
                این عمل غیر قابل بازگشت است و تمام آگهی‌های این دسته پاک خواهند شد.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteDialogOpen(false)}
                className="border-telegram-border text-telegram-text"
              >
                لغو
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkDeleteMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                ) : (
                  <Trash2 className="w-4 h-4 ml-2" />
                )}
                حذف همه آگهی‌ها
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Scroll to Top Button - for admin */}
        {showScrollToTop && (
          <div 
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999]"
            style={{ pointerEvents: "auto" }}
          >
            <Button
              onClick={scrollToTop}
              className="flex items-center gap-2 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-white/20 dark:border-white/10 text-black dark:text-white hover:bg-white/90 dark:hover:bg-black/90 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title="برو بالا"
              aria-label="برو بالا"
              style={{ pointerEvents: "auto" }}
            >
              <ArrowUp size={18} className="text-black dark:text-white" />
              <span className="text-sm font-medium whitespace-nowrap text-black dark:text-white">برو بالا</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}