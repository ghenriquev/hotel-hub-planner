import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAgentConfigs, AgentConfig } from "@/hooks/useAgentConfigs";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  DndContext, 
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Save,
  Loader2,
  Bot,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Search,
  GripVertical
} from "lucide-react";

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

// Sortable Agent Item Component
interface SortableAgentItemProps {
  config: AgentConfig;
  index: number;
  editingId: number | null;
  editForm: { prompt: string; output_type: string; llm_model: string; materials_config: string[]; secondary_materials_config: number[] };
  saving: boolean;
  deletingAgent: number | null;
  configs: AgentConfig[];
  getModelInfo: (model: string) => { value: string; label: string; icon: string; description: string };
  PRIMARY_MATERIALS: { value: string; label: string }[];
  RESEARCH_MATERIALS: { value: string; label: string }[];
  getAvailableExternalModels: () => { value: string; label: string; icon: string; description: string; keyType: string }[];
  handleEdit: (config: AgentConfig) => void;
  handleSave: (moduleId: number) => Promise<void>;
  handleCancel: () => void;
  handleDeleteAgent: (moduleId: number, moduleTitle: string) => void;
  setEditForm: React.Dispatch<React.SetStateAction<{ prompt: string; output_type: string; llm_model: string; materials_config: string[]; secondary_materials_config: number[] }>>;
  toggleMaterial: (materialValue: string) => void;
  toggleSecondaryMaterial: (moduleId: number) => void;
}

