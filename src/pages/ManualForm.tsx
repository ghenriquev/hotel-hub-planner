import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { usePublicManualForm, HotelManualData } from "@/hooks/useHotelManualData";
import { useManualFormTemplate } from "@/hooks/useManualFormTemplate";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/Logo";
import { SaveIndicator } from "@/components/SaveIndicator";
import { DynamicFormStep } from "@/components/DynamicFormStep";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Send } from "lucide-react";

export default function ManualForm() {
  const { hotelId, token } = useParams<{ hotelId: string; token: string }>();
  const navigate = useNavigate();
  const { hotelInfo, manualData, loading, saving, error, isValid, updateManualData, submitManual } = usePublicManualForm(hotelId, token);
  const { template, loading: templateLoading } = useManualFormTemplate();
  
  const [currentStep, setCurrentStep] = useState(manualData?.current_step || 1);
  const [formData, setFormData] = useState<Partial<HotelManualData>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isFirstRender = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use steps from template or fallback
  const steps = template?.steps || [];
  const totalSteps = steps.length;

  // Debounce the formData changes
  const debouncedFormData = useDebounce(formData, 1500);

  // Merge existing data with form data
  const mergedData = { ...manualData, ...formData };

  const updateFormData = (updates: Partial<HotelManualData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Reset to idle when user starts typing again
    if (saveStatus === 'saved' || saveStatus === 'error') {
      setSaveStatus('idle');
    }
  };

  // Auto-save effect
  useEffect(() => {
    // Skip first render and empty formData
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (Object.keys(debouncedFormData).length === 0) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      
      const success = await updateManualData({
        ...debouncedFormData,
        current_step: currentStep
      });
      
      if (success) {
        setSaveStatus('saved');
        // Auto-hide "Salvo" after 3 seconds
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } else {
        setSaveStatus('error');
      }
    };

    autoSave();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedFormData]);

  const handleNext = async () => {
    // Save current step data
    await updateManualData({
      ...formData,
      current_step: currentStep + 1
    });
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const success = await submitManual();
    
    if (success) {
      toast.success("Formulário enviado com sucesso!");
    } else {
      toast.error("Erro ao enviar. Tente novamente.");
    }
  };

  if (loading || templateLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display text-foreground mb-2">Link Inválido</h1>
          <p className="text-muted-foreground mb-6">{error || "Este link não é válido ou expirou."}</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  if (!template || steps.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display text-foreground mb-2">Template Não Encontrado</h1>
          <p className="text-muted-foreground mb-6">O template do formulário não foi configurado.</p>
        </div>
      </div>
    );
  }

  if (manualData?.is_complete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-display text-foreground mb-2">Formulário Já Enviado</h1>
          <p className="text-muted-foreground mb-2">
            O Manual de Funcionamento de <strong>{hotelInfo?.name}</strong> já foi preenchido e enviado.
          </p>
          <p className="text-sm text-muted-foreground">
            Enviado em: {manualData.submitted_at ? new Date(manualData.submitted_at).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep - 1];
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="sm" />
              <div className="hidden sm:block">
                <h1 className="font-display text-lg text-foreground">{hotelInfo?.name}</h1>
                <p className="text-sm text-muted-foreground">Manual de Funcionamento</p>
              </div>
            </div>
            
            <SaveIndicator status={saveStatus} />
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium text-foreground">
              Etapa {currentStep} de {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {currentStepData?.title}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Navigation Pills */}
      <div className="bg-muted/30 border-b border-border overflow-x-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 min-w-max">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                    ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  {step.id < currentStep && <CheckCircle2 className="h-4 w-4" />}
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{step.id}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-display text-foreground">{currentStepData?.title}</h2>
              <p className="text-muted-foreground">{currentStepData?.subtitle}</p>
            </div>

            {currentStepData && (
              <DynamicFormStep 
                step={currentStepData} 
                data={mergedData} 
                onChange={updateFormData} 
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-card border-t border-border sticky bottom-0">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === totalSteps ? (
                <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar Formulário
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
