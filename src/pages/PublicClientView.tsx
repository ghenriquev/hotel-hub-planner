import { useState } from "react";
import { useParams } from "react-router-dom";
import { ExternalLink, FileText, Building2, Loader2, Video, Package, Download, ChevronDown } from "lucide-react";
import { usePublicHotel } from "@/hooks/usePublicHotel";
import { Logo } from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DELIVERABLE_SECTIONS = [
  { key: "briefing_estrategico", title: "Briefing Estratégico", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "artes_textos", title: "Artes e Textos", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "anuncios", title: "Anúncios", fields: [{ key: "link_google", label: "Link Google", type: "url" }, { key: "link_meta", label: "Link Meta", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "email_marketing", title: "Email Marketing", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "landing_page", title: "Landing Page", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "crm", title: "CRM", fields: [{ key: "link", label: "Link do CRM", type: "url" }, { key: "login", label: "Login", type: "text" }, { key: "senha", label: "Senha", type: "text" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "cliente_oculto_scripts", title: "Cliente Oculto / Roteiro de WhatsApp / Script de Pós Venda", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "seo_1", title: "SEO & GEO - Avaliação Técnica", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "seo_2", title: "SEO & GEO - Otimização de Páginas", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "seo_3", title: "SEO & GEO - Pauta de Conteúdos", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "seo_4", title: "SEO & GEO - Correção Prioritária", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "analytics_1", title: "Analytics - Tag Manager", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "analytics_2", title: "Analytics - Google Analytics", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "analytics_3", title: "Analytics - Conversão Google ADS", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
  { key: "analytics_4", title: "Analytics - Pixel do Facebook", fields: [{ key: "link", label: "Link", type: "url" }, { key: "video", label: "Vídeo explicativo", type: "url" }] },
];

function hasAnyValue(obj: Record<string, string> | undefined): boolean {
  if (!obj) return false;
  return Object.values(obj).some(v => v && v.trim() !== '');
}

export default function PublicClientView() {
  const { slug } = useParams<{ slug: string }>();
  const { hotel, results, clienteOcultoUrl, projectData, loading, error } = usePublicHotel(slug);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [phase34Open, setPhase34Open] = useState(false);

  const completedCount = results.filter(r => r.presentation_url || r.has_text_result).length;
  const totalResults = completedCount + (clienteOcultoUrl ? 1 : 0);

  const meetingLinks = projectData ? [
    { label: "Reunião de Kick-OFF", url: projectData.meeting_kickoff_url },
    { label: "Reunião Entrega Fase 1", url: projectData.meeting_phase1_url },
    { label: "Reunião Entrega Fase 2", url: projectData.meeting_phase2_url },
    { label: "Reunião Entrega Final", url: projectData.meeting_final_url },
  ].filter(m => m.url) : [];

  const deliverables = projectData?.phase34_deliverables as Record<string, Record<string, string>> | null;
  const hasDeliverables = deliverables && DELIVERABLE_SECTIONS.some(s => hasAnyValue(deliverables[s.key]));

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
      available: true,
      isDeliverables: true,
    },
    {
      label: "Fase 5 – Relatório Final",
      url: projectData.phase5_presentation_url,
      available: projectData.phase5_status === 'completed',
    },
  ] : [];

  const handleExportPdf = async (pdfUrl: string, key: string) => {
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
        body: JSON.stringify({ presentationUrl: pdfUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error || `Export failed: ${response.status}`;
        alert(message);
        return;
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
      alert('Erro ao exportar PDF. Tente novamente mais tarde.');
    } finally {
      setDownloadingKey(null);
    }
  };

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
                  {phase.isDeliverables && phase.available ? (
                    <button
                      onClick={() => setPhase34Open(!phase34Open)}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${phase34Open ? 'rotate-180' : ''}`} />
                      {phase34Open ? 'Fechar' : 'Ver Entregas'}
                    </button>
                  ) : phase.available && phase.url ? (
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

        {/* Phase 3&4 Deliverables Accordion */}
        {phase34Open && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Entregas - Fases 3 & 4</h2>
            </div>
            {hasDeliverables ? (
              <Accordion type="multiple" className="space-y-2">
                {DELIVERABLE_SECTIONS.filter(s => hasAnyValue(deliverables![s.key])).map(section => (
                  <AccordionItem key={section.key} value={section.key} className="border border-border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm">
                      <span className="font-medium text-foreground">{section.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      <div className="space-y-2">
                        {section.fields.map(field => {
                          const value = deliverables![section.key]?.[field.key];
                          if (!value || value.trim() === '') return null;

                          if (field.type === 'url') {
                            return (
                              <a key={field.key} href={value} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 border border-border rounded-lg hover:border-primary/30 transition-colors">
                                <span className="text-sm text-muted-foreground">{field.label}</span>
                                <div className="flex items-center gap-1 text-primary text-sm">
                                  <ExternalLink className="h-3 w-3" />
                                  Abrir
                                </div>
                              </a>
                            );
                          }

                          return (
                            <div key={field.key} className="flex items-center justify-between p-2 border border-border rounded-lg">
                              <span className="text-sm text-muted-foreground">{field.label}</span>
                              <span className="text-sm text-foreground font-mono">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma entrega disponível ainda. Os materiais serão adicionados em breve.
              </p>
            )}
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
                      {item.pdf_url && (
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

        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Reprotel. Todos os direitos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}
