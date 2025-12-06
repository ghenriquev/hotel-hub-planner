import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { SaveIndicator } from "@/components/SaveIndicator";
import { useStore } from "@/lib/store";
import { getModuleById } from "@/lib/modules-data";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  Play, 
  Upload,
  FileText,
  Image,
  X,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModuleExecution() {
  const navigate = useNavigate();
  const { id: hotelId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const { getHotel, getProgress, updateProgress } = useStore();

  const hotel = getHotel(hotelId || "");
  const module = getModuleById(parseInt(moduleId || "0"));
  const existingProgress = getProgress(hotelId || "", parseInt(moduleId || "0"));

  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    existingProgress?.checklist || {}
  );
  const [answers, setAnswers] = useState<Record<string, string>>(
    existingProgress?.answers || {}
  );
  const [clientSummary, setClientSummary] = useState(
    existingProgress?.clientSummary || ""
  );
  const [attachments, setAttachments] = useState<string[]>(
    existingProgress?.attachments || []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-save
  const save = useCallback(() => {
    if (!hotelId || !moduleId) return;

    const allChecklistComplete = module?.checklist.every((item) => checklist[item.id]) || false;
    const allAnswersFilled = module?.questions.every((q) => answers[q.id]?.trim()) || false;
    const summaryFilled = clientSummary.trim().length > 0;
    const isCompleted = allChecklistComplete && allAnswersFilled && summaryFilled;

    updateProgress(hotelId, parseInt(moduleId), {
      checklist,
      answers,
      clientSummary,
      attachments,
      completed: isCompleted,
    });
  }, [hotelId, moduleId, checklist, answers, clientSummary, attachments, module, updateProgress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSaving(true);
      save();
      setTimeout(() => {
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 300);
    }, 1000);

    return () => clearTimeout(timer);
  }, [checklist, answers, clientSummary, attachments, save]);

  if (!hotel || !module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl text-foreground mb-4">
            Módulo não encontrado
          </h2>
          <Button onClick={() => navigate(`/hotel/${hotelId}`)}>
            Voltar ao Hotel
          </Button>
        </div>
      </div>
    );
  }

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [itemId]: checked }));
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file) => file.name);
    setAttachments((prev) => [...prev, ...newAttachments]);
    toast.success(`${files.length} arquivo(s) adicionado(s)`);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const allChecklistComplete = module.checklist.every((item) => checklist[item.id]);
  const allAnswersFilled = module.questions.every((q) => answers[q.id]?.trim());
  const canComplete = allChecklistComplete && allAnswersFilled && clientSummary.trim();

  const handleComplete = () => {
    if (!canComplete) {
      toast.error("Complete todos os campos obrigatórios");
      return;
    }

    updateProgress(hotelId!, parseInt(moduleId!), {
      checklist,
      answers,
      clientSummary,
      attachments,
      completed: true,
    });

    toast.success("Módulo concluído com sucesso!");
    
    // Navigate to next module or back to hotel
    const nextModuleId = parseInt(moduleId!) + 1;
    if (nextModuleId <= 10) {
      navigate(`/hotel/${hotelId}/module/${nextModuleId}`);
    } else {
      navigate(`/hotel/${hotelId}`);
    }
  };

  const prevModuleId = parseInt(moduleId!) - 1;
  const nextModuleId = parseInt(moduleId!) + 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/hotel/${hotelId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo />
          </div>
          <SaveIndicator saving={saving} saved={saved} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Module header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{hotel.name}</span>
            <span>/</span>
            <span>Módulo #{module.id}</span>
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">
            {module.title}
          </h1>
          <p className="text-muted-foreground">{module.description}</p>
        </div>

        {/* Video tutorial */}
        <section className="bg-card border border-border rounded-xl overflow-hidden mb-8 animate-slide-up">
          <div className="aspect-video bg-muted relative">
            <iframe
              src={module.videoUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <Play className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Vídeo Tutorial</span>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Instruções
          </h2>
          <p className="text-muted-foreground leading-relaxed">{module.instructions}</p>
        </section>

        {/* Checklist */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <h2 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Checklist Obrigatório
            {!allChecklistComplete && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full ml-2">
                Obrigatório
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {module.checklist.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  checklist[item.id]
                    ? "bg-gold-muted/30 border-gold/30"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <Checkbox
                  checked={checklist[item.id] || false}
                  onCheckedChange={(checked) =>
                    handleChecklistChange(item.id, checked as boolean)
                  }
                />
                <span className={cn(
                  "text-sm",
                  checklist[item.id] ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Questions */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Análise Orientada
            {!allAnswersFilled && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full ml-2">
                Obrigatório
              </span>
            )}
          </h2>
          <div className="space-y-6">
            {module.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id} className="text-foreground">
                  {question.question}
                </Label>
                <Textarea
                  id={question.id}
                  placeholder={question.placeholder}
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="min-h-[100px] resize-none"
                  required
                />
              </div>
            ))}
          </div>
        </section>

        {/* Attachments */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <h2 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Anexos
          </h2>
          
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center mb-4">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">
                  Clique para enviar arquivos
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Imagens, PDFs, planilhas (máx. 10MB)
                </p>
              </div>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate max-w-[200px]">
                      {file}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Client summary */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="font-display text-lg text-foreground mb-2">
            Resumo para o Cliente
            {!clientSummary.trim() && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full ml-2">
                Obrigatório
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {module.clientSummaryLabel}
          </p>
          <Textarea
            placeholder="Escreva um resumo conciso que será exibido ao cliente..."
            value={clientSummary}
            onChange={(e) => setClientSummary(e.target.value)}
            className="min-h-[120px] resize-none"
            required
          />
        </section>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: "0.35s" }}>
          <Button
            variant="outline"
            onClick={() => navigate(`/hotel/${hotelId}/module/${prevModuleId}`)}
            disabled={prevModuleId < 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Módulo Anterior
          </Button>
          
          <Button
            variant="premium"
            onClick={handleComplete}
            disabled={!canComplete}
          >
            {nextModuleId <= 10 ? "Salvar e Próximo" : "Concluir Plano"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
