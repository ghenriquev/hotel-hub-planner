import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { useHotel } from "@/hooks/useHotels";
import { useAgentResult } from "@/hooks/useAgentResults";
import { useAgentConfigs } from "@/hooks/useAgentConfigs";
import { useAgentReadiness } from "@/hooks/useAgentReadiness";
import { useApiKeys } from "@/hooks/useApiKeys";
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
  Edit3,
  XCircle,
  FileText,
  FileCheck,
  Bot,
  Search,
  ChevronDown,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper to get friendly model name
function getModelDisplayName(model: string | null): string {
  if (!model) return 'Modelo desconhecido';

  const modelNames: Record<string, string> = {
    'google/gemini-3-pro-preview': 'Gemini 3 Pro',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'google/gemini-2.0-flash': 'Gemini 2.0 Flash',
    'openai/gpt-5': 'GPT-5',
    'openai/gpt-5-mini': 'GPT-5 Mini',
    'openai/gpt-5-nano': 'GPT-5 Nano',
    'openai/gpt-4o': 'GPT-4o',
    'openai/gpt-4o-mini': 'GPT-4o Mini',
    'anthropic/claude-sonnet-4-5': 'Claude Sonnet 4.5',
    'anthropic/claude-3-5-haiku': 'Claude 3.5 Haiku',
    'manus/agent-1.5': 'Manus Agent 1.5',
    'manus/agent-1.5-lite': 'Manus Agent Lite',
  };

  return modelNames[model] || model.split('/').pop() || model;
}

