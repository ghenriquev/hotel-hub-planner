import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { HotelManualData } from "@/hooks/useHotelManualData";
import { Sparkles, Wifi, Shield } from "lucide-react";

interface Step3Props {
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}

const DIFFERENTIALS_OPTIONS = [
  { key: "pet_friendly", label: "Pet Friendly" },
  { key: "acessibilidade", label: "Acessibilidade" },
  { key: "sustentabilidade", label: "Sustentabilidade" },
  { key: "spa", label: "Spa" },
  { key: "academia", label: "Academia" },
  { key: "piscina", label: "Piscina" },
  { key: "restaurante", label: "Restaurante" },
  { key: "bar", label: "Bar" },
  { key: "room_service", label: "Room Service 24h" },
  { key: "transfer", label: "Transfer" },
  { key: "estacionamento", label: "Estacionamento" },
  { key: "eventos", label: "Espaço para Eventos" },
];

const POLICIES_OPTIONS = [
  { key: "check_in", label: "Horário Check-in", placeholder: "Ex: 14:00" },
  { key: "check_out", label: "Horário Check-out", placeholder: "Ex: 12:00" },
  { key: "early_check_in", label: "Early Check-in", placeholder: "Política e valor" },
  { key: "late_check_out", label: "Late Check-out", placeholder: "Política e valor" },
  { key: "cancelamento", label: "Política de Cancelamento", placeholder: "Descreva a política" },
  { key: "criancas", label: "Política de Crianças", placeholder: "Idade, valores, etc." },
  { key: "pets", label: "Política de Pets", placeholder: "Regras e valores" },
  { key: "fumantes", label: "Política de Fumantes", placeholder: "Áreas permitidas" },
];

export function Step3Differentials({ data, onChange }: Step3Props) {
  const differentials = data.differentials || {};
  const policies = data.policies || {};
  const internetInfo = data.internet_info || {};

  const toggleDifferential = (key: string) => {
    const updated = {
      ...differentials,
      [key]: {
        ...differentials[key],
        enabled: !differentials[key]?.enabled
      }
    };
    onChange({ differentials: updated });
  };

  const updateDifferentialDesc = (key: string, description: string) => {
    const updated = {
      ...differentials,
      [key]: {
        ...differentials[key],
        description
      }
    };
    onChange({ differentials: updated });
  };

  const updatePolicy = (key: string, value: string) => {
    onChange({ policies: { ...policies, [key]: value } });
  };

  const updateInternet = (field: string, value: string) => {
    onChange({ internet_info: { ...internetInfo, [field]: value } });
  };

  return (
    <div className="space-y-8">
      {/* Diferenciais */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Diferenciais do Hotel</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione os diferenciais e adicione descrições quando necessário
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIFFERENTIALS_OPTIONS.map((item) => (
            <div key={item.key} className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={item.key}
                  checked={differentials[item.key]?.enabled || false}
                  onCheckedChange={() => toggleDifferential(item.key)}
                />
                <Label htmlFor={item.key} className="font-medium cursor-pointer">
                  {item.label}
                </Label>
              </div>
              {differentials[item.key]?.enabled && (
                <Textarea
                  placeholder={`Descreva detalhes sobre ${item.label.toLowerCase()}`}
                  value={differentials[item.key]?.description || ""}
                  onChange={(e) => updateDifferentialDesc(item.key, e.target.value)}
                  rows={2}
                  className="mt-2"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Internet */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Internet</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wifi_coverage">Cobertura Wi-Fi</Label>
            <Input
              id="wifi_coverage"
              placeholder="Ex: Todo o hotel, áreas comuns, quartos"
              value={internetInfo.coverage || ""}
              onChange={(e) => updateInternet("coverage", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wifi_speed">Velocidade</Label>
            <Input
              id="wifi_speed"
              placeholder="Ex: 100 Mbps"
              value={internetInfo.speed || ""}
              onChange={(e) => updateInternet("speed", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="wifi_obs">Observações sobre Internet</Label>
            <Textarea
              id="wifi_obs"
              placeholder="Informações adicionais sobre a internet"
              value={internetInfo.observations || ""}
              onChange={(e) => updateInternet("observations", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Políticas */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Políticas do Hotel</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POLICIES_OPTIONS.map((policy) => (
            <div key={policy.key} className="space-y-2">
              <Label htmlFor={policy.key}>{policy.label}</Label>
              {policy.key === "cancelamento" || policy.key === "criancas" || policy.key === "pets" ? (
                <Textarea
                  id={policy.key}
                  placeholder={policy.placeholder}
                  value={policies[policy.key] || ""}
                  onChange={(e) => updatePolicy(policy.key, e.target.value)}
                  rows={2}
                />
              ) : (
                <Input
                  id={policy.key}
                  placeholder={policy.placeholder}
                  value={policies[policy.key] || ""}
                  onChange={(e) => updatePolicy(policy.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
