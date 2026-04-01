import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
// Logo import removed - using AppLayout
import { ProgressRing } from "@/components/ProgressRing";
import { SaveIndicator } from "@/components/SaveIndicator";
import { GanttChart } from "@/components/GanttChart";
import { FileUpload } from "@/components/FileUpload";
import { WebsiteContentModal } from "@/components/WebsiteContentModal";
import { CompetitorAnalysisModal } from "@/components/CompetitorAnalysisModal";
import { HotelChat } from "@/components/HotelChat";
import { ReviewsCard } from "@/components/ReviewsCard";
import { HotelPendingAlert } from "@/components/HotelPendingInfo";
import { useHotel } from "@/hooks/useHotels";
import { useHotelMaterials, MaterialType } from "@/hooks/useHotelMaterials";
import { useHotelMilestones } from "@/hooks/useHotelMilestones";
import { useAgentResults } from "@/hooks/useAgentResults";
import { useHotelWebsiteData } from "@/hooks/useHotelWebsiteData";
import { useHotelCompetitorData } from "@/hooks/useHotelCompetitorData";
import { useHotelCompetitors } from "@/hooks/useHotelCompetitors";
import { useAgentsReadiness } from "@/hooks/useAgentsReadiness";
import { useAgentConfigs } from "@/hooks/useAgentConfigs";
import { useManualFormLink, useHotelManualData } from "@/hooks/useHotelManualData";
import { useHotelProjectData } from "@/hooks/useHotelProjectData";
import { MeetingLinksSection } from "@/components/MeetingLinksSection";
import { ProjectPhasesSection } from "@/components/ProjectPhasesSection";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, ChevronRight, MapPin, Phone, Tag, Check, FileSpreadsheet, FileText, BookOpen, Database, CalendarIcon, Trash2, Loader2, Sparkles, AlertCircle, Pencil, Globe, Search, CheckCircle2, XCircle, Eye, RefreshCw, MessageSquare, Star, Users, Bot, Link2, Copy, ExternalLink, ClipboardCheck, Upload, Download, FileUp, Plus, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
export default function HotelDetail() {
  const navigate = useNavigate();
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    hotel,
    loading: hotelLoading,
    updateHotel,
    deleteHotel
  } = useHotel(id);
  const {
    materialsState,
    upsertMaterial,
    deleteMaterial
  } = useHotelMaterials(id);
  const {
    milestonesLegacy,
    createDefaultMilestones
  } = useHotelMilestones(id);
  const {
    results,
    getResultForModule
  } = useAgentResults(id || "");
  const {
    websiteData,
    isCrawling,
    crawlWebsite,
    cancelCrawl
  } = useHotelWebsiteData(id);
  const {
    competitors: competitorData,
    isCrawling: isCompetitorsCrawling,
    crawlCompetitors,
    getCompletedCount: getCompletedCompetitorsCount,
    getAnalysisCompletedCount,
    hasAnyAnalysis,
    refetch: refetchCompetitorData
  } = useHotelCompetitorData(id);
  const {
    getReadiness
  } = useAgentsReadiness(id || "");
  const { configs } = useAgentConfigs();
  const { getFormLink } = useManualFormLink(id);
  const { manualData: manualFormData, loading: manualLoading, uploadManualFile, removeManualFile } = useHotelManualData(id);
  const { projectData, updateProjectData } = useHotelProjectData(id);
  const { 
    competitors: editableCompetitors, 
    updateCompetitor, 
    addCompetitor, 
    removeCompetitor, 
    saveCompetitors,
    isSaving: isSavingCompetitors,
    refetch: refetchCompetitors
  } = useHotelCompetitors(id);
  const [isUploadingManual, setIsUploadingManual] = useState(false);
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isWebsiteContentOpen, setIsWebsiteContentOpen] = useState(false);
  const [isCompetitorAnalysisOpen, setIsCompetitorAnalysisOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    city: "",
    contact: "",
    category: "",
    website: "",
    hasNoWebsite: false,
    instagramUrl: "",
    tripadvisorUrl: "",
    bookingUrl: "",
    googleBusinessUrl: "",
  });
  useEffect(() => {
    if (hotel) {
      setEditForm({
        name: hotel.name || "",
        city: hotel.city || "",
        contact: hotel.contact || "",
        category: hotel.category || "",
        website: hotel.website || "",
        hasNoWebsite: hotel.has_no_website || false,
        instagramUrl: hotel.instagram_url || "",
        tripadvisorUrl: hotel.tripadvisor_url || "",
        bookingUrl: hotel.booking_url || "",
        googleBusinessUrl: hotel.google_business_url || "",
      });
      if (hotel.project_start_date) {
        setProjectStartDate(parseISO(hotel.project_start_date));
      }
    }
  }, [hotel?.id]);
  const handleStartDateChange = async (date: Date | undefined) => {
    if (!date || !hotel) return;
    setProjectStartDate(date);
    await updateHotel({
      project_start_date: format(date, 'yyyy-MM-dd')
    });
    await createDefaultMilestones(date);
    setLastSaved(new Date());
  };
  const handleSaveEdit = async () => {
    if (!hotel) return;
    setIsSaving(true);
    // Save hotel basic info
    const success = await updateHotel({
      name: editForm.name,
      city: editForm.city,
      contact: editForm.contact,
      category: editForm.category,
      website: editForm.hasNoWebsite ? null : editForm.website,
      has_no_website: editForm.hasNoWebsite,
      instagram_url: editForm.instagramUrl || null,
      tripadvisor_url: editForm.tripadvisorUrl || null,
      booking_url: editForm.bookingUrl || null,
      google_business_url: editForm.googleBusinessUrl || null,
    });
    
    // Save competitors separately
    await saveCompetitors();
    
    // Refetch competitor data to update the UI
    await refetchCompetitorData();
    
    if (success) {
      setIsEditDialogOpen(false);
      toast.success("Informações atualizadas com sucesso!");
      setLastSaved(new Date());
    }
    setIsSaving(false);
  };
  const handleDeleteHotel = async () => {
    const success = await deleteHotel();
    if (success) {
      navigate("/dashboard");
    }
  };
  const handleMaterialUpload = async (materialType: MaterialType, url: string, name: string) => {
    setIsSaving(true);
    await upsertMaterial(materialType, url, name);
    setIsSaving(false);
    setLastSaved(new Date());
  };
  const handleMaterialRemove = async (materialType: MaterialType) => {
    setIsSaving(true);
    await deleteMaterial(materialType);
    setIsSaving(false);
    setLastSaved(new Date());
  };

  const handleManualFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploadingManual(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}/manual_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('strategic-materials')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('strategic-materials')
        .getPublicUrl(fileName);

      await uploadManualFile(publicUrl, file.name);
      toast.success('Arquivo enviado com sucesso!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploadingManual(false);
    }
  };

  const handleRemoveManualFile = async () => {
    if (!manualFormData?.uploaded_file_url) return;

    try {
      // Extract path from URL
      const url = new URL(manualFormData.uploaded_file_url);
      const pathParts = url.pathname.split('/strategic-materials/');
      if (pathParts[1]) {
        await supabase.storage.from('strategic-materials').remove([pathParts[1]]);
      }
      await removeManualFile();
      toast.success('Arquivo removido');
    } catch (err) {
      console.error('Remove error:', err);
      toast.error('Erro ao remover arquivo');
    }
  };
  if (hotelLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!hotel) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl text-foreground mb-4">Hotel não encontrado</h2>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>;
  }
  const completedAgents = results.filter(r => r.status === 'completed').length;
  const totalAgents = configs.length;
  const hotelProgress = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;
  return <div className="p-6">
      {/* Pending Info Alert */}
      <HotelPendingAlert hotel={hotel} materialsState={materialsState} manualDataStatus={{ isComplete: manualFormData?.is_complete || false, inputMethod: manualFormData?.input_method || undefined }} />

      {/* Hotel header */}
      <div className="bg-card border border-border/60 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 gradient-primary flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-primary-foreground" />
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
                  {hotel.contact && <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {hotel.contact}
                    </div>}
                  {hotel.category && <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {hotel.category}
                    </div>}
                  {hotel.website && !hotel.has_no_website && <a href={hotel.website.startsWith('http') ? hotel.website : `https://${hotel.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Globe className="h-4 w-4" />
                      {hotel.website.replace(/^https?:\/\//, '')}
                    </a>}
                  {hotel.has_no_website && <div className="flex items-center gap-1 text-muted-foreground/60">
                      <Globe className="h-4 w-4" />
                      <span className="italic">Sem site</span>
                    </div>}
                </div>
                {/* Social Profile Icons */}
                {(hotel.instagram_url || hotel.tripadvisor_url || hotel.booking_url || hotel.google_business_url) && <div className="flex items-center gap-3 mt-2">
                    {hotel.instagram_url && <a href={hotel.instagram_url.startsWith('http') ? hotel.instagram_url : `https://${hotel.instagram_url}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title="Instagram">
                        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>}
                    {hotel.tripadvisor_url && <a href={hotel.tripadvisor_url.startsWith('http') ? hotel.tripadvisor_url : `https://${hotel.tripadvisor_url}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title="TripAdvisor">
                        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.976 5.976 0 0 0 4.075 1.598 5.997 5.997 0 0 0 4.04-10.43L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM6.003 17.142a3.93 3.93 0 1 1 0-7.86 3.93 3.93 0 0 1 0 7.86zm11.994 0a3.93 3.93 0 1 1 0-7.86 3.93 3.93 0 0 1 0 7.86zM6.003 11.213a2.068 2.068 0 1 0 0 4.136 2.068 2.068 0 0 0 0-4.136zm11.994 0a2.068 2.068 0 1 0 0 4.136 2.068 2.068 0 0 0 0-4.136zM12 6.783c1.39 0 2.767.27 4.074.798a6.03 6.03 0 0 0-4.074 2.008 6.03 6.03 0 0 0-4.074-2.008A12.33 12.33 0 0 1 12 6.783z" />
                        </svg>
                      </a>}
                    {hotel.booking_url && <a href={hotel.booking_url.startsWith('http') ? hotel.booking_url : `https://${hotel.booking_url}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title="Booking.com">
                        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.273 0v24h11.819c5.485 0 9.908-4.434 9.908-9.909 0-3.604-1.926-6.818-4.909-8.545V0H2.273zm4.636 3.545h8.182v3.273c-.923-.327-1.909-.545-2.909-.545-4.636 0-8.364 3.727-8.364 8.364 0 2.909 1.455 5.454 3.727 6.909H6.909V3.545zm5.273 5.182c2.909 0 5.273 2.364 5.273 5.273s-2.364 5.273-5.273 5.273c-2.909 0-5.273-2.364-5.273-5.273s2.364-5.273 5.273-5.273z" />
                        </svg>
                      </a>}
                    {hotel.google_business_url && <a href={hotel.google_business_url.startsWith('http') ? hotel.google_business_url : `https://${hotel.google_business_url}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title="Google Meu Negócio">
                        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 11.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm0-1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0-6c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 19.52 2 14 6.48 4 12 4zm0 2c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" />
                        </svg>
                      </a>}
                  </div>}
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
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Para confirmar, digite <strong className="text-foreground">"excluir"</strong> abaixo:
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Digite excluir para confirmar"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteHotel} 
                      disabled={deleteConfirmText.toLowerCase() !== "excluir"}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Edit Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Editar Hotel</DialogTitle>
                    <DialogDescription>
                      Atualize as informações básicas do hotel
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Accordion type="single" collapsible defaultValue="dados-hotel" className="w-full py-4">
                    {/* Accordion 1 - Dados do Hotel */}
                    <AccordionItem value="dados-hotel">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Dados do Hotel
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome do Hotel</Label>
                            <Input id="edit-name" value={editForm.name} onChange={e => setEditForm({
                              ...editForm,
                              name: e.target.value
                            })} placeholder="Ex: Grand Hotel Resort" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-city">Cidade / Estado</Label>
                            <Input id="edit-city" value={editForm.city} onChange={e => setEditForm({
                              ...editForm,
                              city: e.target.value
                            })} placeholder="Ex: São Paulo, SP" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-contact">Contato Principal</Label>
                            <Input id="edit-contact" value={editForm.contact} onChange={e => setEditForm({
                              ...editForm,
                              contact: e.target.value
                            })} placeholder="Ex: João Silva - (11) 99999-9999" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-category">Categoria</Label>
                            <Select value={editForm.category} onValueChange={value => setEditForm({
                              ...editForm,
                              category: value
                            })}>
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
                          
                          <div className="space-y-2 md:col-span-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="edit-nowebsite" checked={editForm.hasNoWebsite} onCheckedChange={checked => setEditForm({
                                ...editForm,
                                hasNoWebsite: checked as boolean,
                                website: checked ? "" : editForm.website
                              })} />
                              <Label htmlFor="edit-nowebsite" className="text-sm text-muted-foreground">
                                Hotel não possui site
                              </Label>
                            </div>
                            {!editForm.hasNoWebsite && <Input id="edit-website" value={editForm.website} onChange={e => setEditForm({
                              ...editForm,
                              website: e.target.value
                            })} placeholder="https://www.seuhotel.com.br" />}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Accordion 2 - Perfil de Plataforma */}
                    <AccordionItem value="perfil-plataforma">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Perfil de Plataforma
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-instagram">Instagram</Label>
                            <Input id="edit-instagram" value={editForm.instagramUrl} onChange={e => setEditForm({
                              ...editForm,
                              instagramUrl: e.target.value
                            })} placeholder="https://instagram.com/seuhotel" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-tripadvisor">TripAdvisor</Label>
                            <Input id="edit-tripadvisor" value={editForm.tripadvisorUrl} onChange={e => setEditForm({
                              ...editForm,
                              tripadvisorUrl: e.target.value
                            })} placeholder="https://tripadvisor.com.br/Hotel_Review-..." />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-booking">Booking.com</Label>
                            <Input id="edit-booking" value={editForm.bookingUrl} onChange={e => setEditForm({
                              ...editForm,
                              bookingUrl: e.target.value
                            })} placeholder="https://booking.com/hotel/br/seuhotel.html" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-google-business">Google Meu Negócio</Label>
                            <Input id="edit-google-business" value={editForm.googleBusinessUrl} onChange={e => setEditForm({
                              ...editForm,
                              googleBusinessUrl: e.target.value
                            })} placeholder="https://g.page/seuhotel" />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Accordion 3 - Concorrentes */}
                    <AccordionItem value="concorrentes">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Concorrentes ({editableCompetitors.filter(c => c.competitor_url?.trim()).length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {editableCompetitors.map((competitor, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex-1 space-y-1">
                                <Label htmlFor={`edit-competitor-${index}`} className="text-xs text-muted-foreground">
                                  Concorrente {index + 1}
                                </Label>
                                <Input 
                                  id={`edit-competitor-${index}`} 
                                  value={competitor.competitor_url} 
                                  onChange={e => updateCompetitor(index, e.target.value)} 
                                  placeholder={`https://www.concorrente${index + 1}.com.br`} 
                                />
                              </div>
                              {editableCompetitors.length > 3 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="mt-5 h-9 w-9 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeCompetitor(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={addCompetitor}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Concorrente
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={!editForm.name || !editForm.city || isSaving}>
                      {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Strategic Materials */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{
        animationDelay: "0.05s"
      }}>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Manual de Funcionamento - Nova Seção */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Manual de Funcionamento
                {manualFormData?.is_complete && (
                  <span className="ml-auto text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {manualFormData.input_method === 'upload' ? 'Arquivo enviado' : 'Preenchido'}
                  </span>
                )}
              </label>
              
              <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/30 min-h-[120px] flex flex-col justify-center">
                {manualLoading || isUploadingManual ? (
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {isUploadingManual ? 'Enviando arquivo...' : 'Carregando...'}
                    </p>
                  </div>
                ) : manualFormData?.is_complete && manualFormData.input_method === 'upload' ? (
                  // Enviado via UPLOAD
                  <div className="text-center">
                    <FileUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-foreground font-medium mb-1 truncate max-w-[200px] mx-auto" title={manualFormData.uploaded_file_name}>
                      {manualFormData.uploaded_file_name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Enviado via upload em {manualFormData.submitted_at ? new Date(manualFormData.submitted_at).toLocaleDateString('pt-BR') : '-'}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(manualFormData.uploaded_file_url, '_blank')}>
                        <Eye className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleRemoveManualFile}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : manualFormData?.is_complete ? (
                  // Enviado via FORMULÁRIO
                  <div className="text-center">
                    <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-foreground font-medium mb-1">Formulário preenchido</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Enviado via formulário em {manualFormData.submitted_at ? new Date(manualFormData.submitted_at).toLocaleDateString('pt-BR') : '-'}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/hotel/${id}/manual-responses`)}>
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Respostas
                    </Button>
                  </div>
                ) : manualFormData && manualFormData.current_step && manualFormData.current_step > 1 ? (
                  // Em preenchimento (formulário)
                  <div className="text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-sm text-foreground font-medium mb-1">Em preenchimento</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Etapa {manualFormData.current_step} de 7
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        const link = getFormLink();
                        if (link) {
                          navigator.clipboard.writeText(link);
                          toast.success("Link copiado!");
                        }
                      }}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  // NÃO PREENCHIDO - Mostrar duas opções
                  <div className="grid grid-cols-2 gap-3">
                    {/* Opção Upload */}
                    <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-foreground font-medium mb-1">Upload de Arquivo</p>
                      <p className="text-[10px] text-muted-foreground mb-2">Já tem um documento?</p>
                      <label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          onChange={handleManualFileUpload}
                        />
                        <Button variant="default" size="sm" className="w-full" asChild>
                          <span className="cursor-pointer">
                            <FileUp className="h-3 w-3 mr-1" />
                            Anexar
                          </span>
                        </Button>
                      </label>
                    </div>
                    
                    {/* Opção Formulário */}
                    <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-foreground font-medium mb-1">Formulário Online</p>
                      <p className="text-[10px] text-muted-foreground mb-2">Preencha passo a passo</p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => {
                        const link = getFormLink();
                        if (link) {
                          navigator.clipboard.writeText(link);
                          toast.success("Link copiado!");
                        }
                      }}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dados do Hotel */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Database className="h-4 w-4 text-muted-foreground" />
                Briefing de Criação
              </label>
              <FileUpload hotelId={hotel.id} field="dados" currentUrl={materialsState.dados?.url} currentName={materialsState.dados?.name} onUploadComplete={(url, name) => handleMaterialUpload('dados', url, name)} onRemove={() => handleMaterialRemove('dados')} />
            </div>

            {/* Transcrição de Kickoff */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Transcrição de Kickoff
              </label>
              <FileUpload hotelId={hotel.id} field="transcricao" currentUrl={materialsState.transcricao?.url} currentName={materialsState.transcricao?.name} onUploadComplete={(url, name) => handleMaterialUpload('transcricao', url, name)} onRemove={() => handleMaterialRemove('transcricao')} />
            </div>

            {/* Cliente Oculto */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                Cliente Oculto
              </label>
              <FileUpload hotelId={hotel.id} field="cliente_oculto" currentUrl={materialsState.cliente_oculto?.url} currentName={materialsState.cliente_oculto?.name} onUploadComplete={(url, name) => handleMaterialUpload('cliente_oculto', url, name)} onRemove={() => handleMaterialRemove('cliente_oculto')} />
            </div>
          </div>
        </div>

        {/* Pesquisas Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{
        animationDelay: "0.08s"
      }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg text-foreground">Pesquisas</h2>
              <p className="text-sm text-muted-foreground">Dados coletados automaticamente de fontes externas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conteúdo do Site */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Conteúdo do Site
                {websiteData?.status === 'completed' ? null : hotel.website && !hotel.has_no_website ? (
                  <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Pronto para iniciar
                  </span>
                ) : (
                  <span className="ml-auto text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Pendente: Site não configurado
                  </span>
                )}
              </label>
              
              <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/30 min-h-[120px] flex flex-col justify-center">
                {hotel.has_no_website ? <div className="text-center text-muted-foreground text-sm">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Hotel não possui site</p>
                  </div> : !hotel.website ? <div className="text-center text-muted-foreground text-sm">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Nenhum site configurado</p>
                    <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={() => setIsEditDialogOpen(true)}>
                      Adicionar site
                    </Button>
                  </div> : isCrawling ? <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground mb-2">Analisando site...</p>
                    <Button variant="ghost" size="sm" onClick={cancelCrawl} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div> : websiteData?.status === 'error' ? <div className="text-center">
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm text-destructive mb-2">Erro na análise</p>
                    <Button variant="outline" size="sm" onClick={() => crawlWebsite(hotel.website!)}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Tentar novamente
                    </Button>
                  </div> : websiteData?.status === 'completed' && Array.isArray(websiteData.crawled_content) ? <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-foreground font-medium mb-1">
                      {websiteData.crawled_content.length} páginas extraídas
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Button variant="default" size="sm" onClick={() => setIsWebsiteContentOpen(true)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Conteúdo
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => crawlWebsite(hotel.website!)}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div> : <div className="text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground mb-2">Site não analisado</p>
                    <Button variant="outline" size="sm" onClick={() => crawlWebsite(hotel.website!)}>
                      <Search className="h-3 w-3 mr-1" />
                      Analisar Site
                    </Button>
                  </div>}
              </div>
            </div>

            {/* Avaliações */}
            <div className="space-y-2">
              <ReviewsCard hotelId={id!} hotelUrls={{
                google_business_url: hotel.google_business_url,
                tripadvisor_url: hotel.tripadvisor_url,
                booking_url: hotel.booking_url
              }} />
            </div>

            {/* Concorrentes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                Conteúdo dos Concorrentes
                {(() => {
                  const competitorCount = competitorData.length;
                  const completedCount = getCompletedCompetitorsCount();
                  
                  if (completedCount > 0) {
                    return null; // Não mostrar badge quando já tem dados
                  } else if (competitorCount > 0) {
                    return (
                      <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {competitorCount} concorrente(s)
                      </span>
                    );
                  } else {
                    return (
                      <span className="ml-auto text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Nenhum configurado
                      </span>
                    );
                  }
                })()}
              </label>
              
              <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/30 min-h-[120px] flex flex-col justify-center">
                {(() => {
                  const competitorCount = competitorData.length;
                  const completedCount = getCompletedCompetitorsCount();
                  
                  if (competitorCount === 0) {
                    return (
                      <div className="text-center text-muted-foreground text-sm">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhum concorrente configurado</p>
                        <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={() => setIsEditDialogOpen(true)}>
                          Adicionar concorrentes
                        </Button>
                      </div>
                    );
                  }
                  
                  if (isCompetitorsCrawling) {
                    return (
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Analisando concorrentes...</p>
                      </div>
                    );
                  }
                  
                  if (completedCount > 0) {
                    const analysisCount = getAnalysisCompletedCount();
                    return (
                      <div className="text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm text-foreground font-medium mb-1">
                          {completedCount} de {competitorCount} analisado(s)
                          {analysisCount > 0 && ` (${analysisCount} com análise LLM)`}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          {hasAnyAnalysis() && (
                            <Button variant="default" size="sm" onClick={() => setIsCompetitorAnalysisOpen(true)}>
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Análises
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => crawlCompetitors()}>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reanalisar
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm text-muted-foreground mb-2">{competitorCount} concorrente(s) configurado(s)</p>
                      <Button variant="outline" size="sm" onClick={() => crawlCompetitors()}>
                        <Search className="h-3 w-3 mr-1" />
                        Analisar Concorrentes
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Website Content Modal */}
        <WebsiteContentModal open={isWebsiteContentOpen} onOpenChange={setIsWebsiteContentOpen} pages={Array.isArray(websiteData?.crawled_content) ? websiteData.crawled_content : []} crawledAt={websiteData?.crawled_at || null} />

        {/* Meeting Links */}
        <MeetingLinksSection projectData={projectData} onSave={updateProjectData} saving={false} />

        {/* Project Phases */}
        <ProjectPhasesSection hotelId={hotel.id} hotelName={hotel.name} projectData={projectData} onUpdate={updateProjectData} />

        {/* Agents grid */}
        <div className="mb-6 animate-slide-up" style={{
        animationDelay: "0.15s"
      }}>
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">Agentes Estratégicos</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Cada agente analisa os materiais e gera insights específicos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map((agent, index) => {
          const result = getResultForModule(agent.module_id);
          const status = result?.status || 'pending';
          const isCompleted = status === 'completed';
          const isGenerating = status === 'generating';
          const hasError = status === 'error';
          const isPending = status === 'pending';
          const readiness = getReadiness(agent.module_id);
          return <div key={agent.module_id} onClick={() => navigate(`/hotel/${hotel.id}/module/${agent.module_id}`)} className={cn("bg-card border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg group animate-slide-up", isCompleted ? "border-gold/50 bg-gold-muted/20" : hasError ? "border-destructive/50" : "border-border hover:border-primary/30")} style={{
            animationDelay: `${0.2 + index * 0.03}s`
          }}>
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-colors", isCompleted ? "bg-gold text-foreground" : isGenerating ? "gradient-primary text-primary-foreground" : hasError ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground")}>
                    {isCompleted ? <Check className="h-5 w-5" /> : isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : hasError ? <AlertCircle className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {agent.module_title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {isGenerating && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Gerando...
                      </span>}
                    {isCompleted && <span className="text-xs bg-gold/20 text-foreground px-2 py-1 rounded-full">
                        Concluído
                      </span>}
                    {hasError && <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                        Erro
                      </span>}
                    {isPending && readiness && (readiness.isReady ? <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Pronto para iniciar
                        </span> : readiness.missingCount > 0 && <Popover>
                          <PopoverTrigger asChild>
                            <button onClick={e => e.stopPropagation()} className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-amber-500/20 transition-colors">
                              <AlertCircle className="h-3 w-3" />
                              Materiais pendentes ({readiness.missingCount})
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3" onClick={e => e.stopPropagation()}>
                            <p className="font-medium text-sm mb-2">Materiais pendentes:</p>
                            <ul className="text-sm space-y-1">
                              {readiness.missingLabels.map((label, idx) => <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                  {label}
                                </li>)}
                            </ul>
                          </PopoverContent>
                        </Popover>)}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>;
        })}
        </div>

        {/* Client View Button */}
        <div className="mt-8 flex justify-end gap-3">
          <Button 
            variant="outline"
            size="lg"
            onClick={() => {
              const publicUrl = `${window.location.origin}/v/${hotel.slug}`;
              navigator.clipboard.writeText(publicUrl);
              toast.success("Link copiado para a área de transferência!");
            }}
          >
            <Copy className="h-5 w-5 mr-2" />
            Copiar Link Público
          </Button>
          <Button 
            variant="outline"
            size="lg"
            onClick={() => window.open(`/v/${hotel.slug}`, '_blank')}
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Abrir Visualização Pública
          </Button>
          <Button 
            onClick={() => navigate(`/hotel/${hotel.id}/client-view`)}
            size="lg"
            className="shadow-md"
          >
            <Eye className="h-5 w-5 mr-2" />
            Visualização do Cliente
          </Button>
        </div>

      {/* Floating HotelGPT Button */}
      <Button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg gradient-primary hover:scale-105 transition-transform z-40" size="icon">
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* HotelGPT Chat Overlay */}
      {isChatOpen && <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsChatOpen(false)} />
          <div className="absolute bottom-0 right-0 w-full sm:bottom-6 sm:right-6 sm:w-[400px] h-[80vh] sm:h-[600px] animate-fade-in">
            <HotelChat hotelId={hotel.id} hotelName={hotel.name} onClose={() => setIsChatOpen(false)} />
          </div>
        </div>}

      {/* Website Content Modal */}
      <WebsiteContentModal 
        open={isWebsiteContentOpen} 
        onOpenChange={setIsWebsiteContentOpen} 
        pages={Array.isArray(websiteData?.crawled_content) ? websiteData.crawled_content : []}
        crawledAt={websiteData?.crawled_at || null}
      />

      {/* Competitor Analysis Modal */}
      <CompetitorAnalysisModal
        open={isCompetitorAnalysisOpen}
        onOpenChange={setIsCompetitorAnalysisOpen}
        competitors={competitorData}
      />

    </div>;
}