// All models grouped by provider (require API key)
const MODELS_BY_PROVIDER: Record<string, { value: string; label: string; icon: string }[]> = {
  google: [
    { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", icon: "🔮" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", icon: "🔮" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", icon: "🔮" },
    { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", icon: "🔮" },
    { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash", icon: "🔮" },
  ],
  openai: [
    { value: "openai/gpt-5", label: "GPT-5", icon: "🤖" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini", icon: "🤖" },
    { value: "openai/gpt-5-nano", label: "GPT-5 Nano", icon: "🤖" },
    { value: "openai/gpt-4o", label: "GPT-4o", icon: "🤖" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", icon: "🤖" },
  ],
  anthropic: [
    { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5", icon: "🧠" },
    { value: "anthropic/claude-3-5-haiku", label: "Claude 3.5 Haiku", icon: "🧠" },
  ],
  manus: [
    { value: "manus/agent-1.5", label: "Manus Agent 1.5", icon: "🔧" },
    { value: "manus/agent-1.5-lite", label: "Manus Agent Lite", icon: "🔧" },
  ],
};

export default function AgentModule() {
  const navigate = useNavigate();
  const { id: hotelId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const { hotel, loading: hotelLoading } = useHotel(hotelId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPresentation, setIsCreatingPresentation] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  
  const moduleIdNum = parseInt(moduleId || "0", 10);
  const agent = getAgentById(moduleIdNum);
  
  const { result, loading, refetch } = useAgentResult(hotelId || "", moduleIdNum);
  const { configs, updateConfig } = useAgentConfigs();
  const { isReady, isLoading: readinessLoading, materials, missingMaterials } = useAgentReadiness(hotelId || "", moduleIdNum);
  const { apiKeys } = useApiKeys();
  const [materialsExpanded, setMaterialsExpanded] = useState(false);
  const [isChangingModel, setIsChangingModel] = useState(false);
  
  // Get the output type for this module
  const agentConfig = configs.find(c => c.module_id === moduleIdNum);
  const outputType = agentConfig?.output_type || 'text';

  // Get active API key types
  const getActiveApiKeyTypes = (): string[] => {
    return apiKeys.filter(k => k.is_active).map(k => k.key_type);
  };

  // Get available models based on active API keys
  const getAvailableModels = () => {
    const activeTypes = getActiveApiKeyTypes();
    const result: { provider: string; models: { value: string; label: string; icon: string }[] }[] = [];

    for (const [provider, models] of Object.entries(MODELS_BY_PROVIDER)) {
      if (activeTypes.includes(provider)) {
        result.push({ provider, models });
      }
    }

    return result;
  };

  const handleChangeModel = async (newModel: string) => {
    setIsChangingModel(true);
    const success = await updateConfig(moduleIdNum, { llm_model: newModel });
    setIsChangingModel(false);
    if (success) {
      // Toast is already shown by updateConfig
    }
  };

  // Sync editedText with result
  useEffect(() => {
    if (result?.result) {
      setEditedText(result.result);
    }
  }, [result?.result]);

  // Poll for updates while generating analysis OR presentation OR processing in Manus
  useEffect(() => {
    const shouldPollAnalysis = result?.status === 'generating' || isGenerating;
    const shouldPollPresentation = result?.presentation_status === 'generating';
    const shouldPollManus = result?.status === 'processing_manus';
    
    if (shouldPollManus && result?.result) {
      // For Manus, we need to call manus-check-status to update the result
      const checkManusStatus = async () => {
        try {
          const resultData = JSON.parse(result.result);
          const taskId = resultData.manus_task_id;
          
          if (taskId) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manus-check-status`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                hotelId,
                moduleId: moduleIdNum,
                taskId,
                type: 'agent'
              }),
            });
          }
        } catch (e) {
          console.error("Error checking Manus status:", e);
        }
        refetch();
      };
      
      checkManusStatus(); // Check immediately
      const interval = setInterval(checkManusStatus, 10000);
      return () => clearInterval(interval);
    }
    
    if (shouldPollAnalysis || shouldPollPresentation) {
      const interval = setInterval(() => {
        refetch();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [result?.status, result?.result, result?.presentation_status, isGenerating, refetch, hotelId, moduleIdNum]);

  // Sync isCreatingPresentation with database status
  useEffect(() => {
    if (result?.presentation_status === 'generating') {
      setIsCreatingPresentation(true);
    } else if (result?.presentation_status === 'completed' || result?.presentation_status === 'error') {
      setIsCreatingPresentation(false);
    }
  }, [result?.presentation_status]);

  // Update isGenerating based on result status
  useEffect(() => {
    if (result?.status === 'completed' || result?.status === 'error') {
      setIsGenerating(false);
      setGenerationStartTime(null);
    }
  }, [result?.status]);

  // Show loading state while hotel is being fetched
  if (hotelLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          moduleId: moduleIdNum
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

      // If async (background processing), keep generating state and poll
      if (data?.async) {
        toast.success('Análise iniciada! O resultado será atualizado automaticamente.');
        // Start polling for result
        const pollInterval = setInterval(async () => {
          await refetch();
        }, 3000);
        // Clear polling after 5 minutes max
        setTimeout(() => clearInterval(pollInterval), 300000);
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

      // Success - the function returns immediately, polling will track the status
      toast.success('Apresentação sendo criada em background...');
      refetch();
      // Don't set isCreatingPresentation to false here - the polling will handle that
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro inesperado. Tente novamente.');
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
  const isProcessingManus = currentStatus === 'processing_manus';
  
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
  const presentationStatus = result?.presentation_status;
  const isPresentationGenerating = presentationStatus === 'generating' || isCreatingPresentation;
  const isPresentationError = presentationStatus === 'error';
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
                <p className="text-muted-foreground">{agent.description}</p>
              <div className="flex items-center gap-2 mt-2">
                {outputType === 'presentation' && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5">
                    <Presentation className="h-3 w-3" />
                    Apresentação
                  </span>
                )}
                
                {/* Readiness Badge */}
                {!readinessLoading && materials.length > 0 && (
                  isReady ? (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Pronto para iniciar
                    </Badge>
                  ) : (
                    <Collapsible open={materialsExpanded} onOpenChange={setMaterialsExpanded}>
                      <CollapsibleTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className="text-amber-600 border-amber-500 hover:bg-amber-500/10 cursor-pointer gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Materiais pendentes ({missingMaterials.length})
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="absolute mt-2 z-10 bg-card border border-border p-3 shadow-lg min-w-[280px]">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Materiais necessários:</p>
                        <ul className="space-y-1.5">
                          {materials.map((material) => (
                            <li key={material.id} className="flex items-center gap-2 text-sm">
                              {material.ready ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                              )}
                              <span className={material.ready ? 'text-muted-foreground' : 'text-foreground'}>
                                {material.label}
                              </span>
                              {material.type === 'secondary' && (
                                <span className="text-[10px] text-muted-foreground">(resultado)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                )}
                
                {/* LLM Model Badge with Dropdown */}
                {agentConfig && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer gap-1 hover:bg-muted"
                      >
                        <Cpu className="h-3 w-3" />
                        {getModelDisplayName(agentConfig.llm_model)}
                        <ChevronDown className="h-3 w-3" />
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Trocar modelo LLM:
                      </p>
                      <Select 
                        value={agentConfig.llm_model} 
                        onValueChange={handleChangeModel}
                        disabled={isChangingModel}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableModels().length === 0 && (
                            <div className="text-xs text-muted-foreground px-2 py-2">
                              Nenhuma API key ativa. Configure em Configurações &gt; API Keys.
                            </div>
                          )}
                          {getAvailableModels().map(({ provider, models }) => (
                            <div key={provider}>
                              <div className="text-xs text-muted-foreground px-2 py-1 font-medium capitalize">
                                {provider === 'google' ? 'Google AI' : provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : provider === 'manus' ? 'Manus' : provider}
                              </div>
                              {models.map(m => (
                                <SelectItem key={m.value} value={m.value}>
                                  <span className="flex items-center gap-2">
                                    <span>{m.icon}</span>
                                    <span>{m.label}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      {isChangingModel && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Salvando...
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documentos Utilizados */}
        {!readinessLoading && materials.length > 0 && (
          <div className="bg-card border border-border p-6 mb-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display text-lg text-foreground">
                Documentos utilizados nesta análise
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Materiais Primários */}
              {materials.filter(m => m.type === 'primary').length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Materiais Primários
                    </p>
                  </div>
                  <div className="space-y-2 pl-6">
                    {materials.filter(m => m.type === 'primary').map(material => (
                      <div key={material.id} className="flex items-center gap-2 text-sm">
                        {material.ready ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className={material.ready ? 'text-foreground' : 'text-muted-foreground'}>
                          {material.label}
                        </span>
                        {!material.ready && (
                          <span className="text-xs text-amber-500">(pendente)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Resultado de Pesquisa */}
              {materials.filter(m => m.type === 'research').length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Resultado de Pesquisa
                    </p>
                  </div>
                  <div className="space-y-2 pl-6">
                    {materials.filter(m => m.type === 'research').map(material => (
                      <div key={material.id} className="flex items-center gap-2 text-sm">
                        {material.ready ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className={material.ready ? 'text-foreground' : 'text-muted-foreground'}>
                          {material.label}
                        </span>
                        {!material.ready && (
                          <span className="text-xs text-amber-500">(pendente)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Resultados do Agente */}
              {materials.filter(m => m.type === 'secondary').length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Resultados do Agente
                    </p>
                  </div>
                  <div className="space-y-2 pl-6">
                    {materials.filter(m => m.type === 'secondary').map(material => (
                      <div key={material.id} className="flex items-center gap-2 text-sm">
                        {material.ready ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className={material.ready ? 'text-foreground' : 'text-muted-foreground'}>
                          {material.label}
                        </span>
                        {!material.ready && (
                          <span className="text-xs text-amber-500">(pendente)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
              {isProcessing && !isStuck && !isProcessingManus && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-primary">Gerando análise...</span>
                </>
              )}
              {isProcessingManus && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                  <span className="text-amber-500">Processando no Manus Agent... (pode levar alguns minutos)</span>
                </>
              )}
              {isStuck && !isProcessingManus && (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-500">Processamento travado</span>
                </>
              )}
              {currentStatus === 'completed' && !isProcessing && !isProcessingManus && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-gold" />
                  <span className="text-foreground">Análise concluída</span>
                </>
              )}
              {currentStatus === 'error' && !isProcessing && !isProcessingManus && (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Erro na análise</span>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {isStuck && !isProcessingManus && (
                <Button
                  onClick={handleCancelGeneration}
                  variant="outline"
                  className="gap-2 border-amber-500 text-amber-500 hover:bg-amber-500/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Cancelar e Reiniciar
                </Button>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={handleGenerateAnalysis}
                        disabled={(isProcessing && !isStuck) || isProcessingManus || (!isReady && currentStatus !== 'completed')}
                        className="gap-2"
                        variant={currentStatus === 'completed' ? 'outline' : 'default'}
                      >
                        {isProcessing && !isStuck && !isProcessingManus ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : isProcessingManus ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Manus processando...
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
                    </span>
                  </TooltipTrigger>
                  {!isReady && currentStatus !== 'completed' && missingMaterials.length > 0 && (
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium mb-1">Materiais faltando:</p>
                      <ul className="text-xs space-y-0.5">
                        {missingMaterials.map(m => (
                          <li key={m.id}>• {m.label}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
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
                  <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                    <ReactMarkdown>
                      {editedText || result?.result || ''}
                    </ReactMarkdown>
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
                  <div className="p-6 space-y-4">
                    {/* Visual Preview Card */}
                    <div className="bg-muted/50 border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                      <Presentation className="h-12 w-12 text-primary/50 mb-3" />
                      <p className="text-sm text-foreground mb-2">
                        Apresentação criada com sucesso!
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        O Gamma não permite visualização incorporada.<br />
                        Clique abaixo para abrir em nova aba.
                      </p>
                      <Button 
                        onClick={() => window.open(result.presentation_url!, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir Apresentação no Gamma
                      </Button>
                    </div>
                    
                    {/* Presentation URL info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>URL:</span>
                      <code className="bg-muted px-2 py-1 text-xs font-mono flex-1 truncate">
                        {result.presentation_url}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(result.presentation_url!);
                          toast.success('URL copiada!');
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Regenerate button */}
                    <div className="flex justify-end">
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
                    </div>
                  </div>
                ) : isPresentationGenerating ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                    <h3 className="font-display text-lg text-foreground mb-2">Criando Apresentação...</h3>
                    <p className="text-muted-foreground mb-2">
                      A apresentação está sendo gerada em background.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Você pode sair desta página - a apresentação continuará sendo criada.
                    </p>
                  </div>
                ) : isPresentationError ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                    <h3 className="font-display text-lg text-foreground mb-2">Erro ao criar apresentação</h3>
                    <p className="text-muted-foreground mb-6">
                      Ocorreu um erro. Tente novamente.
                    </p>
                    <Button
                      onClick={handleCreatePresentation}
                      disabled={isCreatingPresentation}
                      className="gap-2"
                      size="lg"
                    >
                      <RefreshCw className="h-5 w-5" />
                      Tentar Novamente
                    </Button>
                  </div>
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
