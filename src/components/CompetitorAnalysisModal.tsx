import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CompetitorData {
  id: string;
  competitor_url: string;
  competitor_number: number;
  status: string;
  analysis_status?: string;
  generated_analysis?: string | null;
  llm_model_used?: string | null;
  error_message?: string | null;
  crawled_at?: string | null;
}

interface CompetitorAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitors: CompetitorData[];
}

// Parse analysis content - handles both new clean text and legacy JSON format
function parseAnalysisContent(content: string | null | undefined): string {
  if (!content) return '';
  
  // Try to parse as JSON (legacy data)
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      // Extract text from assistant messages
      const texts = parsed
        .filter((m: any) => m.role === 'assistant' && m.content)
        .flatMap((m: any) => {
          if (Array.isArray(m.content)) {
            return m.content
              .filter((c: any) => c.type === 'output_text' && c.text)
              .map((c: any) => c.text);
          }
          return [];
        })
        .filter((t: string) => 
          t && 
          !t.includes('Entendido! Vou realizar') && 
          !t.includes('Vou começar') &&
          t.length > 200
        );
      
      return texts.length > 0 ? texts[texts.length - 1] : '';
    }
  } catch {
    // Not JSON, return as-is
  }
  
  return content;
}

// Render formatted analysis with sections and structure
function FormattedAnalysis({ content }: { content: string }) {
  const parsedContent = parseAnalysisContent(content);
  
  if (!parsedContent) {
    return <p className="text-muted-foreground">Conteúdo não disponível</p>;
  }
  
  const lines = parsedContent.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;
        
        // Main section headers (Seção X:, ## Title, **Title**)
        if (trimmedLine.match(/^(Seção \d+:|##\s|#{1,2}\s|\*\*[^*]+\*\*$)/i)) {
          return (
            <h3 key={i} className="text-base font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
              {trimmedLine.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
            </h3>
          );
        }
        
        // Sub-headers (lines ending with : that are short)
        if (trimmedLine.match(/^[A-ZÀ-Ú][^:]{3,50}:$/) && trimmedLine.length < 60) {
          return (
            <h4 key={i} className="text-sm font-medium text-foreground mt-4 mb-2">
              {trimmedLine}
            </h4>
          );
        }
        
        // Bullet points
        if (trimmedLine.match(/^[-•*]\s/)) {
          return (
            <div key={i} className="flex gap-2 ml-4 text-sm text-muted-foreground">
              <span className="text-primary">•</span>
              <span>{trimmedLine.replace(/^[-•*]\s*/, '')}</span>
            </div>
          );
        }
        
        // Numbered lists
        if (trimmedLine.match(/^\d+\.\s/)) {
          return (
            <div key={i} className="flex gap-2 ml-4 text-sm text-muted-foreground">
              <span className="text-primary font-medium min-w-[1.5rem]">
                {trimmedLine.match(/^\d+/)?.[0]}.
              </span>
              <span>{trimmedLine.replace(/^\d+\.\s*/, '')}</span>
            </div>
          );
        }
        
        // Regular paragraphs
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {trimmedLine}
          </p>
        );
      })}
    </div>
  );
}

