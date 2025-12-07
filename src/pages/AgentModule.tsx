import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Presentation,
  Cpu,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to get friendly model name
function getModelDisplayName(model: string | null): string {
  if (!model) return 'Modelo desconhecido';
  
  const modelNames: Record<string, string> = {
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'google/gemini-3-pro-preview': 'Gemini 3 Pro',
    'openai/gpt-5': 'GPT-5',
    'openai/gpt-5-mini': 'GPT-5 Mini',
    'openai/gpt-5-nano': 'GPT-5 Nano',
    'anthropic/claude-sonnet-4-5': 'Claude Sonnet 4.5',
    'anthropic/claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  };
  
  return modelNames[model] || model.split('/').pop() || model;
}

export default function AgentModule() {
  const navigate = useNavigate();
  const { id: hotelId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const { getHotel } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPresentation, setIsCreatingPresentation] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  
  const hotel = getHotel(hotelId || "");
  const moduleIdNum = parseInt(moduleId || "0", 10);
  const agent = getAgentById(moduleIdNum);
  
  const { result, loading, refetch } = useAgentResult(hotelId || "", moduleIdNum);
  const { configs } = useAgentConfigs();
  
  // Get the output type for this module
  const agentConfig = configs.find(c => c.module_id === moduleIdNum);
  const outputType = agentConfig?.output_type || 'text';

  // Sync editedText with result
  useEffect(() => {
    if (result?.result) {
      setEditedText(result.result);
    }
  }, [result?.result]);

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
      setGenerationStartTime(null);
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
    setGenerationStartTime(Date.now());
    setIsEditing(false);
    
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

  const handleCreatePresentation = async () => {
    if (!editedText.trim()) {
      toast.error('O texto não pode estar vazio.');
      return;
    }
    
    setIsCreatingPresentation(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-presentation', {
        body: {
          hotelId: hotel.id,
          moduleId: moduleIdNum,
          text: editedText
        }
      });

      if (error) {
        console.error('Error creating presentation:', error);
        toast.error('Erro ao criar apresentação. Tente novamente.');
        setIsCreatingPresentation(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsCreatingPresentation(false);
        return;
      }

      toast.success('Apresentação criada com sucesso!');
      refetch();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsCreatingPresentation(false);
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
  
  // Detect if stuck (generating for more than 3 minutes from when we started)
  const isStuck = isProcessing && generationStartTime !== null && 
    (Date.now() - generationStartTime > 3 * 60 * 1000);

  const handleCancelGeneration = async () => {
    try {
      const { error } = await supabase
        .from('agent_results')
        .update({ status: 'pending' })
        .eq('hotel_id', hotelId)
        .eq('module_id', moduleIdNum);
      
      if (error) {
        toast.error('Erro ao cancelar. Tente novamente.');
        return;
      }
      
      setIsGenerating(false);
      setGenerationStartTime(null);
      toast.info('Processamento cancelado. Você pode tentar novamente.');
      refetch();
    } catch (err) {
      toast.error('Erro inesperado.');
    }
  };

  const hasTextResult = result?.result && result.result.trim().length > 0;
  const hasPresentationUrl = result?.presentation_url;
  const needsPresentation = outputType === 'presentation' && hasTextResult && !hasPresentationUrl;

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
              "w-12 h-12 flex items-center justify-center text-lg font-bold",
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
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5">
                    <Presentation className="h-3 w-3" />
                    Apresentação
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status and Action */}
        <div className="bg-card border border-border p-6 mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentStatus === 'pending' && (
                <>
                  <div className="w-3 h-3 bg-muted-foreground" />
                  <span className="text-muted-foreground">Aguardando análise</span>
                </>
              )}
              {isProcessing && !isStuck && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-primary">Gerando análise...</span>
                </>
              )}
              {isStuck && (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-500">Processamento travado</span>
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

            <div className="flex gap-2">
              {isStuck && (
                <Button
                  onClick={handleCancelGeneration}
                  variant="outline"
                  className="gap-2 border-amber-500 text-amber-500 hover:bg-amber-500/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Cancelar e Reiniciar
                </Button>
              )}
              <Button
                onClick={handleGenerateAnalysis}
                disabled={isProcessing && !isStuck}
                className="gap-2"
                variant={currentStatus === 'completed' ? 'outline' : 'default'}
              >
                {isProcessing && !isStuck ? (
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
        </div>

        {/* Result Display */}
        {loading ? (
          <div className="bg-card border border-border p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasTextResult ? (
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {/* Section 1: Text Response with LLM info */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg text-foreground">Resposta do Prompt</h2>
                </div>
                
                {/* LLM Model Badge */}
                <Badge variant="secondary" className="gap-1.5">
                  <Cpu className="h-3 w-3" />
                  {getModelDisplayName(result?.llm_model_used || null)}
                </Badge>
              </div>

              {/* Editable textarea or display */}
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Edite o texto antes de criar a apresentação..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditedText(result?.result || '');
                        setIsEditing(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Salvar Edição
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {editedText || result?.result}
                    </div>
                  </div>
                  
                  {/* Edit button overlay */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1.5"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </div>
              )}

              {result?.generated_at && (
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  Gerado em: {new Date(result.generated_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>

            {/* Section 2: Presentation (if output type is presentation) */}
            {outputType === 'presentation' && (
              <div className="bg-card border border-border overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border">
                  <Presentation className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg text-foreground">Apresentação Gamma</h2>
                </div>
                
                {hasPresentationUrl ? (
                  <>
                    <div className="aspect-video w-full">
                      <iframe 
                        src={result.presentation_url!} 
                        className="w-full h-full"
                        allowFullScreen
                        title="Apresentação Gamma"
                      />
                    </div>
                    
                    <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Apresentação gerada via Gamma</span>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreatePresentation}
                          disabled={isCreatingPresentation}
                          className="gap-2"
                        >
                          {isCreatingPresentation ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Regenerando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Regenerar Apresentação
                            </>
                          )}
                        </Button>
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
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <Presentation className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                    <p className="text-muted-foreground mb-2">
                      Revise o texto acima e clique para criar a apresentação.
                    </p>
                    <p className="text-xs text-muted-foreground mb-6">
                      Você pode editar o texto antes de gerar a apresentação.
                    </p>
                    <Button
                      onClick={handleCreatePresentation}
                      disabled={isCreatingPresentation}
                      className="gap-2"
                      size="lg"
                    >
                      {isCreatingPresentation ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Criando Apresentação...
                        </>
                      ) : (
                        <>
                          <Presentation className="h-5 w-5" />
                          Criar Apresentação Gamma
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : !isProcessing && (
          <div className="bg-card border border-border p-12 text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
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
