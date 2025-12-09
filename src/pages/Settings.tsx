import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Logo } from "@/components/Logo";
import { useAgentConfigs, AgentConfig } from "@/hooks/useAgentConfigs";
import { useApiKeys, ApiKeyInput, ApiKey } from "@/hooks/useApiKeys";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  useGammaSettings, 
  GammaSettingsUpdate,
  GAMMA_THEMES,
  GAMMA_FORMATS,
  GAMMA_TEXT_MODES,
  GAMMA_CARD_SPLITS,
  GAMMA_TEXT_AMOUNTS,
  GAMMA_IMAGE_SOURCES,
  GAMMA_IMAGE_MODELS,
  GAMMA_IMAGE_STYLES,
  GAMMA_CARD_DIMENSIONS,
  GAMMA_LANGUAGES
} from "@/hooks/useGammaSettings";
import { useResearchSettings, ResearchSettings, ResearchSettingsUpdate } from "@/hooks/useResearchSettings";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Settings as SettingsIcon,
  Save,
  Loader2,
  Bot,
  AlertCircle,
  Users,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  FileText,
  Presentation,
  Palette,
  Type,
  Image,
  LayoutGrid,
  Search,
  Globe,
  Star,
  Building2
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

const KEY_TYPES = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Claude (Anthropic)" },
  { value: "manus", label: "Manus" },
  { value: "google", label: "Google AI" },
  { value: "gamma", label: "Gamma" },
  { value: "other", label: "Outro" },
];

// Lovable AI models (no API key required)
const LOVABLE_MODELS = [
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", icon: "🔮", description: "Próxima geração - raciocínio avançado" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", icon: "🔮", description: "Rápido e eficiente (padrão)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", icon: "🔮", description: "Mais poderoso, melhor raciocínio" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", icon: "🔮", description: "Mais rápido e econômico" },
  { value: "openai/gpt-5", label: "GPT-5", icon: "🤖", description: "Alta precisão, custo maior" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", icon: "🤖", description: "Equilíbrio entre custo e performance" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano", icon: "🤖", description: "Rápido e econômico" },
];

