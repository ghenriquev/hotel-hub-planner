import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText, Building2, Video, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHotel } from "@/hooks/useHotels";
import { useAgentResults } from "@/hooks/useAgentResults";
import { useAgentConfigs } from "@/hooks/useAgentConfigs";
import { useUserRole } from "@/hooks/useUserRole";
import { useHotelMaterials } from "@/hooks/useHotelMaterials";
import { useHotelProjectData } from "@/hooks/useHotelProjectData";
import { MeetingLinksSection } from "@/components/MeetingLinksSection";
import { Loader2 } from "lucide-react";

export default function ClientView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hotel, loading: hotelLoading } = useHotel(id);
  const { results, loading: resultsLoading } = useAgentResults(id || "");
  const { configs, loading: configsLoading } = useAgentConfigs();
  const { isAdmin } = useUserRole();
  const { materialsState, loading: materialsLoading } = useHotelMaterials(id);
  const { projectData, loading: projectLoading } = useHotelProjectData(id);

  const completedResults = results
    .filter(r => r.status === 'completed')
    .map(r => {
      const config = configs.find(c => c.module_id === r.module_id);
      const fallbackTitle = r.module_id === 9999 ? "Resumo Estratégico" : `Agente ${r.module_id}`;
      return {
        moduleId: r.module_id,
        moduleTitle: config?.module_title || fallbackTitle,
        outputType: config?.output_type || 'text',
        presentationUrl: r.presentation_url,
        hasTextResult: !!r.result,
        displayOrder: config?.display_order ?? 999
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const totalResults = completedResults.length + (materialsState.cliente_oculto ? 1 : 0);

  if (hotelLoading || configsLoading || resultsLoading || materialsLoading || projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const meetingLinks = [
    { label: "Reunião de Kick-OFF", url: projectData?.meeting_kickoff_url },
    { label: "Reunião Entrega Fase 1", url: projectData?.meeting_phase1_url },
    { label: "Reunião Entrega Fase 2", url: projectData?.meeting_phase2_url },
    { label: "Reunião Entrega Final", url: projectData?.meeting_final_url },
  ].filter(m => m.url);

  const phases = [
    { 
      label: "Fase 1 – Kick Off & Alinhamento", 
      url: projectData?.phase1_presentation_url || 'https://gamma.app/docs/KICK-OFF-Plano-Estrategico-de-Vendas-Diretas-5ul4lfxo39kby07?mode=doc',
      available: true 
    },
    { 
      label: "Fase 2 – Estratégia", 
      url: projectData?.phase2_presentation_url,
      available: projectData?.phase2_status === 'completed'
    },
    { 
      label: "Fases 3 & 4 – Construção & Ativação", 
      url: `/hotel/${id}/deliverables`,
      available: true,
      isDeliverables: true
    },
    { 
      label: "Fase 5 – Relatório Final", 
      url: projectData?.phase5_presentation_url,
      available: projectData?.phase5_status === 'completed'
    },
  ];

  return (
    <div className="p-6">
      {isAdmin && (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/hotel/${id}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center">
          <Building2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl text-foreground">{hotel.name}</h1>
          <p className="text-muted-foreground">
            {totalResults} resultado(s) disponível(is)
          </p>
        </div>
      </div>

      {/* Meeting Links (read-only) */}
      {meetingLinks.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Video className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg text-foreground">Reuniões</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meetingLinks.map((m, i) => (
              <a key={i} href={m.url!} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border border-border rounded-lg hover:border-primary/30 transition-colors">
                <ExternalLink className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">{m.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Phases */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg text-foreground">Etapas do Projeto</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {phases.map((phase, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <span className="text-sm font-medium text-foreground">{phase.label}</span>
              {phase.available && phase.url ? (
                <a href={phase.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-sm">
                  <ExternalLink className="h-3 w-3" />
                  Abrir
                </a>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Em breve</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {completedResults.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum resultado disponível ainda</p>
          </div>
        ) : (
          completedResults.map((item) => (
            <div key={item.moduleId} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
              <span className="font-medium text-foreground text-lg">{item.moduleTitle}</span>
              {item.presentationUrl ? (
                <a href={item.presentationUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                  Abrir Apresentação
                </a>
              ) : item.hasTextResult && isAdmin ? (
                <Button onClick={() => navigate(`/hotel/${id}/module/${item.moduleId}`)} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ver Relatório
                </Button>
              ) : item.hasTextResult ? (
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">Relatório disponível</span>
              ) : (
                <span className="text-sm text-muted-foreground">Sem resultado</span>
              )}
            </div>
          ))
        )}

        {materialsState.cliente_oculto && (
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
            <span className="font-medium text-foreground text-lg">Cliente Oculto</span>
            <a href={materialsState.cliente_oculto.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <FileText className="h-4 w-4" />
              Abrir Documento
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
