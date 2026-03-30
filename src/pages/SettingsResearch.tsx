import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useUserRole } from "@/hooks/useUserRole";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useResearchSettings, ResearchSettings, ResearchSettingsUpdate } from "@/hooks/useResearchSettings";
import { 
  Save,
  Loader2,
  AlertCircle,
  Building2,
  Globe,
  Star
} from "lucide-react";

const CRAWLER_TYPES = [
  { value: 'playwright:firefox', label: 'Playwright Firefox' },
  { value: 'playwright:chrome', label: 'Playwright Chrome' },
  { value: 'cheerio', label: 'Cheerio (Rápido)' },
];

const REVIEW_PERIODS = [
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
  { value: 18, label: '18 meses' },
  { value: 24, label: '24 meses' },
  { value: 36, label: '36 meses' },
];

// All models require API keys (mapped by key_type)
const MODELS_BY_PROVIDER: Record<string, { value: string; label: string; icon: string; description: string }[]> = {
  google: [
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", icon: "🔮", description: "Rápido e eficiente (padrão)" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", icon: "🔮", description: "Mais poderoso, melhor raciocínio" },
    { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", icon: "🔮", description: "Mais rápido e econômico" },
    { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash", icon: "🔮", description: "Versão anterior estável" },
  ],
  openai: [
    { value: "openai/gpt-4o", label: "GPT-4o", icon: "🤖", description: "OpenAI GPT-4o - alta precisão" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", icon: "🤖", description: "OpenAI GPT-4o Mini - equilíbrio custo/performance" },
  ],
  anthropic: [
    { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5", icon: "🧠", description: "Claude mais inteligente" },
    { value: "anthropic/claude-3-5-haiku", label: "Claude 3.5 Haiku", icon: "🧠", description: "Claude rápido" },
  ],
  manus: [
    { value: "manus/agent-1.5", label: "Manus Agent 1.5", icon: "🔧", description: "Modo agente assíncrono - pesquisa web em tempo real" },
    { value: "manus/agent-1.5-lite", label: "Manus Agent Lite", icon: "🔧", description: "Modo agente rápido - tarefas simples" },
  ],
};

export default function SettingsResearch() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { apiKeys } = useApiKeys();
  const { settings: researchSettings, loading: researchLoading, saving: researchSaving, updateSettings: updateResearchSettings } = useResearchSettings();

  const [researchForm, setResearchForm] = useState<ResearchSettingsUpdate>({});
  const [researchFormDirty, setResearchFormDirty] = useState(false);

  const getResearchFormValue = <K extends keyof ResearchSettingsUpdate>(key: K): ResearchSettingsUpdate[K] | undefined => {
    if (researchForm[key] !== undefined) return researchForm[key];
    if (researchSettings) return researchSettings[key as keyof ResearchSettings] as ResearchSettingsUpdate[K];
    return undefined;
  };

  const updateResearchForm = <K extends keyof ResearchSettingsUpdate>(key: K, value: ResearchSettingsUpdate[K]) => {
    setResearchForm(prev => ({ ...prev, [key]: value }));
    setResearchFormDirty(true);
  };

  const handleSaveResearchSettings = async () => {
    if (!researchFormDirty) return;
    await updateResearchSettings(researchForm);
    setResearchForm({});
    setResearchFormDirty(false);
  };

  const getActiveApiKeyTypes = (): string[] => {
    return apiKeys.filter(k => k.is_active).map(k => k.key_type);
  };

  const getAvailableExternalModels = () => {
    const activeTypes = getActiveApiKeyTypes();
    const models: { value: string; label: string; icon: string; description: string; keyType: string }[] = [];
    
    for (const keyType of activeTypes) {
      const keyModels = EXTERNAL_MODELS[keyType];
      if (keyModels) {
        keyModels.forEach(m => models.push({ ...m, keyType }));
      }
    }
    
    return models;
  };

  if (roleLoading || researchLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="font-display text-2xl text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">
            Apenas administradores podem acessar esta página.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!researchSettings) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Competitor Sites Agent Section */}
      <div className="bg-card border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Agente de Análise de Concorrentes</h3>
            <p className="text-sm text-muted-foreground">Configurações do agente que analisa os sites dos concorrentes</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Modelo LLM
            </label>
            <Select
              value={getResearchFormValue('competitor_llm_model') || 'google/gemini-3-pro-preview'}
              onValueChange={(value) => updateResearchForm('competitor_llm_model', value)}
            >
              <SelectTrigger className="w-full md:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Lovable AI (sem API Key)
                </div>
                {LOVABLE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex items-center gap-2">
                      <span>{model.icon}</span>
                      <span>{model.label}</span>
                    </div>
                  </SelectItem>
                ))}
                {getAvailableExternalModels().length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                      Modelos Externos (via API Key)
                    </div>
                    {getAvailableExternalModels().map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex items-center gap-2">
                          <span>{model.icon}</span>
                          <span>{model.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Prompt de Análise
            </label>
            <Textarea
              value={getResearchFormValue('competitor_prompt') || ''}
              onChange={(e) => updateResearchForm('competitor_prompt', e.target.value)}
              placeholder="Instrução para o agente analisar os sites dos concorrentes..."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Este prompt será usado pelo agente para analisar o conteúdo extraído dos sites concorrentes.
            </p>
          </div>
        </div>
      </div>

      {/* Hotel Website Section */}
      <div className="bg-card border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Site do Hotel</h3>
            <p className="text-sm text-muted-foreground">Configurações do crawler para o site do hotel</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Máximo de Páginas
            </label>
            <div className="flex items-center gap-4">
              <Slider
                value={[getResearchFormValue('website_max_pages') || 10]}
                onValueChange={([value]) => updateResearchForm('website_max_pages', value)}
                min={1}
                max={30}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono bg-muted px-2 py-1 w-12 text-center">
                {getResearchFormValue('website_max_pages') || 10}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Profundidade Máxima
            </label>
            <div className="flex items-center gap-4">
              <Slider
                value={[getResearchFormValue('website_max_depth') || 2]}
                onValueChange={([value]) => updateResearchForm('website_max_depth', value)}
                min={1}
                max={5}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono bg-muted px-2 py-1 w-12 text-center">
                {getResearchFormValue('website_max_depth') || 2}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tipo de Crawler
            </label>
            <Select
              value={getResearchFormValue('website_crawler_type') || 'playwright:firefox'}
              onValueChange={(value) => updateResearchForm('website_crawler_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRAWLER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-card border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Avaliações</h3>
            <p className="text-sm text-muted-foreground">Configurações para coleta de avaliações</p>
          </div>
        </div>

        <div className="max-w-xs">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Período Máximo
          </label>
          <Select
            value={String(getResearchFormValue('reviews_max_months') || 24)}
            onValueChange={(value) => updateResearchForm('reviews_max_months', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REVIEW_PERIODS.map((period) => (
                <SelectItem key={period.value} value={String(period.value)}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Apenas avaliações dos últimos {getResearchFormValue('reviews_max_months') || 24} meses serão coletadas
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveResearchSettings} 
          disabled={researchSaving || !researchFormDirty}
          size="lg"
        >
          {researchSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações de Pesquisa
        </Button>
      </div>

      {/* Info Note */}
      <div className="bg-muted/50 p-4">
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          Sobre as Configurações de Pesquisa
        </h4>
        <p className="text-sm text-muted-foreground">
          Estas configurações controlam como os crawlers extraem dados dos sites e avaliações. 
          Aumentar o número de páginas e profundidade resulta em mais dados, mas também maior tempo de processamento.
          Para usar os crawlers, certifique-se de que você tem uma API Key do Apify configurada na página "API Keys".
        </p>
      </div>
    </div>
  );
}
