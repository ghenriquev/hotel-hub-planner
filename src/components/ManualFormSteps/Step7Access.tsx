import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HotelManualData } from "@/hooks/useHotelManualData";
import { Key, AlertTriangle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Step7Props {
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}

const ACCESS_SYSTEMS = [
  { key: "facebook_business", label: "Facebook Business" },
  { key: "google_my_business", label: "Google Meu Negócio" },
  { key: "google_ads", label: "Google Ads" },
  { key: "meta_ads", label: "Meta Ads Manager" },
  { key: "google_analytics", label: "Google Analytics" },
  { key: "instagram", label: "Instagram" },
  { key: "pms", label: "PMS (Sistema de Gestão)" },
  { key: "crm", label: "CRM" },
  { key: "motor_reservas", label: "Motor de Reservas" },
  { key: "channel_manager", label: "Channel Manager" },
  { key: "site_admin", label: "Painel do Site" },
  { key: "email_marketing", label: "Ferramenta de E-mail Marketing" },
];

export function Step7Access({ data, onChange }: Step7Props) {
  const accessCredentials = data.access_credentials || {};

  const updateAccess = (system: string, field: string, value: string) => {
    const updated = {
      ...accessCredentials,
      [system]: {
        ...accessCredentials[system],
        [field]: value
      }
    };
    onChange({ access_credentials: updated });
  };

  return (
    <div className="space-y-8">
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>Atenção:</strong> Estas informações são confidenciais e serão tratadas com segurança. 
          Preencha apenas os acessos que deseja compartilhar com a equipe Reprotel.
        </AlertDescription>
      </Alert>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Credenciais de Acesso</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Para cada sistema, informe o e-mail/usuário de acesso e a senha (ou instruções de acesso)
        </p>
        
        <div className="grid grid-cols-1 gap-6">
          {ACCESS_SYSTEMS.map((system) => (
            <div key={system.key} className="p-4 bg-muted/30 rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-foreground">{system.label}</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>URL de Acesso</Label>
                  <Input
                    placeholder="Link de login"
                    value={accessCredentials[system.key]?.url || ""}
                    onChange={(e) => updateAccess(system.key, "url", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail/Usuário</Label>
                  <Input
                    placeholder="Usuário de acesso"
                    value={accessCredentials[system.key]?.username || ""}
                    onChange={(e) => updateAccess(system.key, "username", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={accessCredentials[system.key]?.password || ""}
                    onChange={(e) => updateAccess(system.key, "password", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Outros acessos */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Outros Acessos</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="outros_acessos">Outros sistemas ou acessos importantes</Label>
          <Textarea
            id="outros_acessos"
            placeholder="Liste outros sistemas com seus respectivos acessos"
            value={accessCredentials.outros || ""}
            onChange={(e) => onChange({ 
              access_credentials: { 
                ...accessCredentials, 
                outros: e.target.value 
              } 
            })}
            rows={4}
          />
        </div>
      </section>
    </div>
  );
}
