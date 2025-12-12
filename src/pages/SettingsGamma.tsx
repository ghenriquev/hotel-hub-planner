import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  useGammaSettings, 
  GammaSettingsUpdate,
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
import { 
  Save,
  Loader2,
  AlertCircle,
  Presentation,
  Palette,
  Type,
  Image,
  LayoutGrid
} from "lucide-react";

export default function SettingsGamma() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { settings: gammaSettings, loading: gammaLoading, saving: gammaSaving, updateSettings: updateGammaSettings } = useGammaSettings();

  const [gammaForm, setGammaForm] = useState<GammaSettingsUpdate>({});
  const [gammaFormDirty, setGammaFormDirty] = useState(false);

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

  if (roleLoading || gammaLoading) {
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

  if (!gammaSettings) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-card border border-border p-12 text-center">
          <Presentation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground mb-2">Configurações do Gamma não encontradas</h3>
          <p className="text-muted-foreground">
            Entre em contato com o suporte para configurar o Gamma.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Section 1: Aparência */}
      <div className="bg-card border border-border p-6">
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
      <div className="bg-card border border-border p-6">
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
      <div className="bg-card border border-border p-6">
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
      <div className="bg-card border border-border p-6">
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
      <div className="bg-muted/50 p-4">
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          Sobre as Configurações do Gamma
        </h4>
        <p className="text-sm text-muted-foreground">
          Estas configurações serão aplicadas a todas as apresentações geradas pelos agentes. 
          Para usar o Gamma, certifique-se de que você tem uma API Key do Gamma configurada na página "API Keys".
        </p>
      </div>
    </div>
  );
}
