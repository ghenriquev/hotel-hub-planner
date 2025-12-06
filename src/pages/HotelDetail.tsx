import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ProgressRing } from "@/components/ProgressRing";
import { useStore } from "@/lib/store";
import { MODULES } from "@/lib/modules-data";
import { 
  ArrowLeft, 
  Building2, 
  ChevronRight, 
  MapPin,
  Phone,
  Tag,
  Check,
  FileText,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HotelDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getHotel, getProgress, getHotelProgress } = useStore();

  const hotel = getHotel(id || "");
  
  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl text-foreground mb-4">Hotel não encontrado</h2>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const hotelProgress = getHotelProgress(hotel.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hotel header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-2">
                  {hotel.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {hotel.city}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {hotel.contact}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {hotel.category}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Progresso Geral</div>
                <div className="text-2xl font-display text-foreground">{hotelProgress}%</div>
              </div>
              <ProgressRing progress={hotelProgress} size={64} strokeWidth={5} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8 animate-slide-up">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/hotel/${hotel.id}/evidences`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Evidências
          </Button>
        </div>

        {/* Modules grid */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-xl text-foreground mb-1">Módulos Estratégicos</h2>
          <p className="text-muted-foreground text-sm">
            Complete todos os módulos para finalizar o plano estratégico
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((module, index) => {
            const progress = getProgress(hotel.id, module.id);
            const isCompleted = progress?.completed || false;
            const hasStarted = progress && (
              Object.keys(progress.checklist).length > 0 ||
              Object.keys(progress.answers).length > 0
            );

            return (
              <div
                key={module.id}
                onClick={() => navigate(`/hotel/${hotel.id}/module/${module.id}`)}
                className={cn(
                  "bg-card border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg group animate-slide-up",
                  isCompleted 
                    ? "border-gold/50 bg-gold-muted/20" 
                    : "border-border hover:border-primary/30"
                )}
                style={{ animationDelay: `${0.1 + index * 0.03}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-colors",
                    isCompleted 
                      ? "bg-gold text-foreground" 
                      : hasStarted 
                        ? "gradient-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : `#${module.id}`}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isCompleted && hasStarted && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Em progresso
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
