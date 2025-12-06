import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { ProgressRing } from "@/components/ProgressRing";
import { SaveIndicator } from "@/components/SaveIndicator";
import { GanttChart } from "@/components/GanttChart";
import { useStore, StrategicMaterials, ClientMilestone } from "@/lib/store";
import { MODULES } from "@/lib/modules-data";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Building2, 
  ChevronRight, 
  MapPin,
  Phone,
  Tag,
  Check,
  FileText,
  FileSpreadsheet,
  BookOpen,
  Database,
  Video,
  ExternalLink,
  CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
export default function HotelDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getHotel, updateHotel, getProgress, getHotelProgress } = useStore();

  const hotel = getHotel(id || "");
  
  const [materials, setMaterials] = useState<StrategicMaterials>({
    planilha: "",
    manualFuncionamento: "",
    dadosHotel: "",
    callKickoff: ""
  });
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>(undefined);
  const [milestones, setMilestones] = useState<ClientMilestone[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const DEFAULT_MILESTONES = [
    { id: "fase1", name: "🔹 Fase 1 – Kickoff & Alinhamento", startWeek: 1, endWeek: 1 },
    { id: "fase2", name: "🔹 Fase 2 – Estratégia", startWeek: 2, endWeek: 3 },
    { id: "fase3", name: "🔹 Fase 3 – Construção", startWeek: 4, endWeek: 5 },
    { id: "fase4", name: "🔹 Fase 4 – Ativação e Mensuração", startWeek: 6, endWeek: 6 },
    { id: "fase5", name: "🔹 Fase 5 – Relatório Final e Proposta de Continuidade", startWeek: 8, endWeek: 8 }
  ];

  const calculateMilestoneDates = useCallback((startDate: Date, ms: typeof DEFAULT_MILESTONES) => {
    return ms.map(m => ({
      ...m,
      startDate: addDays(startDate, (m.startWeek - 1) * 7).toISOString(),
      endDate: addDays(startDate, m.endWeek * 7 - 1).toISOString()
    }));
  }, []);

  useEffect(() => {
    if (hotel?.strategicMaterials) {
      setMaterials({
        planilha: hotel.strategicMaterials.planilha || "",
        manualFuncionamento: hotel.strategicMaterials.manualFuncionamento || "",
        dadosHotel: hotel.strategicMaterials.dadosHotel || "",
        callKickoff: hotel.strategicMaterials.callKickoff || ""
      });
    }
    if (hotel?.projectStartDate) {
      setProjectStartDate(parseISO(hotel.projectStartDate));
    }
    if (hotel?.milestones && hotel.milestones.length > 0) {
      setMilestones(hotel.milestones);
    } else if (hotel?.projectStartDate) {
      const date = parseISO(hotel.projectStartDate);
      setMilestones(calculateMilestoneDates(date, DEFAULT_MILESTONES));
    }
  }, [hotel?.id, calculateMilestoneDates]);

  // Auto-save materials
  useEffect(() => {
    if (!hotel) return;
    
    const timeout = setTimeout(() => {
      setIsSaving(true);
      updateHotel(hotel.id, { strategicMaterials: materials });
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 300);
    }, 500);

    return () => clearTimeout(timeout);
  }, [materials]);

  // Handle start date change
  const handleStartDateChange = (date: Date | undefined) => {
    if (!date || !hotel) return;
    setProjectStartDate(date);
    const newMilestones = calculateMilestoneDates(date, DEFAULT_MILESTONES);
    setMilestones(newMilestones);
    updateHotel(hotel.id, { 
      projectStartDate: date.toISOString(),
      milestones: newMilestones
    });
    setLastSaved(new Date());
  };

  // Handle milestones change from Gantt
  const handleMilestonesChange = (newMilestones: ClientMilestone[]) => {
    if (!hotel) return;
    setMilestones(newMilestones);
    updateHotel(hotel.id, { milestones: newMilestones });
    setLastSaved(new Date());
  };
  
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

  const handleMaterialChange = (field: keyof StrategicMaterials, value: string) => {
    setMaterials(prev => ({ ...prev, [field]: value }));
  };

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

        {/* Strategic Materials */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg text-foreground">Materiais Estratégicos</h2>
                <p className="text-sm text-muted-foreground">Links dos documentos e materiais do hotel</p>
              </div>
            </div>
            <SaveIndicator saving={isSaving} saved={lastSaved !== null} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Planilha */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                Planilha de Dados
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Cole o link da planilha..."
                  value={materials.planilha}
                  onChange={(e) => handleMaterialChange("planilha", e.target.value)}
                  className="flex-1"
                />
                {materials.planilha && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(materials.planilha, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Manual de Funcionamento */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Manual de Funcionamento
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Cole o link do manual..."
                  value={materials.manualFuncionamento}
                  onChange={(e) => handleMaterialChange("manualFuncionamento", e.target.value)}
                  className="flex-1"
                />
                {materials.manualFuncionamento && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(materials.manualFuncionamento, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Dados do Hotel */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Database className="h-4 w-4 text-muted-foreground" />
                Dados do Hotel
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Cole o link dos dados..."
                  value={materials.dadosHotel}
                  onChange={(e) => handleMaterialChange("dadosHotel", e.target.value)}
                  className="flex-1"
                />
                {materials.dadosHotel && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(materials.dadosHotel, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Call de Kickoff */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Video className="h-4 w-4 text-muted-foreground" />
                Link da Call de Kickoff
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Cole o link da call..."
                  value={materials.callKickoff}
                  onChange={(e) => handleMaterialChange("callKickoff", e.target.value)}
                  className="flex-1"
                />
                {materials.callKickoff && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(materials.callKickoff, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client Schedule - Gantt Chart */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg text-foreground">Cronograma do Cliente</h2>
                <p className="text-sm text-muted-foreground">Resumo de encontros e etapas do projeto</p>
              </div>
            </div>
            <SaveIndicator saving={isSaving} saved={lastSaved !== null} />
          </div>

          {/* Start Date Picker */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Data de Início do Projeto
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !projectStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {projectStartDate ? format(projectStartDate, "PPP", { locale: ptBR }) : <span>Selecione a data de início</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={projectStartDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Gantt Chart */}
          {projectStartDate && milestones.length > 0 && (
            <GanttChart
              startDate={projectStartDate.toISOString()}
              milestones={milestones}
              onMilestonesChange={handleMilestonesChange}
            />
          )}

          {!projectStartDate && (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Selecione a data de início para visualizar o cronograma</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
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
