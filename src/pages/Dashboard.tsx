import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressRing } from "@/components/ProgressRing";
import { MigrationBanner } from "@/components/MigrationBanner";
import { HotelPendingBadge } from "@/components/HotelPendingInfo";
import { useHotels } from "@/hooks/useHotels";
import { useAgentResults } from "@/hooks/useAgentResults";
import { useAgentConfigs } from "@/hooks/useAgentConfigs";
import { useUserRole } from "@/hooks/useUserRole";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  ChevronRight,
  LayoutGrid,
  List,
  CalendarIcon,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
function HotelProgress({ hotelId, totalAgents }: { hotelId: string; totalAgents: number }) {
  const { results } = useAgentResults(hotelId);
  const completedAgents = results.filter(r => r.status === 'completed').length;
  const progress = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;
  
  return (
    <div className="flex items-center gap-3">
      <ProgressRing progress={progress} size={36} strokeWidth={3} />
      <div className="text-sm">
        <div className="text-foreground font-medium">{progress}%</div>
        <div className="text-muted-foreground text-xs">
          {completedAgents}/{totalAgents} agentes
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { hotels, loading } = useHotels();
  const { configs: agentConfigs } = useAgentConfigs();
  const { isAdmin } = useUserRole();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const totalAgents = agentConfigs.length;
  
  const handleHotelClick = (hotelId: string) => {
    if (isAdmin) {
      navigate(`/hotel/${hotelId}`);
    } else {
      navigate(`/hotel/${hotelId}/client-view`);
    }
  };

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      hotel.city.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <p className="text-muted-foreground">
          Gerencie o plano estratégico de vendas diretas
        </p>
      </div>

      {/* Migration Banner */}
      <MigrationBanner />

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar hotel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-1 border border-border p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 transition-colors",
              viewMode === "grid" 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 transition-colors",
              viewMode === "list" 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hotels grid/list */}
      {filteredHotels.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl text-foreground mb-2">
            {hotels.length === 0 ? "Nenhum hotel cadastrado" : "Nenhum resultado encontrado"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {hotels.length === 0 
              ? "A criação de novos hotéis foi desativada — o projeto foi migrado para a RAI." 
              : "Tente uma busca diferente"}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              : "flex flex-col gap-2"
          )}
        >
          {filteredHotels.map((hotel) => (
            <div
              key={hotel.id}
              onClick={() => handleHotelClick(hotel.id)}
              className={cn(
                "bg-card border border-border/60 p-5 cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-sm group",
                viewMode === "list" && "flex items-center gap-6"
              )}
            >
              <div className={cn(
                "flex items-start gap-4",
                viewMode === "list" && "flex-1"
              )}>
                <div className="w-10 h-10 gradient-primary flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base text-foreground truncate group-hover:text-primary transition-colors">
                    {hotel.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{hotel.city}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {hotel.project_start_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(parseISO(hotel.project_start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    {hotel.category && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5">
                        {hotel.category}
                      </span>
                    )}
                    <HotelPendingBadge hotel={hotel} />
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "flex items-center justify-between",
                viewMode === "grid" && "mt-4 pt-4 border-t border-border/60"
              )}>
                <HotelProgress hotelId={hotel.id} totalAgents={totalAgents} />
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