export function CompetitorAnalysisModal({ open, onOpenChange, competitors }: CompetitorAnalysisModalProps) {
  const handleCopy = (content: string) => {
    const cleanContent = parseAnalysisContent(content);
    navigator.clipboard.writeText(cleanContent);
    toast.success("Conteúdo copiado!");
  };

  const getStatusBadge = (competitor: CompetitorData) => {
    if (competitor.status === 'error') {
      return <Badge variant="destructive" className="text-xs">Erro no Crawl</Badge>;
    }
    if (competitor.analysis_status === 'completed') {
      return <Badge className="bg-green-500/10 text-green-600 text-xs">Análise Concluída</Badge>;
    }
    if (competitor.analysis_status === 'generating' || competitor.analysis_status === 'processing_manus') {
      return <Badge className="bg-blue-500/10 text-blue-600 text-xs">Processando...</Badge>;
    }
    if (competitor.analysis_status === 'error') {
      return <Badge variant="destructive" className="text-xs">Erro na Análise</Badge>;
    }
    if (competitor.status === 'completed') {
      return <Badge className="bg-amber-500/10 text-amber-600 text-xs">Crawl Concluído</Badge>;
    }
    if (competitor.status === 'crawling') {
      return <Badge className="bg-blue-500/10 text-blue-600 text-xs">Crawling...</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Pendente</Badge>;
  };

  const completedCompetitors = competitors.filter(c => c.analysis_status === 'completed' && c.generated_analysis);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Análises dos Concorrentes
            <Badge variant="secondary" className="text-xs">
              {completedCompetitors.length} de {competitors.length} analisado(s)
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {competitors.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum concorrente encontrado.</p>
          </div>
        ) : (
          <Tabs defaultValue={`competitor-${competitors[0]?.competitor_number || 1}`} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start">
              {competitors.map((competitor) => (
                <TabsTrigger 
                  key={competitor.id} 
                  value={`competitor-${competitor.competitor_number}`}
                  className="flex items-center gap-2"
                >
                  <span>Concorrente {competitor.competitor_number}</span>
                  {competitor.analysis_status === 'completed' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : competitor.status === 'error' || competitor.analysis_status === 'error' ? (
                    <XCircle className="h-3 w-3 text-destructive" />
                  ) : competitor.analysis_status === 'generating' || competitor.analysis_status === 'processing_manus' || competitor.status === 'crawling' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {competitors.map((competitor) => (
              <TabsContent 
                key={competitor.id} 
                value={`competitor-${competitor.competitor_number}`}
                className="flex-1 overflow-hidden flex flex-col mt-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <a 
                      href={competitor.competitor_url.startsWith('http') ? competitor.competitor_url : `https://${competitor.competitor_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {competitor.competitor_url.replace(/^https?:\/\//, '').substring(0, 40)}
                      {competitor.competitor_url.length > 40 ? '...' : ''}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {getStatusBadge(competitor)}
                    {competitor.llm_model_used && (
                      <Badge variant="outline" className="text-xs">
                        {competitor.llm_model_used.replace('google/', '').replace('openai/', '').replace('manus/', '')}
                      </Badge>
                    )}
                  </div>
                  
                  {competitor.generated_analysis && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(competitor.generated_analysis!)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  )}
                </div>
                
                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-4">
                    {competitor.status === 'error' ? (
                      <div className="text-center py-8 text-destructive">
                        <XCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-medium mb-1">Erro no Crawl</p>
                        <p className="text-sm text-muted-foreground">{competitor.error_message || 'Erro desconhecido'}</p>
                      </div>
                    ) : competitor.analysis_status === 'generating' || competitor.analysis_status === 'processing_manus' ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                        <p className="text-muted-foreground">
                          {competitor.analysis_status === 'processing_manus' 
                            ? 'Processando no Manus Agent...' 
                            : 'Gerando análise com LLM...'}
                        </p>
                      </div>
                    ) : competitor.analysis_status === 'error' ? (
                      <div className="text-center py-8 text-destructive">
                        <XCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-medium mb-1">Erro na Análise</p>
                        <p className="text-sm text-muted-foreground">{competitor.error_message || 'Erro ao gerar análise com LLM'}</p>
                      </div>
                    ) : competitor.generated_analysis ? (
                      <FormattedAnalysis content={competitor.generated_analysis} />
                    ) : competitor.status === 'completed' ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Crawl concluído, mas análise não foi gerada.</p>
                        <p className="text-sm">Execute novamente a análise dos concorrentes.</p>
                      </div>
                    ) : competitor.status === 'crawling' ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                        <p className="text-muted-foreground">Extraindo conteúdo do site...</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Análise não iniciada.</p>
                        <p className="text-sm">Clique em "Analisar Concorrentes" para começar.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}