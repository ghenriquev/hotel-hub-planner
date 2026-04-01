import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Sparkles, FileText, Package, BarChart3, CheckCircle2, Pause, Lock } from "lucide-react";
import { HotelProjectData } from "@/hooks/useHotelProjectData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface ProjectPhasesSectionProps {
  hotelId: string;
  hotelName: string;
  projectData: HotelProjectData | null;
  onUpdate: (updates: Partial<HotelProjectData>) => Promise<boolean>;
  readOnly?: boolean;
}

export function ProjectPhasesSection({ hotelId, hotelName, projectData, onUpdate, readOnly }: ProjectPhasesSectionProps & { refetchProjectData?: () => void }) {
  const navigate = useNavigate();
  const [generatingPhase2, setGeneratingPhase2] = useState(false);
  const [generatingPhase5, setGeneratingPhase5] = useState(false);

  const phase2Status = projectData?.phase2_status || 'pending';
  const phase5Status = projectData?.phase5_status || 'pending';

  const phase34Complete = hasDeliverables(projectData?.phase34_deliverables);

  useEffect(() => {
    if (generatingPhase2 && (projectData?.phase2_status === 'completed' || projectData?.phase2_status === 'error')) {
      setGeneratingPhase2(false);
    }
  }, [projectData?.phase2_status, generatingPhase2]);

  useEffect(() => {
    if (generatingPhase5 && (projectData?.phase5_status === 'completed' || projectData?.phase5_status === 'error')) {
      setGeneratingPhase5(false);
    }
  }, [projectData?.phase5_status, generatingPhase5]);

  const handlePhase1Click = () => {
    const url = projectData?.phase1_presentation_url || 'https://gamma.app/docs/KICK-OFF-Plano-Estrategico-de-Vendas-Diretas-5ul4lfxo39kby07?mode=doc';
    window.open(url, '_blank');
  };

  const handlePhase2Generate = async () => {
    setGeneratingPhase2(true);
    try {
      const { error } = await supabase.functions.invoke('generate-strategic-summary', {
        body: { hotelId }
      });
      if (error) throw error;
      toast.success("Geração iniciada! Aguarde...");
    } catch (err) {
      console.error("Error generating phase 2:", err);
      setGeneratingPhase2(false);
      toast.error("Erro ao gerar resumo estratégico");
    }
  };

  const handlePhase2Pause = async () => {
    await onUpdate({ phase2_status: 'pending' });
    setGeneratingPhase2(false);
    toast.info("Geração pausada");
  };

  const handlePhase34Click = () => {
    navigate(`/hotel/${hotelId}/deliverables`);
  };

  const handlePhase5Generate = async () => {
    if (!phase34Complete) {
      toast.error("Complete as entregas das Fases 3 e 4 antes de gerar o relatório final.");
      return;
    }
    setGeneratingPhase5(true);
    try {
      const { error } = await supabase.functions.invoke('generate-final-report', {
        body: { hotelId }
      });
      if (error) throw error;
      toast.success("Geração iniciada! Aguarde...");
    } catch (err) {
      console.error("Error generating phase 5:", err);
      setGeneratingPhase5(false);
      toast.error("Erro ao gerar relatório final");
    }
  };

  const handlePhase5Pause = async () => {
    await onUpdate({ phase5_status: 'pending' });
    setGeneratingPhase5(false);
    toast.info("Geração pausada");
  };

  const isPhase2Generating = generatingPhase2 || phase2Status === 'generating';
  const isPhase5Generating = generatingPhase5 || phase5Status === 'generating';

  const phases = [
    {
      number: 1,
      title: "Kick Off & Alinhamento",
      subtitle: "Apresentação do Kick Off",
      icon: Sparkles,
      status: 'completed' as const,
      onClick: handlePhase1Click,
      actionLabel: "Abrir Apresentação",
      actionIcon: ExternalLink,
      isGenerating: false,
      locked: false,
    },
    {
      number: 2,
      title: "Estratégia",
      subtitle: "Resumo consolidado dos agentes estratégicos",
      icon: BarChart3,
      status: phase2Status,
      onClick: phase2Status === 'completed'
        ? () => navigate(`/hotel/${hotelId}/strategic-summary`)
        : handlePhase2Generate,
      actionLabel: phase2Status === 'completed' ? "Ver Resumo" : isPhase2Generating ? "Gerando..." : "Gerar Resumo",
      actionIcon: phase2Status === 'completed' ? FileText : isPhase2Generating ? Loader2 : Sparkles,
      isGenerating: isPhase2Generating,
      onPause: handlePhase2Pause,
      presentationUrl: projectData?.phase2_presentation_url,
      locked: false,
    },
    {
      number: 3,
      title: "Construção & Ativação",
      subtitle: "Entregas das Fases 3 e 4",
      icon: Package,
      status: phase34Complete ? 'completed' as const : 'pending' as const,
      onClick: handlePhase34Click,
      actionLabel: "Ver Entregas",
      actionIcon: FileText,
      isGenerating: false,
      locked: false,
    },
    {
      number: 5,
      title: "Relatório Final",
      subtitle: "Relatório consolidado e proposta de continuidade",
      icon: FileText,
      status: phase5Status,
      onClick: phase5Status === 'completed'
        ? () => navigate(`/hotel/${hotelId}/final-report`)
        : handlePhase5Generate,
      actionLabel: phase5Status === 'completed' ? "Ver Relatório" : isPhase5Generating ? "Gerando..." : "Gerar Relatório",
      actionIcon: phase5Status === 'completed' ? FileText : isPhase5Generating ? Loader2 : Sparkles,
      isGenerating: isPhase5Generating,
      onPause: handlePhase5Pause,
      presentationUrl: projectData?.phase5_presentation_url,
      locked: !phase34Complete && phase5Status !== 'completed',
    },
  ];

  return (
    <div className="bg-card border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg text-foreground">Etapas do Projeto</h2>
          <p className="text-sm text-muted-foreground">Acompanhe as fases do plano estratégico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map(phase => (
          <div
            key={phase.number}
            className={cn(
              "border rounded-xl p-5 transition-all duration-200 group",
              phase.locked ? "border-border opacity-60 cursor-not-allowed" :
              phase.status === 'completed' ? "border-gold/50 bg-gold-muted/20 hover:shadow-lg cursor-pointer" :
              phase.status === 'generating' ? "border-primary/50 cursor-pointer" :
              phase.status === 'error' ? "border-destructive/50 cursor-pointer" :
              "border-border hover:border-primary/30 hover:shadow-lg cursor-pointer"
            )}
            onClick={phase.locked || phase.isGenerating ? undefined : phase.onClick}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                phase.locked ? "bg-muted text-muted-foreground" :
                phase.status === 'completed' ? "bg-gold text-foreground" :
                phase.status === 'generating' ? "gradient-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {phase.locked ? <Lock className="h-4 w-4" /> :
                 phase.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                 phase.status === 'generating' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                 phase.number}
              </div>
              <span className="text-xs text-muted-foreground font-medium">Fase {phase.number === 3 ? '3 & 4' : phase.number}</span>
            </div>

            <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
              {phase.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">{phase.subtitle}</p>

            {phase.locked ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Complete as Fases 3 & 4 primeiro
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant={phase.status === 'completed' ? "default" : "outline"}
                  size="sm"
                  className={cn("text-xs", phase.isGenerating && phase.onPause ? "flex-1" : "w-full")}
                  disabled={phase.isGenerating}
                  onClick={e => { e.stopPropagation(); phase.onClick(); }}
                >
                  {phase.isGenerating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <phase.actionIcon className="h-3 w-3 mr-1" />
                  )}
                  {phase.actionLabel}
                </Button>
                {phase.isGenerating && phase.onPause && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2"
                    onClick={e => { e.stopPropagation(); phase.onPause!(); }}
                    title="Pausar geração"
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            {phase.presentationUrl && (
              <a
                href={phase.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Abrir Apresentação Gamma
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function hasDeliverables(deliverables: Record<string, any> | undefined): boolean {
  if (!deliverables) return false;
  return Object.values(deliverables).some(v => v && typeof v === 'object' && Object.values(v).some(inner => inner));
}
