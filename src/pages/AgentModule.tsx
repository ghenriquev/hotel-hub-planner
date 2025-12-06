import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { useAgentResult } from "@/hooks/useAgentResults";
import { useAgentConfigs } from "@/hooks/useAgentConfigs";
import { getAgentById } from "@/lib/agents-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Presentation
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentModule() {
  const navigate = useNavigate();
  const { id: hotelId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const { getHotel } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const hotel = getHotel(hotelId || "");
  const moduleIdNum = parseInt(moduleId || "0", 10);
  const agent = getAgentById(moduleIdNum);
  
  const { result, loading, refetch } = useAgentResult(hotelId || "", moduleIdNum);
  const { configs } = useAgentConfigs();
  
  // Get the output type for this module
  const agentConfig = configs.find(c => c.module_id === moduleIdNum);
  const outputType = agentConfig?.output_type || 'text';

  // Poll for updates while generating
  useEffect(() => {
    if (result?.status === 'generating' || isGenerating) {
      const interval = setInterval(() => {
        refetch();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [result?.status, isGenerating, refetch]);

  // Update isGenerating based on result status
  useEffect(() => {
    if (result?.status === 'completed' || result?.status === 'error') {
      setIsGenerating(false);
    }
  }, [result?.status]);

  if (!hotel || !agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl text-foreground mb-4">Módulo não encontrado</h2>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-module', {
        body: {
          hotelId: hotel.id,
          moduleId: moduleIdNum,
          materials: hotel.strategicMaterials || {}
        }
      });

      if (error) {
        console.error('Error generating analysis:', error);
        toast.error('Erro ao gerar análise. Tente novamente.');
        setIsGenerating(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsGenerating(false);
        return;
      }

      toast.success('Análise gerada com sucesso!');
      refetch();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro inesperado. Tente novamente.');
      setIsGenerating(false);
    }
  };

  const handlePrevModule = () => {
    if (moduleIdNum > 0) {
      navigate(`/hotel/${hotel.id}/module/${moduleIdNum - 1}`);
    }
  };

  const handleNextModule = () => {
    if (moduleIdNum < 10) {
      navigate(`/hotel/${hotel.id}/module/${moduleIdNum + 1}`);
    }
  };

  const currentStatus = result?.status || 'pending';
  const isProcessing = currentStatus === 'generating' || isGenerating;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/hotel/${hotel.id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{hotel.name}</span>
            <span className="hidden sm:inline">•</span>
            <span>Agente {moduleIdNum + 1} de 11</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Agent Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
              currentStatus === 'completed' 
                ? "bg-gold text-foreground" 
                : "gradient-primary text-primary-foreground"
            )}>
              {currentStatus === 'completed' ? <CheckCircle2 className="h-6 w-6" /> : `#${moduleIdNum}`}
            </div>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl text-foreground">
                {agent.title}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">{agent.description}</p>
                {outputType === 'presentation' && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    <Presentation className="h-3 w-3" />
                    Apresentação
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status and Action */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentStatus === 'pending' && (
                <>
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Aguardando análise</span>
                </>
              )}
              {isProcessing && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-primary">
                    {outputType === 'presentation' 
                      ? 'Gerando análise e apresentação...' 
                      : 'Gerando análise...'}
                  </span>
                </>
              )}
              {currentStatus === 'completed' && !isProcessing && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-gold" />
                  <span className="text-foreground">Análise concluída</span>
                </>
              )}
              {currentStatus === 'error' && !isProcessing && (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Erro na análise</span>
                </>
              )}
            </div>

            <Button
              onClick={handleGenerateAnalysis}
              disabled={isProcessing}
              className="gap-2"
              variant={currentStatus === 'completed' ? 'outline' : 'default'}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : currentStatus === 'completed' ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerar
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Análise
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Result Display */}
        {loading ? (
          <div className="bg-card border border-border rounded-xl p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : result?.result ? (
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {/* Section 1: Text Response (always visible) */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Resposta do Prompt</h2>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {result.result}
                </div>
              </div>
              {result.generated_at && (
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  Gerado em: {new Date(result.generated_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>

            {/* Section 2: Presentation (if output type is presentation) */}
            {outputType === 'presentation' && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border">
                  <Presentation className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg text-foreground">Apresentação Gamma</h2>
                </div>
                
                {result.presentation_url ? (
                  <>
                    <div className="aspect-video w-full">
                      <iframe 
                        src={result.presentation_url} 
                        className="w-full h-full"
                        allowFullScreen
                        title="Apresentação Gamma"
                      />
                    </div>
                    
                    <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Apresentação gerada via Gamma</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(result.presentation_url!, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir no Gamma
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">
                      Apresentação não foi gerada. Verifique a configuração da API Gamma.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAnalysis}
                      disabled={isProcessing}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Tentar Novamente
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : !isProcessing && (
          <div className="bg-card border border-border rounded-xl p-12 text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-display text-lg text-foreground mb-2">Nenhuma análise ainda</h3>
            <p className="text-muted-foreground mb-6">
              Clique em "Gerar Análise" para o agente processar os materiais do hotel
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button
            variant="outline"
            onClick={handlePrevModule}
            disabled={moduleIdNum === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            variant="outline"
            onClick={handleNextModule}
            disabled={moduleIdNum === 10}
            className="gap-2"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}