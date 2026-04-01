import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHotel } from "@/hooks/useHotels";
import { useHotelProjectData } from "@/hooks/useHotelProjectData";
import { ArrowLeft, Save, Loader2, ExternalLink, Package } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DeliverableField {
  key: string;
  label: string;
  type: 'url' | 'text';
}

interface DeliverableSection {
  key: string;
  title: string;
  fields: DeliverableField[];
}

const DELIVERABLE_SECTIONS: DeliverableSection[] = [
  {
    key: "briefing_estrategico",
    title: "Briefing Estratégico",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "artes_textos",
    title: "Artes e Textos",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "anuncios",
    title: "Anúncios",
    fields: [
      { key: "link_google", label: "Link Google", type: "url" },
      { key: "link_meta", label: "Link Meta", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "email_marketing",
    title: "Email Marketing",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "landing_page",
    title: "Landing Page",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "crm",
    title: "CRM",
    fields: [
      { key: "link", label: "Link do CRM", type: "url" },
      { key: "login", label: "Login Conta Reprotel CRM", type: "text" },
      { key: "senha", label: "Senha", type: "text" },
      { key: "video", label: "Vídeo explicativo sobre o CRM", type: "url" },
    ]
  },
  {
    key: "cliente_oculto_scripts",
    title: "Cliente Oculto / Roteiro de WhatsApp / Script de Pós Venda",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "seo_1",
    title: "SEO & GEO - 1. Avaliação da Estrutura Técnica básica de SEO",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "seo_2",
    title: "SEO & GEO - 2. Boas práticas para otimização de páginas",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "seo_3",
    title: "SEO & GEO - 3. Pauta estratégica de conteúdos para blog",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "seo_4",
    title: "SEO & GEO - 4. Check List de Correção Prioritária",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "analytics_1",
    title: "Analytics e Trackeamento - 1. Tag Manager",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "analytics_2",
    title: "Analytics e Trackeamento - 2. Google Analytics",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "analytics_3",
    title: "Analytics e Trackeamento - 3. Conversão do Google ADS",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
  {
    key: "analytics_4",
    title: "Analytics e Trackeamento - 4. Pixel do Facebook",
    fields: [
      { key: "link", label: "Link", type: "url" },
      { key: "video", label: "Vídeo explicativo dessa entrega", type: "url" },
    ]
  },
];

export default function Phase34Deliverables() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hotel, loading: hotelLoading } = useHotel(id);
  const { projectData, loading, saving, updateProjectData } = useHotelProjectData(id);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (projectData?.phase34_deliverables) {
      setFormData(projectData.phase34_deliverables as Record<string, Record<string, string>>);
    }
  }, [projectData]);

  const handleFieldChange = (sectionKey: string, fieldKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        [fieldKey]: value,
      }
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    const success = await updateProjectData({ phase34_deliverables: formData });
    if (success) {
      toast.success("Entregas salvas com sucesso!");
      setDirty(false);
    } else {
      toast.error("Erro ao salvar entregas");
    }
  };

  if (loading || hotelLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/hotel/${id}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para {hotel?.name}
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary flex items-center justify-center">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-foreground">Entregas - Fases 3 & 4</h1>
            <p className="text-sm text-muted-foreground">Construção e Ativação - {hotel?.name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={DELIVERABLE_SECTIONS.map(s => s.key)} className="space-y-3">
        {DELIVERABLE_SECTIONS.map(section => (
          <AccordionItem key={section.key} value={section.key} className="bg-card border border-border rounded-xl overflow-hidden">
            <AccordionTrigger className="px-5 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground text-sm">{section.title}</span>
                {hasAnyValue(formData[section.key]) && (
                  <span className="text-xs bg-gold/20 text-foreground px-2 py-0.5 rounded-full">Preenchido</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="space-y-3">
                {section.fields.map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                    <div className="flex gap-2">
                      <Input
                        type={field.type === 'url' ? 'url' : 'text'}
                        placeholder={field.type === 'url' ? 'https://...' : field.label}
                        value={formData[section.key]?.[field.key] || ''}
                        onChange={e => handleFieldChange(section.key, field.key, e.target.value)}
                      />
                      {field.type === 'url' && formData[section.key]?.[field.key] && (
                        <a href={formData[section.key][field.key]} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" type="button">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function hasAnyValue(obj: Record<string, string> | undefined): boolean {
  if (!obj) return false;
  return Object.values(obj).some(v => v && v.trim() !== '');
}
