import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useApiKeys, ApiKeyInput } from "@/hooks/useApiKeys";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  Save,
  Loader2,
  AlertCircle,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Pencil
} from "lucide-react";

const KEY_TYPES = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Claude (Anthropic)" },
  { value: "manus", label: "Manus" },
  { value: "google", label: "Google AI" },
  { value: "gamma", label: "Gamma" },
  { value: "apify", label: "Apify" },
  { value: "other", label: "Outro" },
];

export default function SettingsApiKeys() {
  const navigate = useNavigate();
  const { apiKeys, loading: apiKeysLoading, addApiKey, updateApiKey, deleteApiKey, toggleApiKey } = useApiKeys();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState<ApiKeyInput>({ name: '', key_type: 'openai', api_key: '' });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [deletingApiKey, setDeletingApiKey] = useState<string | null>(null);

  if (roleLoading) {
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
      case 'apify':
        return '🕷️';
      default:
        return '🔑';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
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
        <div className="bg-card border border-border p-12 text-center">
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
              className="bg-card border border-border p-4 flex items-center gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                {getKeyTypeIcon(key.key_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{key.name}</h3>
                  <span className="text-xs bg-muted px-2 py-0.5 text-muted-foreground">
                    {getKeyTypeLabel(key.key_type)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {maskApiKey(key.api_key)}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Switch
                  checked={key.is_active}
                  onCheckedChange={(checked) => toggleApiKey(key.id, checked)}
                />
                <span className={`text-xs ${key.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {key.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => openEditApiKeyDialog(key)}
                >
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

      <div className="bg-muted/50 p-4 mt-6">
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          Nota sobre Lovable AI
        </h4>
        <p className="text-sm text-muted-foreground">
          O Lovable AI (Google Gemini e GPT-5) já está configurado automaticamente e não requer API key adicional.
          Use esta seção para adicionar chaves de provedores externos como Claude (Anthropic), Gamma ou Manus.
        </p>
      </div>

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
