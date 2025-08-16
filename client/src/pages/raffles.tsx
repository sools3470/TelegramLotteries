import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RaffleCard } from "@/components/raffle-card";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import { type Raffle, type User } from "@shared/schema";

export default function Raffles() {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useTelegram();

  const { data: raffles = [], isLoading } = useQuery({
    queryKey: ["/api/raffles"],
    queryFn: () => fetch("/api/raffles").then(res => res.json()),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/telegram", user?.id],
    queryFn: () => fetch(`/api/users/telegram/${user?.id}`).then(res => {
      if (res.status === 404) {
        return null; // User doesn't exist yet
      }
      return res.json();
    }),
    enabled: !!user?.id,
  });

  const filteredRaffles = raffles.filter((raffle: Raffle) => {
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || raffle.prizeType === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Search and Filter */}
      <Card className="telegram-card">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-telegram-secondary" size={20} />
              <Input
                placeholder="جستجو در قرعه‌کشی‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Filter className="text-telegram-secondary" size={20} />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="نوع جایزه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه جوایز</SelectItem>
                  <SelectItem value="stars">استارز تلگرام</SelectItem>
                  <SelectItem value="premium">اشتراک پریمیوم</SelectItem>
                  <SelectItem value="mixed">ترکیبی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raffles List */}
      <Card className="telegram-card">
        <div className="p-4 border-b border-telegram">
          <h2 className="text-lg font-semibold text-telegram">
            تمام قرعه‌کشی‌ها ({filteredRaffles.length})
          </h2>
        </div>
        
        <CardContent className="p-4">
          {isLoading || !currentUser ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram-blue"></div>
            </div>
          ) : filteredRaffles.length === 0 ? (
            <div className="text-center py-8 text-telegram-secondary">
              {searchTerm || filterType !== "all" 
                ? "هیچ قرعه‌کشی با فیلتر اعمال شده یافت نشد"
                : "هیچ قرعه‌کشی فعالی وجود ندارد"
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRaffles.map((raffle: Raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