function SortableAgentItem({
  config,
  index,
  editingId,
  editForm,
  saving,
  deletingAgent,
  configs,
  getModelInfo,
  PRIMARY_MATERIALS,
  RESEARCH_MATERIALS,
  getAvailableExternalModels,
  handleEdit,
  handleSave,
  handleCancel,
  handleDeleteAgent,
  setEditForm,
  toggleMaterial,
  toggleSecondaryMaterial,
}: SortableAgentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.module_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    ...(isDragging ? {} : { animationDelay: `${index * 0.03}s` }),
  };

  const isEditing = editingId === config.module_id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border p-6 ${!isDragging ? 'animate-slide-up' : 'opacity-30'}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing p-1 -ml-2 text-muted-foreground hover:text-foreground transition-colors touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            {config.module_title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span>Output: {config.output_type}</span>
            <span className="flex items-center gap-1">
              <span>{getModelInfo(config.llm_model || 'google/gemini-3-pro-preview').icon}</span>
              {getModelInfo(config.llm_model || 'google/gemini-3-pro-preview').label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                Editar
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteAgent(config.module_id, config.module_title)}
                disabled={deletingAgent === config.module_id}
              >
                {deletingAgent === config.module_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Prompt do Agente
            </label>
            <Textarea
              value={editForm.prompt}
              onChange={(e) => setEditForm(prev => ({ ...prev, prompt: e.target.value }))}
              rows={6}
              className="resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Materiais Primários
            </label>
            <div className="flex flex-wrap gap-4 p-3 bg-muted/50">
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
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
              <Search className="h-4 w-4" />
              Resultado de Pesquisa
            </label>
            <div className="flex flex-wrap gap-4 p-3 bg-muted/50">
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
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Resultados do Agente
            </label>
            <div className="flex flex-wrap gap-4 p-3 bg-muted/50 max-h-40 overflow-y-auto">
              {configs
                .filter(c => c.module_id !== config.module_id)
                .map((otherConfig) => (
                  <label key={otherConfig.module_id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={editForm.secondary_materials_config.includes(otherConfig.module_id)}
                      onCheckedChange={() => toggleSecondaryMaterial(otherConfig.module_id)}
                    />
                    <span className="text-sm">{otherConfig.module_title}</span>
                  </label>
                ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Modelo LLM
            </label>
            <Select 
              value={editForm.llm_model} 
              onValueChange={(value) => setEditForm(prev => ({ ...prev, llm_model: value }))}
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
                {getAvailableModels().length > 0 ? (
                  <>
                    {/* Group by provider */}
                    {Object.entries(
                      getAvailableModels().reduce((acc, m) => {
                        if (!acc[m.keyType]) acc[m.keyType] = [];
                        acc[m.keyType].push(m);
                        return acc;
                      }, {} as Record<string, typeof models>)
                    ).map(([keyType, models]) => (
                      <div key={keyType}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {keyType.charAt(0).toUpperCase() + keyType.slice(1)}
                        </div>
                        {models.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex items-center gap-2">
                              <span>{model.icon}</span>
                              <span>{model.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    Nenhuma API Key ativa. Adicione em API Keys.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tipo de Output
            </label>
            <Select 
              value={editForm.output_type} 
              onValueChange={(value) => setEditForm(prev => ({ ...prev, output_type: value }))}
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
      ) : null}
    </div>
  );
}

export default function SettingsAgents() {
  const navigate = useNavigate();
  const { configs, loading, updateConfig, createConfig, deleteConfig, reorderConfigs } = useAgentConfigs();
  const { apiKeys } = useApiKeys();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<{ id: number; title: string } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };
  
  const activeConfig = activeId ? configs.find(c => c.module_id === activeId) : null;

  const PRIMARY_MATERIALS = [
    { value: 'manual', label: 'Manual de Funcionamento' },
    { value: 'dados', label: 'Briefing de Criação' },
    { value: 'transcricao', label: 'Transcrição de Kickoff' },
    { value: 'cliente_oculto', label: 'Cliente Oculto' },
  ];

  const RESEARCH_MATERIALS = [
    { value: 'website', label: 'Conteúdo do Site' },
    { value: 'reviews', label: 'Avaliações Consolidadas' },
    { value: 'competitors', label: 'Conteúdo dos Concorrentes' },
  ];

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ prompt: string; output_type: string; llm_model: string; materials_config: string[]; secondary_materials_config: number[] }>({ 
    prompt: '', 
    output_type: 'text',
    llm_model: 'google/gemini-3-pro-preview',
    materials_config: ['manual', 'dados', 'transcricao'],
    secondary_materials_config: []
  });
  const [saving, setSaving] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<number | null>(null);
  
  const [isNewAgentDialogOpen, setIsNewAgentDialogOpen] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({ 
    module_title: '', 
    prompt: '', 
    output_type: 'text', 
    llm_model: 'google/gemini-3-pro-preview' 
  });
  const [savingNewAgent, setSavingNewAgent] = useState(false);

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

  const getActiveApiKeyTypes = (): string[] => {
    return apiKeys.filter(k => k.is_active).map(k => k.key_type);
  };

  const getAvailableModels = () => {
    const activeTypes = getActiveApiKeyTypes();
    const models: { value: string; label: string; icon: string; description: string; keyType: string }[] = [];
    
    for (const keyType of activeTypes) {
      const keyModels = MODELS_BY_PROVIDER[keyType];
      if (keyModels) {
        keyModels.forEach(m => models.push({ ...m, keyType }));
      }
    }
    
    return models;
  };

  const getModelInfo = (modelValue: string) => {
    for (const models of Object.values(MODELS_BY_PROVIDER)) {
      const model = models.find(m => m.value === modelValue);
      if (model) return model;
    }
    
    return { value: modelValue, label: modelValue, icon: "🔧", description: "" };
  };

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

  const handleDeleteAgent = (moduleId: number, moduleTitle: string) => {
    setAgentToDelete({ id: moduleId, title: moduleTitle });
  };

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) return;
    setDeletingAgent(agentToDelete.id);
    await deleteConfig(agentToDelete.id);
    setDeletingAgent(null);
    setAgentToDelete(null);
  };

  const handleCreateAgent = async () => {
    if (!newAgentForm.module_title.trim() || !newAgentForm.prompt.trim()) {
      return;
    }
    setSavingNewAgent(true);
    const success = await createConfig(newAgentForm);
    if (success) {
      setIsNewAgentDialogOpen(false);
      setNewAgentForm({ module_title: '', prompt: '', output_type: 'text', llm_model: 'google/gemini-3-pro-preview' });
    }
    setSavingNewAgent(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const oldIndex = configs.findIndex(c => c.module_id === active.id);
      const newIndex = configs.findIndex(c => c.module_id === over.id);
      
      const newOrder = arrayMove(configs, oldIndex, newIndex);
      await reorderConfigs(newOrder.map(c => c.module_id));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Arraste os agentes para reordenar. A ordem será refletida em todo o sistema.
        </p>
        <Button onClick={() => setIsNewAgentDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Agente
        </Button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={configs.map(c => c.module_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {configs.map((config, index) => (
              <SortableAgentItem
                key={config.id}
                config={config}
                index={index}
                editingId={editingId}
                editForm={editForm}
                saving={saving}
                deletingAgent={deletingAgent}
                configs={configs}
                getModelInfo={getModelInfo}
                PRIMARY_MATERIALS={PRIMARY_MATERIALS}
                RESEARCH_MATERIALS={RESEARCH_MATERIALS}
                getAvailableExternalModels={getAvailableModels}
                handleEdit={handleEdit}
                handleSave={handleSave}
                handleCancel={handleCancel}
                handleDeleteAgent={handleDeleteAgent}
                setEditForm={setEditForm}
                toggleMaterial={toggleMaterial}
                toggleSecondaryMaterial={toggleSecondaryMaterial}
              />
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeConfig ? (
            <div className="bg-card border-2 border-primary p-6 shadow-2xl scale-[1.02] cursor-grabbing">
              <div className="flex items-start gap-4">
                <div className="p-1 -ml-2 text-primary">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {activeConfig.module_title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Output: {activeConfig.output_type}</span>
                    <span>{getModelInfo(activeConfig.llm_model || 'google/gemini-3-pro-preview').label}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* New Agent Dialog */}
      <Dialog open={isNewAgentDialogOpen} onOpenChange={setIsNewAgentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Agente</DialogTitle>
            <DialogDescription>
              Crie um novo agente de análise para o sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="agent-title">Título do Agente</Label>
              <Input
                id="agent-title"
                placeholder="Ex: Análise de Mercado"
                value={newAgentForm.module_title}
                onChange={(e) => setNewAgentForm(prev => ({ ...prev, module_title: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="agent-prompt">Prompt</Label>
              <Textarea
                id="agent-prompt"
                placeholder="Descreva as instruções para o agente..."
                value={newAgentForm.prompt}
                onChange={(e) => setNewAgentForm(prev => ({ ...prev, prompt: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div>
              <Label>Modelo LLM</Label>
              <Select 
                value={newAgentForm.llm_model} 
                onValueChange={(value) => setNewAgentForm(prev => ({ ...prev, llm_model: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableModels().map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex items-center gap-2">
                        <span>{model.icon}</span>
                        <span>{model.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tipo de Output</Label>
              <Select 
                value={newAgentForm.output_type} 
                onValueChange={(value) => setNewAgentForm(prev => ({ ...prev, output_type: value }))}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAgentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateAgent} 
              disabled={savingNewAgent || !newAgentForm.module_title.trim() || !newAgentForm.prompt.trim()}
            >
              {savingNewAgent ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Agente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Agent Confirmation Dialog */}
      <AlertDialog open={!!agentToDelete} onOpenChange={() => setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o agente "{agentToDelete?.title}"? 
              Esta ação não pode ser desfeita e todos os resultados gerados por este agente serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteAgent}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
