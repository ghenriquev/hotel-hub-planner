import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { ProgressRing } from "@/components/ProgressRing";
import { MigrationBanner } from "@/components/MigrationBanner";
import { useHotels } from "@/hooks/useHotels";
import { useAgentResults } from "@/hooks/useAgentResults";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Building2, 
  LogOut, 
  Plus, 
  Search, 
  MapPin, 
  ChevronRight,
  LayoutGrid,
  List,
  Settings,
  CalendarIcon,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

function HotelProgress({ hotelId }: { hotelId: string }) {
  const { results } = useAgentResults(hotelId);
  const completedAgents = results.filter(r => r.status === 'completed').length;
  const progress = Math.round((completedAgents / 11) * 100);
  
  return (
    <div className="flex items-center gap-3">
      <ProgressRing progress={progress} size={40} strokeWidth={3} />
      <div className="text-sm">
        <div className="text-foreground font-medium">Progresso</div>
        <div className="text-muted-foreground">
          {progress === 100 ? "Completo" : "Em andamento"}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { hotels, loading } = useHotels();
  const { isAdmin } = useUserRole();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
        
        setUserName(profile?.name || user.email?.split('@')[0] || '');
      }
    };
    fetchUserName();
  }, []);

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      hotel.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Olá, <span className="text-foreground font-medium">{userName}</span>
            </span>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display text-3xl text-foreground mb-1">
              Meus Hotéis
            </h1>
            <p className="text-muted-foreground">
              Gerencie o plano estratégico de vendas diretas
            </p>
          </div>
          
          <Button onClick={() => navigate("/hotel/new")} variant="premium">
            <Plus className="h-4 w-4 mr-2" />
            Novo Hotel
          </Button>
        </div>

        {/* Migration Banner */}
        <MigrationBanner />

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar hotel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-1 border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded transition-colors",
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
                "p-2 rounded transition-colors",
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
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl text-foreground mb-2">
              {hotels.length === 0 ? "Nenhum hotel cadastrado" : "Nenhum resultado encontrado"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {hotels.length === 0 
                ? "Comece adicionando seu primeiro hotel" 
                : "Tente uma busca diferente"}
            </p>
            {hotels.length === 0 && (
              <Button onClick={() => navigate("/hotel/new")} variant="premium">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Hotel
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-3"
            )}
          >
            {filteredHotels.map((hotel, index) => (
              <div
                key={hotel.id}
                onClick={() => navigate(`/hotel/${hotel.id}`)}
                className={cn(
                  "bg-card border border-border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 group animate-slide-up",
                  viewMode === "list" && "flex items-center gap-6"
                )}
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className={cn(
                  "flex items-start gap-4",
                  viewMode === "list" && "flex-1"
                )}>
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{hotel.city}</span>
                    </div>
                    {hotel.project_start_date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Início: {format(parseISO(hotel.project_start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    {hotel.category && (
                      <span className="inline-block mt-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        {hotel.category}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={cn(
                  "flex items-center justify-between",
                  viewMode === "grid" && "mt-6 pt-4 border-t border-border"
                )}>
                  <HotelProgress hotelId={hotel.id} />
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
