import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ProgressRing } from "@/components/ProgressRing";
import { SaveIndicator } from "@/components/SaveIndicator";
import { GanttChart } from "@/components/GanttChart";
import { FileUpload } from "@/components/FileUpload";
import { WebsiteContentModal } from "@/components/WebsiteContentModal";
import { HotelChat } from "@/components/HotelChat";
import { useStore, StrategicMaterials, ClientMilestone } from "@/lib/store";
import { useAgentResults } from "@/hooks/useAgentResults";
import { useHotelWebsiteData } from "@/hooks/useHotelWebsiteData";
import { AGENTS } from "@/lib/agents-data";
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
  FileSpreadsheet,
  FileText,
  BookOpen,
  Database,
  CalendarIcon,
  Trash2,
  Loader2,
  Sparkles,
  AlertCircle,
  Pencil,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function HotelDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getHotel, updateHotel, deleteHotel } = useStore();

  const hotel = getHotel(id || "");
  const { results, loading: resultsLoading, getResultForModule } = useAgentResults(id || "");
  const { websiteData, isCrawling, crawlWebsite } = useHotelWebsiteData(id);
  const [materials, setMaterials] = useState<StrategicMaterials>({
    manualFuncionamentoUrl: "",
    manualFuncionamentoName: "",
    dadosHotelUrl: "",
    dadosHotelName: "",
    transcricaoKickoffUrl: "",
    transcricaoKickoffName: ""
  });
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>(undefined);
  const [milestones, setMilestones] = useState<ClientMilestone[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isWebsiteContentOpen, setIsWebsiteContentOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    city: "",
    contact: "",
    category: "",
    website: "",
    hasNoWebsite: false,
  });

  const DEFAULT_MILESTONES = [
    { id: "etapa1", name: "Etapa 1 – Kickoff & Alinhamento", startWeek: 1, endWeek: 1 },
    { id: "etapa2", name: "Etapa 2 – Estratégia", startWeek: 2, endWeek: 3 },
    { id: "etapa3", name: "Etapa 3 – Construção", startWeek: 4, endWeek: 5 },
    { id: "etapa4", name: "Etapa 4 – Ativação e Mensuração", startWeek: 6, endWeek: 7 },
    { id: "etapa5", name: "Etapa 5 – Relatório Final e Proposta de Continuidade", startWeek: 8, endWeek: 8 }
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
        manualFuncionamentoUrl: hotel.strategicMaterials.manualFuncionamentoUrl || "",
        manualFuncionamentoName: hotel.strategicMaterials.manualFuncionamentoName || "",
        dadosHotelUrl: hotel.strategicMaterials.dadosHotelUrl || "",
        dadosHotelName: hotel.strategicMaterials.dadosHotelName || "",
        transcricaoKickoffUrl: hotel.strategicMaterials.transcricaoKickoffUrl || "",
        transcricaoKickoffName: hotel.strategicMaterials.transcricaoKickoffName || ""
      });
    }
    if (hotel) {
      setEditForm({
        name: hotel.name || "",
        city: hotel.city || "",
        contact: hotel.contact || "",
        category: hotel.category || "",
        website: hotel.website || "",
        hasNoWebsite: hotel.hasNoWebsite || false,
      });
    }
    if (hotel?.projectStartDate) {
      const date = parseISO(hotel.projectStartDate);
      setProjectStartDate(date);
      
      const newMilestones = DEFAULT_MILESTONES.map(defaultM => ({
        id: defaultM.id,
        name: defaultM.name,
        startWeek: defaultM.startWeek,
        endWeek: defaultM.endWeek,
        startDate: addDays(date, (defaultM.startWeek - 1) * 7).toISOString(),
        endDate: addDays(date, defaultM.endWeek * 7 - 1).toISOString()
      }));
      
      setMilestones(newMilestones);
      updateHotel(hotel.id, { milestones: newMilestones });
    }
  }, [hotel?.id]);

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

  const handleMilestonesChange = (newMilestones: ClientMilestone[]) => {
    if (!hotel) return;
    setMilestones(newMilestones);
    updateHotel(hotel.id, { milestones: newMilestones });
    setLastSaved(new Date());
  };

  const handleSaveEdit = () => {
    if (!hotel) return;
    updateHotel(hotel.id, {
      name: editForm.name,
      city: editForm.city,
      contact: editForm.contact,
      category: editForm.category,
      website: editForm.hasNoWebsite ? undefined : editForm.website,
      hasNoWebsite: editForm.hasNoWebsite,
    });
    setIsEditDialogOpen(false);
    toast.success("Informações atualizadas com sucesso!");
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

  // Calculate progress based on completed agent results
  const completedAgents = results.filter(r => r.status === 'completed').length;
  const hotelProgress = Math.round((completedAgents / 11) * 100);

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
                  {hotel.website && !hotel.hasNoWebsite && (
                    <a 
                      href={hotel.website.startsWith('http') ? hotel.website : `https://${hotel.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      {hotel.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {hotel.hasNoWebsite && (
                    <div className="flex items-center gap-1 text-muted-foreground/60">
                      <Globe className="h-4 w-4" />
                      <span className="italic">Sem site</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Progresso Geral</div>
                <div className="text-2xl font-display text-foreground">{hotelProgress}%</div>
              </div>
              <ProgressRing progress={hotelProgress} size={64} strokeWidth={5} />
              
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Hotel?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os dados, evidências e 
                      progresso dos módulos de "{hotel.name}" serão permanentemente excluídos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        deleteHotel(hotel.id);
                        navigate("/dashboard");
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Edit Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Editar Hotel</DialogTitle>
                    <DialogDescription>
                      Atualize as informações básicas do hotel
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome do Hotel</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Ex: Grand Hotel Resort"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">Cidade / Estado</Label>
                      <Input
                        id="edit-city"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        placeholder="Ex: São Paulo, SP"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-contact">Contato Principal</Label>
                      <Input
                        id="edit-contact"
                        value={editForm.contact}
                        onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                        placeholder="Ex: João Silva - (11) 99999-9999"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Categoria</Label>
                      <Select
                        value={editForm.category}
                        onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hotel Urbano">Hotel Urbano</SelectItem>
                          <SelectItem value="Resort">Resort</SelectItem>
                          <SelectItem value="Pousada">Pousada</SelectItem>
                          <SelectItem value="Hotel Fazenda">Hotel Fazenda</SelectItem>
                          <SelectItem value="Flat/Apart-Hotel">Flat/Apart-Hotel</SelectItem>
                          <SelectItem value="Hostel">Hostel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-nowebsite"
                          checked={editForm.hasNoWebsite}
                          onCheckedChange={(checked) => 
                            setEditForm({ ...editForm, hasNoWebsite: checked as boolean, website: checked ? "" : editForm.website })
                          }
                        />
                        <Label htmlFor="edit-nowebsite" className="text-sm text-muted-foreground">
                          Hotel não possui site
                        </Label>
                      </div>
                      {!editForm.hasNoWebsite && (
                        <Input
                          id="edit-website"
                          value={editForm.website}
                          onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                          placeholder="https://www.seuhotel.com.br"
                        />
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={!editForm.name || !editForm.city}>
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                <h2 className="font-display text-lg text-foreground">Materiais Primários</h2>
                <p className="text-sm text-muted-foreground">Documentos base para análise dos agentes</p>
              </div>
            </div>
            <SaveIndicator saving={isSaving} saved={lastSaved !== null} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Manual de Funcionamento */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Manual de Funcionamento
              </label>
              <FileUpload
                hotelId={hotel.id}
                field="manual"
                currentUrl={materials.manualFuncionamentoUrl}
                currentName={materials.manualFuncionamentoName}
                onUploadComplete={(url, name) => {
                  const newMaterials = { ...materials, manualFuncionamentoUrl: url, manualFuncionamentoName: name };
                  setMaterials(newMaterials);
                  updateHotel(hotel.id, { strategicMaterials: newMaterials });
                  setLastSaved(new Date());
                }}
                onRemove={() => {
                  const newMaterials = { ...materials, manualFuncionamentoUrl: "", manualFuncionamentoName: "" };
                  setMaterials(newMaterials);
                  updateHotel(hotel.id, { strategicMaterials: newMaterials });
                  setLastSaved(new Date());
                }}
              />
            </div>

            {/* Dados do Hotel */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Database className="h-4 w-4 text-muted-foreground" />
                Briefing de Criação
              </label>
              <FileUpload
                hotelId={hotel.id}
                field="dados"
                currentUrl={materials.dadosHotelUrl}
                currentName={materials.dadosHotelName}
                onUploadComplete={(url, name) => {
                  const newMaterials = { ...materials, dadosHotelUrl: url, dadosHotelName: name };
                  setMaterials(newMaterials);
                  updateHotel(hotel.id, { strategicMaterials: newMaterials });
                  setLastSaved(new Date());
                }}
                onRemove={() => {
                  const newMaterials = { ...materials, dadosHotelUrl: "", dadosHotelName: "" };
                  setMaterials(newMaterials);
                  updateHotel(hotel.id, { strategicMaterials: newMaterials });
                  setLastSaved(new Date());
                }}
              />
            </div>

            {/* Transcrição de Kickoff */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Transcrição de Kickoff
              </label>
              <FileUpload
                hotelId={hotel.id}
                field="transcricao"
                currentUrl={materials.transcricaoKickoffUrl}
                currentName={materials.transcricaoKickoffName}
                onUploadComplete={(url, name) => {
                  const newMaterials = { ...materials, transcricaoKickoffUrl: url, transcricaoKickoffName: name };
                  setMaterials(newMaterials);
                  updateHotel(hotel.id, { strategicMaterials: newMaterials });
                  setLastSaved(new Date());
                }}
                onRemove={() => {
                  const newMaterials = { ...materials, transcricaoKickoffUrl: "", transcricaoKickoffName: "" };
                  setMaterials(newMaterials);
                  updateHotel(hotel.id, { strategicMaterials: newMaterials });
                  setLastSaved(new Date());
                }}
              />
            </div>

            {/* Conteúdo do Site */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Conteúdo do Site
              </label>
              
              <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/30 min-h-[120px] flex flex-col justify-center">
                {hotel.hasNoWebsite ? (
                  <div className="text-center text-muted-foreground text-sm">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Hotel não possui site</p>
                  </div>
                ) : !hotel.website ? (
                  <div className="text-center text-muted-foreground text-sm">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Nenhum site configurado</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-1 h-auto p-0"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      Adicionar site
                    </Button>
                  </div>
                ) : isCrawling ? (
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analisando site...</p>
                  </div>
                ) : websiteData?.status === 'error' ? (
                  <div className="text-center">
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm text-destructive mb-2">Erro na análise</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => crawlWebsite(hotel.website!)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Tentar novamente
                    </Button>
                  </div>
                ) : websiteData?.status === 'completed' && Array.isArray(websiteData.crawled_content) ? (
                  <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-foreground font-medium mb-1">
                      {websiteData.crawled_content.length} páginas extraídas
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setIsWebsiteContentOpen(true)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Conteúdo
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => crawlWebsite(hotel.website!)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground mb-2">Site não analisado</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => crawlWebsite(hotel.website!)}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Analisar Site
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Website Content Modal */}
        <WebsiteContentModal
          open={isWebsiteContentOpen}
          onOpenChange={setIsWebsiteContentOpen}
          pages={Array.isArray(websiteData?.crawled_content) ? websiteData.crawled_content : []}
          crawledAt={websiteData?.crawled_at || null}
        />


        {/* HotelGPT Chat */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg text-foreground">HotelGPT</h2>
              <p className="text-sm text-muted-foreground">Chat inteligente com acesso a todos os dados do hotel</p>
            </div>
          </div>
          
          <HotelChat hotelId={hotel.id} hotelName={hotel.name} />
        </div>

        {/* Agents grid */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">Agentes Estratégicos</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Cada agente analisa os materiais e gera insights específicos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((agent, index) => {
            const result = getResultForModule(agent.id);
            const status = result?.status || 'pending';
            const isCompleted = status === 'completed';
            const isGenerating = status === 'generating';
            const hasError = status === 'error';

            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/hotel/${hotel.id}/module/${agent.id}`)}
                className={cn(
                  "bg-card border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg group animate-slide-up",
                  isCompleted 
                    ? "border-gold/50 bg-gold-muted/20" 
                    : hasError
                      ? "border-destructive/50"
                      : "border-border hover:border-primary/30"
                )}
                style={{ animationDelay: `${0.2 + index * 0.03}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-colors",
                    isCompleted 
                      ? "bg-gold text-foreground" 
                      : isGenerating
                        ? "gradient-primary text-primary-foreground"
                        : hasError
                          ? "bg-destructive/20 text-destructive"
                          : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : isGenerating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : hasError ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      `#${agent.id}`
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {agent.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {agent.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isGenerating && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Gerando...
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs bg-gold/20 text-foreground px-2 py-1 rounded-full">
                        Concluído
                      </span>
                    )}
                    {hasError && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                        Erro
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