// Models that require API keys (mapped by key_type)
const EXTERNAL_MODELS: Record<string, { value: string; label: string; icon: string; description: string }[]> = {
  openai: [
    { value: "openai/gpt-4o", label: "GPT-4o", icon: "🤖", description: "OpenAI GPT-4o (via API Key)" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", icon: "🤖", description: "OpenAI GPT-4o Mini (via API Key)" },
  ],
  anthropic: [
    { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5", icon: "🧠", description: "Claude mais inteligente (via API Key)" },
    { value: "anthropic/claude-3-5-haiku", label: "Claude 3.5 Haiku", icon: "🧠", description: "Claude rápido (via API Key)" },
  ],
  google: [
    { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash", icon: "🔮", description: "Google Gemini (via API Key)" },
  ],
  manus: [
    { value: "manus/agent-1.5", label: "Manus Agent 1.5", icon: "🔧", description: "Modo agente assíncrono - pesquisa web em tempo real" },
    { value: "manus/agent-1.5-lite", label: "Manus Agent Lite", icon: "🔧", description: "Modo agente rápido - tarefas simples" },
  ],
};

export default function Settings() {
  const navigate = useNavigate();
  const { configs, loading, updateConfig } = useAgentConfigs();
  const { apiKeys, loading: apiKeysLoading, addApiKey, updateApiKey, deleteApiKey, toggleApiKey } = useApiKeys();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { settings: gammaSettings, loading: gammaLoading, saving: gammaSaving, updateSettings: updateGammaSettings } = useGammaSettings();
  const { settings: researchSettings, loading: researchLoading, saving: researchSaving, updateSettings: updateResearchSettings } = useResearchSettings();
  
  // Research settings local state
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
  
  // Materials options - separated into categories
  const PRIMARY_MATERIALS = [
    { value: 'manual', label: 'Manual de Funcionamento' },
    { value: 'dados', label: 'Briefing de Criação' },
    { value: 'transcricao', label: 'Transcrição de Kickoff' },
  ];

  const RESEARCH_MATERIALS = [
    { value: 'website', label: 'Conteúdo do Site' },
    { value: 'reviews', label: 'Avaliações Consolidadas' },
    { value: 'competitors', label: 'Conteúdo dos Concorrentes' },
  ];

  const ALL_MATERIALS = [...PRIMARY_MATERIALS, ...RESEARCH_MATERIALS];

  // Agent editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ prompt: string; output_type: string; llm_model: string; materials_config: string[]; secondary_materials_config: number[] }>({ 
    prompt: '', 
    output_type: 'text',
    llm_model: 'google/gemini-3-pro-preview',
    materials_config: ['manual', 'dados', 'transcricao'],
    secondary_materials_config: []
  });
  const [saving, setSaving] = useState(false);

  // API Key dialog state
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState<ApiKeyInput>({ name: '', key_type: 'openai', api_key: '' });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [deletingApiKey, setDeletingApiKey] = useState<string | null>(null);

  // Gamma settings local state
  const [gammaForm, setGammaForm] = useState<GammaSettingsUpdate>({});
  const [gammaFormDirty, setGammaFormDirty] = useState(false);

  // Initialize gamma form when settings load
  const getGammaFormValue = <K extends keyof GammaSettingsUpdate>(key: K): GammaSettingsUpdate[K] => {
    if (gammaForm[key] !== undefined) return gammaForm[key];
    if (gammaSettings) return gammaSettings[key] as GammaSettingsUpdate[K];
    return undefined;
  };

  const updateGammaForm = <K extends keyof GammaSettingsUpdate>(key: K, value: GammaSettingsUpdate[K]) => {
    setGammaForm(prev => ({ ...prev, [key]: value }));
    setGammaFormDirty(true);
  };

  const handleSaveGammaSettings = async () => {
    if (!gammaFormDirty) return;
    const success = await updateGammaSettings(gammaForm);
    if (success) {
      setGammaForm({});
      setGammaFormDirty(false);
    }
  };

  if (roleLoading || loading) {
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

  // Get active API keys for external models
  const getActiveApiKeyTypes = (): string[] => {
    return apiKeys.filter(k => k.is_active).map(k => k.key_type);
  };

  // Get available external models based on active API keys
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

  // Get model display info
  const getModelInfo = (modelValue: string) => {
    const lovableModel = LOVABLE_MODELS.find(m => m.value === modelValue);
    if (lovableModel) return lovableModel;
    
    for (const models of Object.values(EXTERNAL_MODELS)) {
      const model = models.find(m => m.value === modelValue);
      if (model) return model;
    }
    
    return { value: modelValue, label: modelValue, icon: "🔧", description: "" };
  };

  // Agent handlers
  const handleEdit = (config: AgentConfig) => {
    setEditingId(config.module_id);
    setEditForm({ 
      prompt: config.prompt, 
      output_type: config.output_type,
      llm_model: config.llm_model || 'google/gemini-3-pro-preview',
      materials_config: config.materials_config || ['manual', 'dados', 'transcricao'],
      secondary_materials_config: config.secondary_materials_config || []
    });
  };

  const handleSave = async (moduleId: number) => {
    setSaving(true);
    const success = await updateConfig(moduleId, editForm);
    if (success) {
      setEditingId(null);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ prompt: '', output_type: 'text', llm_model: 'google/gemini-3-pro-preview', materials_config: ['manual', 'dados', 'transcricao'], secondary_materials_config: [] });
  };

  const toggleMaterial = (materialValue: string) => {
    setEditForm(prev => {
      const current = prev.materials_config;
      if (current.includes(materialValue)) {
        return { ...prev, materials_config: current.filter(m => m !== materialValue) };
      } else {
        return { ...prev, materials_config: [...current, materialValue] };
      }
    });
  };

  const getMaterialsLabel = (config: string[], materialsList: typeof ALL_MATERIALS) => {
    if (!config || config.length === 0) return 'Nenhum';
    const filtered = config.filter(c => materialsList.some(m => m.value === c));
    if (filtered.length === 0) return 'Nenhum';
    if (filtered.length === materialsList.length) return 'Todos';
    return filtered.map(c => materialsList.find(m => m.value === c)?.label || c).join(', ');
  };

  const getPrimaryMaterialsLabel = (config: string[]) => getMaterialsLabel(config, PRIMARY_MATERIALS);
  const getResearchMaterialsLabel = (config: string[]) => getMaterialsLabel(config, RESEARCH_MATERIALS);

  const toggleSecondaryMaterial = (moduleId: number) => {
    setEditForm(prev => {
      const current = prev.secondary_materials_config;
      if (current.includes(moduleId)) {
        return { ...prev, secondary_materials_config: current.filter(m => m !== moduleId) };
      } else {
        return { ...prev, secondary_materials_config: [...current, moduleId] };
      }
    });
  };

  const getSecondaryMaterialsLabel = (config: number[]) => {
    if (!config || config.length === 0) return 'Nenhum';
    return config.map(id => configs.find(c => c.module_id === id)?.module_title || `Agente ${id}`).join(', ');
  };

  // API Key handlers
  const openAddApiKeyDialog = () => {
    setEditingApiKey(null);
    setApiKeyForm({ name: '', key_type: 'openai', api_key: '' });
    setShowApiKey(false);
    setIsApiKeyDialogOpen(true);
  };

  const openEditApiKeyDialog = (key: typeof apiKeys[0]) => {
    setEditingApiKey(key.id);
    setApiKeyForm({ name: key.name, key_type: key.key_type, api_key: key.api_key });
    setShowApiKey(false);
    setIsApiKeyDialogOpen(true);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyForm.name.trim() || !apiKeyForm.api_key.trim()) {
      return;
    }
    
    setSavingApiKey(true);
    
    if (editingApiKey) {
      await updateApiKey(editingApiKey, apiKeyForm);
    } else {
      await addApiKey(apiKeyForm);
    }
    
    setSavingApiKey(false);
    setIsApiKeyDialogOpen(false);
  };

  const handleDeleteApiKey = async (id: string) => {
    setDeletingApiKey(id);
    await deleteApiKey(id);
    setDeletingApiKey(null);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return `${key.substring(0, 4)}••••${key.substring(key.length - 4)}`;
  };

  const getKeyTypeLabel = (type: string) => {
    return KEY_TYPES.find(t => t.value === type)?.label || type;
  };

  const getKeyTypeIcon = (type: string) => {
    switch (type) {
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      case 'google':
        return '🔮';
      case 'gamma':
        return '🎨';
      case 'manus':
        return '🔧';
      default:
        return '🔑';
    }
  };

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl text-foreground">
                Configurações
              </h1>
              <p className="text-muted-foreground">Gerencie agentes, API keys e Gamma</p>
            </div>
          </div>
          
          <Button onClick={() => navigate("/users")} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Usuários
          </Button>
        </div>

        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agentes
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Pesquisa
            </TabsTrigger>
            <TabsTrigger value="apikeys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="gamma" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              Gamma
            </TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            {configs.map((config, index) => (
              <div
                key={config.id}
                className="bg-card border border-border rounded-xl p-6 animate-slide-up"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      #{config.module_id} - {config.module_title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span>Output: {config.output_type}</span>
                      <span className="flex items-center gap-1">
                        <span>{getModelInfo(config.llm_model || 'google/gemini-3-pro-preview').icon}</span>
                        {getModelInfo(config.llm_model || 'google/gemini-3-pro-preview').label}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Primários: {getPrimaryMaterialsLabel(config.materials_config)}
                      </span>
                      {getResearchMaterialsLabel(config.materials_config) !== 'Nenhum' && (
                        <span className="flex items-center gap-1">
                          <Search className="h-3 w-3" />
                          Pesquisas: {getResearchMaterialsLabel(config.materials_config)}
                        </span>
                      )}
                      {config.secondary_materials_config && config.secondary_materials_config.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          Agentes: {getSecondaryMaterialsLabel(config.secondary_materials_config)}
                        </span>
                      )}
                    </div>
                  </div>
                  {editingId !== config.module_id && (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                      Editar
                    </Button>
                  )}
                </div>

                {editingId === config.module_id ? (
                  <div className="space-y-4">
                    {/* 1. Prompt do Agente */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Prompt do Agente
                      </label>
                      <Textarea
                        value={editForm.prompt}
                        onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    {/* 2. Materiais Primários */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Materiais Primários
                      </label>
                      <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg">
                        {PRIMARY_MATERIALS.map((material) => (
                          <label key={material.value} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={editForm.materials_config.includes(material.value)}
                              onCheckedChange={() => toggleMaterial(material.value)}
                            />
                            <span className="text-sm">{material.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Documentos enviados pelo consultor
                      </p>
                    </div>

                    {/* 3. Resultado de Pesquisa */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Resultado de Pesquisa
                      </label>
                      <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg">
                        {RESEARCH_MATERIALS.map((material) => (
                          <label key={material.value} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={editForm.materials_config.includes(material.value)}
                              onCheckedChange={() => toggleMaterial(material.value)}
                            />
                            <span className="text-sm">{material.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dados coletados automaticamente via pesquisa
                      </p>
                    </div>

                    {/* 4. Resultados do Agente */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Resultados do Agente
                      </label>
                      <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg max-h-40 overflow-y-auto">
                        {configs
                          .filter(c => c.module_id !== config.module_id)
                          .map((otherConfig) => (
                            <label key={otherConfig.module_id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={editForm.secondary_materials_config.includes(otherConfig.module_id)}
                                onCheckedChange={() => toggleSecondaryMaterial(otherConfig.module_id)}
                              />
                              <span className="text-sm">#{otherConfig.module_id} - {otherConfig.module_title}</span>
                            </label>
                          ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Resultados de outros agentes que serão usados como input
                      </p>
                    </div>

                    {/* 3. Modelo LLM */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Modelo LLM
                      </label>
                      <Select 
                        value={editForm.llm_model} 
                        onValueChange={(value) => setEditForm({ ...editForm, llm_model: value })}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <span className="flex items-center gap-2">
                              <span>{getModelInfo(editForm.llm_model).icon}</span>
                              {getModelInfo(editForm.llm_model).label}
                            </span>
                          </SelectValue>
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
                                <span className="text-xs text-muted-foreground ml-1">
                                  {model.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                          
                          {getAvailableExternalModels().length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                                Via API Key Configurada
                              </div>
                              {getAvailableExternalModels().map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{model.icon}</span>
                                    <span>{model.label}</span>
                                    <span className="text-xs text-muted-foreground ml-1">
                                      {model.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 4. Tipo do Output */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Tipo de Output
                      </label>
                      <Select 
                        value={editForm.output_type} 
                        onValueChange={(value) => setEditForm({ ...editForm, output_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="presentation">Apresentação (Gamma)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleSave(config.module_id)} disabled={saving || editForm.materials_config.length === 0}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
                      {config.prompt}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">
                Gerencie suas API keys para integração com provedores externos.
              </p>
              <Button onClick={openAddApiKeyDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar API Key
              </Button>
            </div>

            {apiKeysLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground mb-2">Nenhuma API key configurada</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione suas API keys para usar provedores externos como OpenAI ou Claude.
                </p>
                <Button onClick={openAddApiKeyDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeira API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key, index) => (
                  <div
                    key={key.id}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 animate-slide-up"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 text-xl">
                      {getKeyTypeIcon(key.key_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{key.name}</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {getKeyTypeLabel(key.key_type)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {maskApiKey(key.api_key)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {key.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                        <Switch 
                          checked={key.is_active} 
                          onCheckedChange={(checked) => toggleApiKey(key.id, checked)}
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEditApiKeyDialog(key)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteApiKey(key.id)}
                        disabled={deletingApiKey === key.id}
                      >
                        {deletingApiKey === key.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-4 mt-6">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Nota sobre Lovable AI
              </h4>
              <p className="text-sm text-muted-foreground">
                O Lovable AI (Google Gemini e GPT-5) já está configurado automaticamente e não requer API key adicional.
                Use esta seção para adicionar chaves de provedores externos como Claude (Anthropic), Gamma ou Manus.
              </p>
            </div>
          </TabsContent>

          {/* Gamma Tab */}
          <TabsContent value="gamma" className="space-y-6">
            {gammaLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !gammaSettings ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Presentation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground mb-2">Configurações do Gamma não encontradas</h3>
                <p className="text-muted-foreground">
                  Entre em contato com o suporte para configurar o Gamma.
                </p>
              </div>
            ) : (
              <>
                {/* Section 1: Aparência */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Aparência
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Tema</label>
                      <Input
                        value={getGammaFormValue('theme_id') ?? gammaSettings.theme_id ?? ''}
                        onChange={(e) => updateGammaForm('theme_id', e.target.value)}
                        placeholder="Deixe vazio para usar o padrão"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Deixe vazio para usar o tema padrão do workspace. Para um tema específico, copie o ID do tema no Gamma App.
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Formato</label>
                      <Select 
                        value={getGammaFormValue('format') || gammaSettings.format} 
                        onValueChange={(value) => updateGammaForm('format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GAMMA_FORMATS.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Dimensões dos Cards</label>
                      <Select 
                        value={getGammaFormValue('card_dimensions') || gammaSettings.card_dimensions} 
                        onValueChange={(value) => updateGammaForm('card_dimensions', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GAMMA_CARD_DIMENSIONS.map((dim) => (
                            <SelectItem key={dim.value} value={dim.value}>
                              <div className="flex items-center gap-2">
                                <span>{dim.label}</span>
                                <span className="text-xs text-muted-foreground">{dim.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Conteúdo */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    Conteúdo
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Modo de Texto</label>
                        <Select 
                          value={getGammaFormValue('text_mode') || gammaSettings.text_mode} 
                          onValueChange={(value) => updateGammaForm('text_mode', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GAMMA_TEXT_MODES.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                <div className="flex items-center gap-2">
                                  <span>{mode.label}</span>
                                  <span className="text-xs text-muted-foreground">{mode.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Divisão de Cards</label>
                        <Select 
                          value={getGammaFormValue('card_split') || gammaSettings.card_split} 
                          onValueChange={(value) => updateGammaForm('card_split', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GAMMA_CARD_SPLITS.map((split) => (
                              <SelectItem key={split.value} value={split.value}>
                                <div className="flex items-center gap-2">
                                  <span>{split.label}</span>
                                  <span className="text-xs text-muted-foreground">{split.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Número de Cards: {getGammaFormValue('num_cards') || gammaSettings.num_cards}
                      </label>
                      <Slider
                        value={[getGammaFormValue('num_cards') || gammaSettings.num_cards]}
                        onValueChange={([value]) => updateGammaForm('num_cards', value)}
                        min={3}
                        max={30}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>3</span>
                        <span>30</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Instruções Adicionais</label>
                      <Textarea
                        value={getGammaFormValue('additional_instructions') || gammaSettings.additional_instructions}
                        onChange={(e) => updateGammaForm('additional_instructions', e.target.value)}
                        placeholder="Instruções extras para o Gamma (opcional)"
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Texto */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" />
                    Texto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Quantidade</label>
                      <Select 
                        value={getGammaFormValue('text_amount') || gammaSettings.text_amount} 
                        onValueChange={(value) => updateGammaForm('text_amount', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GAMMA_TEXT_AMOUNTS.map((amount) => (
                            <SelectItem key={amount.value} value={amount.value}>
                              <div className="flex items-center gap-2">
                                <span>{amount.label}</span>
                                <span className="text-xs text-muted-foreground">{amount.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Idioma</label>
                      <Select 
                        value={getGammaFormValue('text_language') || gammaSettings.text_language} 
                        onValueChange={(value) => updateGammaForm('text_language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GAMMA_LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Tom</label>
                      <Input
                        value={getGammaFormValue('text_tone') || gammaSettings.text_tone}
                        onChange={(e) => updateGammaForm('text_tone', e.target.value)}
                        placeholder="Ex: professional, inspiring"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Público-alvo</label>
                      <Input
                        value={getGammaFormValue('text_audience') || gammaSettings.text_audience}
                        onChange={(e) => updateGammaForm('text_audience', e.target.value)}
                        placeholder="Ex: hotel management professionals"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Imagens */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    Imagens
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Origem</label>
                      <Select 
                        value={getGammaFormValue('image_source') || gammaSettings.image_source} 
                        onValueChange={(value) => updateGammaForm('image_source', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GAMMA_IMAGE_SOURCES.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                              <div className="flex items-center gap-2">
                                <span>{source.label}</span>
                                <span className="text-xs text-muted-foreground">{source.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Modelo</label>
                      <Select 
                        value={getGammaFormValue('image_model') || gammaSettings.image_model} 
                        onValueChange={(value) => updateGammaForm('image_model', value)}
                        disabled={(getGammaFormValue('image_source') || gammaSettings.image_source) === 'none'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GAMMA_IMAGE_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              <div className="flex items-center gap-2">
                                <span>{model.label}</span>
                                <span className="text-xs text-muted-foreground">{model.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Estilo</label>
                      <Select 
                        value={getGammaFormValue('image_style') || gammaSettings.image_style} 
                        onValueChange={(value) => updateGammaForm('image_style', value)}
                        disabled={(getGammaFormValue('image_source') || gammaSettings.image_source) === 'none'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GAMMA_IMAGE_STYLES.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              <div className="flex items-center gap-2">
                                <span>{style.label}</span>
                                <span className="text-xs text-muted-foreground">{style.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveGammaSettings} 
                    disabled={gammaSaving || !gammaFormDirty}
                    size="lg"
                  >
                    {gammaSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Configurações do Gamma
                  </Button>
                </div>

                {/* Info Note */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Sobre as Configurações do Gamma
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Estas configurações serão aplicadas a todas as apresentações geradas pelos agentes. 
                    Para usar o Gamma, certifique-se de que você tem uma API Key do Gamma configurada na aba "API Keys".
                  </p>
                </div>
              </>
            )}
          </TabsContent>

          {/* Research Tab */}
          <TabsContent value="research" className="space-y-6">
            {researchLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : researchSettings && (
              <>
                {/* Competitor Sites Agent Section */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
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
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
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
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded w-12 text-center">
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
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded w-12 text-center">
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
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
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
                <div className="bg-muted/50 rounded-xl p-4">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Sobre as Configurações de Pesquisa
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Estas configurações controlam como os crawlers extraem dados dos sites e avaliações. 
                    Aumentar o número de páginas e profundidade resulta em mais dados, mas também maior tempo de processamento.
                    Para usar os crawlers, certifique-se de que você tem uma API Key do Apify configurada na aba "API Keys".
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* API Key Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingApiKey ? 'Editar API Key' : 'Adicionar API Key'}
            </DialogTitle>
            <DialogDescription>
              {editingApiKey 
                ? 'Atualize as informações da sua API key.' 
                : 'Adicione uma nova API key para integração com provedores externos.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Nome
              </label>
              <Input
                placeholder="Ex: OpenAI Production"
                value={apiKeyForm.name}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Provedor
              </label>
              <Select 
                value={apiKeyForm.key_type} 
                onValueChange={(value) => setApiKeyForm({ ...apiKeyForm, key_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                API Key
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={apiKeyForm.api_key}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, api_key: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApiKeyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveApiKey} 
              disabled={savingApiKey || !apiKeyForm.name.trim() || !apiKeyForm.api_key.trim()}
            >
              {savingApiKey ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
