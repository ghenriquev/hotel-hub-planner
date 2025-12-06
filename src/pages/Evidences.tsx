import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { MODULES } from "@/lib/modules-data";
import { 
  ArrowLeft, 
  Check, 
  ChevronRight,
  FileText,
  Image,
  MessageSquare,
  Paperclip
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Evidences() {
  const navigate = useNavigate();
  const { id: hotelId } = useParams<{ id: string }>();
  const { getHotel, getProgress } = useStore();

  const hotel = getHotel(hotelId || "");
  
  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl text-foreground mb-4">Hotel não encontrado</h2>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const modulesWithProgress = MODULES.map((module) => {
    const progress = getProgress(hotel.id, module.id);
    return { module, progress };
  }).filter(({ progress }) => progress && (
    Object.keys(progress.checklist).length > 0 ||
    Object.keys(progress.answers).length > 0 ||
    progress.clientSummary
  ));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/hotel/${hotelId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{hotel.name}</span>
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">
            Evidências e Resultados
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as informações preenchidas para este hotel
          </p>
        </div>

        {modulesWithProgress.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl text-foreground mb-2">
              Nenhuma evidência ainda
            </h3>
            <p className="text-muted-foreground mb-6">
              Complete os módulos para ver as evidências aqui
            </p>
            <Button onClick={() => navigate(`/hotel/${hotelId}`)} variant="premium">
              Ir para Módulos
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {modulesWithProgress.map(({ module, progress }, index) => (
              <div
                key={module.id}
                className={cn(
                  "bg-card border rounded-xl overflow-hidden animate-slide-up",
                  progress?.completed ? "border-gold/50" : "border-border"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Module header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                      progress?.completed 
                        ? "bg-gold text-foreground" 
                        : "gradient-primary text-primary-foreground"
                    )}>
                      {progress?.completed ? <Check className="h-4 w-4" /> : `#${module.id}`}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{module.title}</h3>
                      <span className={cn(
                        "text-xs",
                        progress?.completed ? "text-gold" : "text-primary"
                      )}>
                        {progress?.completed ? "Completo" : "Em progresso"}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/hotel/${hotelId}/module/${module.id}`)}
                  >
                    Editar
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {/* Checklist summary */}
                {progress && Object.keys(progress.checklist).length > 0 && (
                  <div className="p-4 border-b border-border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Checklist
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {module.checklist.map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            progress.checklist[item.id]
                              ? "bg-gold-muted text-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {progress.checklist[item.id] ? "✓" : "○"} {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answers */}
                {progress && Object.keys(progress.answers).length > 0 && (
                  <div className="p-4 border-b border-border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Análise
                    </h4>
                    <div className="space-y-4">
                      {module.questions.map((question) => (
                        progress.answers[question.id] && (
                          <div key={question.id}>
                            <p className="text-xs text-muted-foreground mb-1">
                              {question.question}
                            </p>
                            <p className="text-sm text-foreground">
                              {progress.answers[question.id]}
                            </p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {progress?.attachments && progress.attachments.length > 0 && (
                  <div className="p-4 border-b border-border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Anexos ({progress.attachments.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {progress.attachments.map((file, i) => (
                        <span
                          key={i}
                          className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded flex items-center gap-1"
                        >
                          <Image className="h-3 w-3" />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client summary */}
                {progress?.clientSummary && (
                  <div className="p-4 bg-gold-muted/20">
                    <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gold" />
                      Resumo para o Cliente
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {progress.clientSummary}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
