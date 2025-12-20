import { useNavigate } from "react-router-dom";
import { Eye, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentResult } from "@/hooks/useAgentResults";

interface AgentConfig {
  module_id: number;
  module_title: string;
  display_order: number;
  output_type: string | null;
}

interface ClientViewSectionProps {
  hotelId: string;
  hotelName: string;
  results: AgentResult[];
  configs: AgentConfig[];
}

export function ClientViewSection({ hotelId, hotelName, results, configs }: ClientViewSectionProps) {
  const navigate = useNavigate();

  const completedResults = results
    .filter(r => r.status === 'completed')
    .map(r => {
      const config = configs.find(c => c.module_id === r.module_id);
      return {
        moduleId: r.module_id,
        moduleTitle: config?.module_title || `Agente ${r.module_id}`,
        outputType: config?.output_type || 'text',
        presentationUrl: r.presentation_url,
        hasTextResult: !!r.result,
        displayOrder: config?.display_order || 999
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (completedResults.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.25s" }}>
      <div className="flex items-center gap-3 mb-4">
        <Eye className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl text-foreground">
          Visualização do Cliente
        </h2>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{hotelName}</h3>
        <p className="text-sm text-muted-foreground">
          {completedResults.length} resultado(s) disponível(is)
        </p>
      </div>
      
      <div className="space-y-2">
        {completedResults.map((item) => (
          <div 
            key={item.moduleId} 
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium text-foreground">{item.moduleTitle}</span>
            
            {item.presentationUrl ? (
              <a 
                href={item.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Apresentação Gamma
              </a>
            ) : item.hasTextResult ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/hotel/${hotelId}/module/${item.moduleId}`)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Ver Relatório
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">Sem resultado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
