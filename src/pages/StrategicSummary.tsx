import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useHotel } from "@/hooks/useHotels";
import { useHotelProjectData } from "@/hooks/useHotelProjectData";
import { ArrowLeft, Loader2, BarChart3, ExternalLink, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function StrategicSummary() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hotel, loading: hotelLoading } = useHotel(id);
  const { projectData, loading, refetch } = useHotelProjectData(id);
  const [regenerating, setRegenerating] = useState(false);

  // Poll for completion when status is 'generating'
  useEffect(() => {
    if (projectData?.phase2_status !== 'generating') return;
    setRegenerating(true);
    const interval = setInterval(() => { refetch(); }, 3000);
    return () => clearInterval(interval);
  }, [projectData?.phase2_status, refetch]);

  // When status changes from generating to completed/error
  useEffect(() => {
    if (!regenerating) return;
    if (projectData?.phase2_status === 'completed') {
      setRegenerating(false);
      toast.success("Resumo gerado com sucesso!");
    } else if (projectData?.phase2_status === 'error') {
      setRegenerating(false);
      toast.error("Erro ao gerar resumo");
    }
  }, [projectData?.phase2_status, regenerating]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-strategic-summary', {
        body: { hotelId: id }
      });
      if (error) throw error;
      // Function returns immediately, polling handles the rest
    } catch (err) {
      console.error(err);
      setRegenerating(false);
      toast.error("Erro ao iniciar geração do resumo");
    }
  };

  if (loading || hotelLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/hotel/${id}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para {hotel?.name}
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-foreground">Resumo Estratégico</h1>
            <p className="text-sm text-muted-foreground">Fase 2 - Estratégia - {hotel?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {projectData?.phase2_presentation_url && (
            <a href={projectData.phase2_presentation_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Apresentação
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {regenerating ? "Gerando..." : "Regenerar"}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        {regenerating ? (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p>Gerando resumo estratégico...</p>
            <p className="text-xs mt-2">Isso pode levar alguns minutos</p>
          </div>
        ) : projectData?.phase2_summary ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{projectData.phase2_summary}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum resumo gerado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
