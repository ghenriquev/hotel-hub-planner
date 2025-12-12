import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { MODULES } from "@/lib/modules-data";
import { 
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
      <div className="flex-1 flex items-center justify-center">
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>{hotel.name}</span>
        </div>
        <p className="text-muted-foreground">
          Visualize todas as informações preenchidas para este hotel
        </p>
      </div>

      {modulesWithProgress.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl text-foreground mb-2">
            Nenhuma evidência ainda
          </h3>
          <p className="text-muted-foreground mb-6">
            Complete os módulos para ver as evidências aqui
          </p>
          <Button onClick={() => navigate(`/hotel/${hotelId}`)}>
            Ir para Módulos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {modulesWithProgress.map(({ module, progress }, index) => (
            <div
              key={module.id}
              className={cn(
                "bg-card border overflow-hidden",
                progress?.completed ? "border-gold/50" : "border-border/60"
              )}
            >
              {/* Module header */}
              <div className="p-4 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center text-sm font-bold",
                    progress?.completed 
                      ? "bg-gold/20 text-gold" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {module.id}
                  </div>
                  <div>
                    <h3 className="font-display text-foreground">
                      {module.title}
                    </h3>
                    {progress?.completed && (
                      <span className="text-xs text-gold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Completo
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/hotel/${hotelId}/module/${module.id}`)}
                >
                  Ver Módulo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Module content */}
              <div className="p-4 space-y-4">
                {/* Checklist items completed */}
                {progress && Object.keys(progress.checklist).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Checklist
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(progress.checklist)
                        .filter(([_, checked]) => checked)
                        .map(([item], idx) => (
                          <div key={idx} className="text-sm text-foreground flex items-center gap-2">
                            <Check className="h-3 w-3 text-gold" />
                            {item}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Answers */}
                {progress && Object.keys(progress.answers).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Respostas
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(progress.answers).map(([question, answer], idx) => (
                        <div key={idx} className="bg-muted/50 p-3">
                          <div className="text-sm font-medium text-foreground mb-1">
                            {question}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {answer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client summary */}
                {progress?.clientSummary && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Resumo do Cliente
                    </h4>
                    <div className="bg-muted/50 p-3">
                      <p className="text-sm text-foreground">{progress.clientSummary}</p>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {progress?.attachments && progress.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Anexos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {progress.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-muted/50 px-3 py-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{typeof attachment === 'string' ? attachment : 'Anexo'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
