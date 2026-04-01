import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Video, Save, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HotelProjectData } from "@/hooks/useHotelProjectData";

interface MeetingLinksSectionProps {
  projectData: HotelProjectData | null;
  onSave: (updates: Partial<HotelProjectData>) => Promise<boolean>;
  saving: boolean;
  readOnly?: boolean;
}

const MEETING_FIELDS = [
  { key: "meeting_kickoff_url" as const, label: "Reunião de Kick-OFF" },
  { key: "meeting_phase1_url" as const, label: "Reunião Entrega Fase 1" },
  { key: "meeting_phase2_url" as const, label: "Reunião Entrega Fase 2" },
  { key: "meeting_final_url" as const, label: "Reunião Entrega Final" },
];

export function MeetingLinksSection({ projectData, onSave, saving, readOnly }: MeetingLinksSectionProps) {
  const [links, setLinks] = useState<Record<string, string>>({
    meeting_kickoff_url: projectData?.meeting_kickoff_url || "",
    meeting_phase1_url: projectData?.meeting_phase1_url || "",
    meeting_phase2_url: projectData?.meeting_phase2_url || "",
    meeting_final_url: projectData?.meeting_final_url || "",
  });
  const [dirty, setDirty] = useState(false);

  const handleChange = (key: string, value: string) => {
    setLinks(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    const success = await onSave(links as any);
    if (success) {
      toast.success("Links salvos com sucesso!");
      setDirty(false);
    } else {
      toast.error("Erro ao salvar links");
    }
  };

  return (
    <div className="bg-card border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg text-foreground">Links das Reuniões</h2>
            <p className="text-sm text-muted-foreground">Links de gravação das reuniões do projeto</p>
          </div>
        </div>
        {!readOnly && dirty && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEETING_FIELDS.map(field => (
          <div key={field.key} className="space-y-1">
            <label className="text-sm font-medium text-foreground">{field.label}</label>
            <div className="flex gap-2">
              {readOnly ? (
                links[field.key] ? (
                  <a href={links[field.key]} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="h-4 w-4" />
                    Abrir Reunião
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">Não disponível</span>
                )
              ) : (
                <>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={links[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                  />
                  {links[field.key] && (
                    <a href={links[field.key]} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" type="button">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
