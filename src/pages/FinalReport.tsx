import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useHotel } from "@/hooks/useHotels";
import { useHotelProjectData } from "@/hooks/useHotelProjectData";
import { ArrowLeft, Loader2, FileText, ExternalLink, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export default function FinalReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hotel, loading: hotelLoading } = useHotel(id);
  const { projectData, loading, updateProjectData } = useHotelProjectData(id);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    await updateProjectData({ phase5_status: 'generating' });

    try {
      const { data, error } = await supabase.functions.invoke('generate-final-report', {
        body: { hotelId: id }
      });

      if (error) throw error;

      await updateProjectData({
        phase5_report: data.report,
        phase5_presentation_url: data.presentationUrl || null,
        phase5_status: 'completed',
        phase5_generated_at: new Date().toISOString()
      });

      toast.success("Relatório regenerado com sucesso!");
    } catch (err) {
      console.error(err);
      await updateProjectData({ phase5_status: 'error' });
      toast.error("Erro ao regenerar relatório");
    } finally {
      setRegenerating(false);
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
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-foreground">Relatório Final</h1>
            <p className="text-sm text-muted-foreground">Fase 5 - 60 Dias de Transformação Digital - {hotel?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {projectData?.phase5_presentation_url && (
            <a href={projectData.phase5_presentation_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Apresentação
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Regenerar
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        {projectData?.phase5_report ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{projectData.phase5_report}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum relatório gerado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
