import { useParams } from "react-router-dom";
import { ExternalLink, FileText, Building2, Loader2 } from "lucide-react";
import { usePublicHotel } from "@/hooks/usePublicHotel";
import { Logo } from "@/components/Logo";

export default function PublicClientView() {
  const { slug } = useParams<{ slug: string }>();
  const { hotel, results, clienteOcultoUrl, loading, error } = usePublicHotel(slug);

  const totalResults = results.length + (clienteOcultoUrl ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="font-display text-2xl text-foreground mb-2">Hotel não encontrado</h2>
          <p className="text-muted-foreground">
            O link pode estar incorreto ou o hotel não existe mais.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Hotel Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">{hotel.name}</h1>
            <p className="text-muted-foreground">
              {totalResults} resultado(s) disponível(is)
            </p>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {results.length === 0 && !clienteOcultoUrl ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Nenhum resultado disponível ainda
              </p>
            </div>
          ) : (
            <>
              {results.map((item) => (
                <div 
                  key={item.module_id} 
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                >
                  <span className="font-medium text-foreground text-lg">{item.module_title}</span>
                  
                  {item.presentation_url ? (
                    <a 
                      href={item.presentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir Apresentação
                    </a>
                  ) : item.has_text_result ? (
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">
                      Relatório disponível
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem resultado</span>
                  )}
                </div>
              ))}

              {/* Cliente Oculto */}
              {clienteOcultoUrl && (
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
                  <span className="font-medium text-foreground text-lg">Cliente Oculto</span>
                  <a 
                    href={clienteOcultoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Abrir Documento
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Reprotel. Todos os direitos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}
