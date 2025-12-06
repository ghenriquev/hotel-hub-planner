import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { useAgentConfigs, AgentConfig } from "@/hooks/useAgentConfigs";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  ArrowLeft, 
  Settings as SettingsIcon,
  Save,
  Loader2,
  Bot,
  AlertCircle,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const navigate = useNavigate();
  const { configs, loading, updateConfig } = useAgentConfigs();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ prompt: string; output_type: string }>({ prompt: '', output_type: 'text' });
  const [saving, setSaving] = useState(false);

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

  const handleEdit = (config: AgentConfig) => {
    setEditingId(config.module_id);
    setEditForm({ prompt: config.prompt, output_type: config.output_type });
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
    setEditForm({ prompt: '', output_type: 'text' });
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
              <p className="text-muted-foreground">Gerencie os prompts dos agentes</p>
            </div>
          </div>
          
          <Button onClick={() => navigate("/users")} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Usuários
          </Button>
        </div>

        {/* Agent Configs List */}
        <div className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">
                    Tipo de output: {config.output_type}
                  </p>
                </div>
                {editingId !== config.module_id && (
                  <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                    Editar
                  </Button>
                )}
              </div>

              {editingId === config.module_id ? (
                <div className="space-y-4">
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
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Tipo de Output
                    </label>
                    <Select 
                      value={editForm.output_type} 
                      onValueChange={(value) => setEditForm({ ...editForm, output_type: value })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="presentation">Apresentação</SelectItem>
                        <SelectItem value="swot">SWOT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(config.module_id)} disabled={saving}>
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
        </div>
      </main>
    </div>
  );
}
