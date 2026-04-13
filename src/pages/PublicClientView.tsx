import { useParams } from "react-router-dom";
import { useState } from "react";
import { ExternalLink, FileText, Building2, Loader2, Video, Package, Download } from "lucide-react";
import { usePublicHotel } from "@/hooks/usePublicHotel";
import { Logo } from "@/components/Logo";

export default function PublicClientView() {
  const { slug } = useParams<{ slug: string }>();
  const { hotel, results, clienteOcultoUrl, projectData, loading, error } = usePublicHotel(slug);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const completedCount = results.filter(r => r.presentation_url || r.has_text_result).length;
  const totalResults = completedCount + (clienteOcultoUrl ? 1 : 0);

  const meetingLinks = projectData ? [
    { label: "Reunião de Kick-OFF", url: projectData.meeting_kickoff_url },
    { label: "Reunião Entrega Fase 1", url: projectData.meeting_phase1_url },
    { label: "Reunião Entrega Fase 2", url: projectData.meeting_phase2_url },
    { label: "Reunião Entrega Final", url: projectData.meeting_final_url },
  ].filter(m => m.url) : [];

  const phases = projectData ? [
    {
      label: "Fase 1 – Kick Off & Alinhamento",
      url: projectData.phase1_presentation_url || 'https://gamma.app/docs/KICK-OFF-Plano-Estrategico-de-Vendas-Diretas-5ul4lfxo39kby07?mode=doc',
      available: true,
    },
    {
      label: "Fase 2 – Estratégia",
      url: projectData.phase2_presentation_url,
      available: projectData.phase2_status === 'completed',
    },
    {
      label: "Fases 3 & 4 – Construção & Ativação",
      url: null,
      available: false,
      isDeliverables: true,
    },
    {
      label: "Fase 5 – Relatório Final",
      url: projectData.phase5_presentation_url,
      available: projectData.phase5_status === 'completed',
    },
  ] : [];

  const handleExportPdf = async (url: string, key: string) => {
    setDownloadingKey(key);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ presentationUrl: url }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'apresentacao.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('[export-pdf] Error:', err);
    } finally {
      setDownloadingKey(null);
    }
  };

  // Extract deliverables from phase34 data
  const deliverables = projectData?.phase34_deliverables as Record<string, any> | null;
  const deliverableItems = deliverables ? Object.entries(deliverables)
    .filter(([_, val]) => val && typeof val === 'object')
    .flatMap(([category, val]: [string, any]) => {
      const items: { label: string; url: string; type: string }[] = [];
      if (val.link) items.push({ label: category, url: val.link, type: 'link' });
      if (val.video) items.push({ label: `${category} (Vídeo)`, url: val.video, type: 'video' });
      // Handle nested items (like CRM with login, password, link, video)
      if (val.items && typeof val.items === 'object') {
        Object.entries(val.items).forEach(([subKey, subVal]: [string, any]) => {
          if (subVal && typeof subVal === 'string' && subVal.startsWith('http')) {
            items.push({ label: `${category} - ${subKey}`, url: subVal, type: 'link' });
          }
        });
      }
      return items;
    }) : [];


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

        {/* Meeting Links */}
        {meetingLinks.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Video className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Reuniões</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {meetingLinks.map((m, i) => (
                <a key={i} href={m.url!} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-border rounded-lg hover:border-primary/30 transition-colors">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{m.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Phases */}
        {phases.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Etapas do Projeto</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {phases.map((phase, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <span className="text-sm font-medium text-foreground">{phase.label}</span>
                  {phase.available && phase.url ? (
                    <div className="flex items-center gap-2">
                      <a href={phase.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-sm">
                        <ExternalLink className="h-3 w-3" />
                        Abrir
                      </a>
                      <button
                        onClick={() => handleExportPdf(phase.url!, `phase-${i}`)}
                        disabled={downloadingKey === `phase-${i}`}
                        className="flex items-center gap-1 border border-border text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm disabled:opacity-50"
                        title="Baixar PDF"
                      >
                        {downloadingKey === `phase-${i}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        PDF
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Em breve</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deliverables from Phase 3 & 4 */}
        {deliverableItems.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Materiais das Fases 3 & 4</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deliverableItems.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/30 transition-colors">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-3">
          {results.length > 0 || clienteOcultoUrl ? (
            <>
              {results.map((item) => (
                <div
                  key={item.module_id}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                >
                  <span className="font-medium text-foreground">{item.module_title}</span>

                  {item.presentation_url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={item.presentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir Apresentação
                      </a>
                      {item.pdf_url ? (
                        <a
                          href={item.pdf_url}
                          download="apresentacao.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 border border-border text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                          title="Baixar PDF"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      ) : (
                        <button
                          onClick={() => handleExportPdf(item.presentation_url!, `agent-${item.module_id}`)}
                          disabled={downloadingKey === `agent-${item.module_id}`}
                          className="flex items-center gap-1 border border-border text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm disabled:opacity-50"
                          title="Baixar PDF"
                        >
                          {downloadingKey === `agent-${item.module_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          PDF
                        </button>
                      )}
                    </div>
                  ) : item.has_text_result ? (
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">
                      Relatório disponível
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Em breve</span>
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
          ) : null}
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
