import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HotelManualData } from "@/hooks/useHotelManualData";
import { Palmtree, Globe, Car } from "lucide-react";

interface Step5Props {
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}

export function Step5LeisureSite({ data, onChange }: Step5Props) {
  const leisure = data.leisure || {};
  const siteInfo = data.site_info || {};
  const parking = data.parking || {};

  const updateLeisure = (field: string, value: string) => {
    onChange({ leisure: { ...leisure, [field]: value } });
  };

  const updateSiteInfo = (field: string, value: string) => {
    onChange({ site_info: { ...siteInfo, [field]: value } });
  };

  const updateParking = (field: string, value: string) => {
    onChange({ parking: { ...parking, [field]: value } });
  };

  return (
    <div className="space-y-8">
      {/* Lazer */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Palmtree className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Áreas de Lazer</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="piscina">Piscina</Label>
            <Textarea
              id="piscina"
              placeholder="Tipo (adulto, infantil, aquecida), horário de funcionamento, regras"
              value={leisure.piscina || ""}
              onChange={(e) => updateLeisure("piscina", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="academia">Academia/Fitness</Label>
            <Textarea
              id="academia"
              placeholder="Equipamentos disponíveis, horário de funcionamento"
              value={leisure.academia || ""}
              onChange={(e) => updateLeisure("academia", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="spa">Spa/Sauna</Label>
            <Textarea
              id="spa"
              placeholder="Serviços oferecidos, horário, necessidade de agendamento"
              value={leisure.spa || ""}
              onChange={(e) => updateLeisure("spa", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="kids">Espaço Kids</Label>
            <Textarea
              id="kids"
              placeholder="Descrição do espaço, faixa etária, horário, supervisão"
              value={leisure.kids || ""}
              onChange={(e) => updateLeisure("kids", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="eventos_espacos">Espaços para Eventos</Label>
            <Textarea
              id="eventos_espacos"
              placeholder="Salões disponíveis, capacidade, equipamentos"
              value={leisure.eventos || ""}
              onChange={(e) => updateLeisure("eventos", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="outras_areas">Outras Áreas de Lazer</Label>
            <Textarea
              id="outras_areas"
              placeholder="Outras áreas (jardim, terraço, jogos, etc.)"
              value={leisure.outras || ""}
              onChange={(e) => updateLeisure("outras", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Estacionamento */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Car className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Estacionamento</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parking_tipo">Tipo de Estacionamento</Label>
            <Input
              id="parking_tipo"
              placeholder="Ex: Próprio, coberto, descoberto, valet"
              value={parking.tipo || ""}
              onChange={(e) => updateParking("tipo", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parking_vagas">Número de Vagas</Label>
            <Input
              id="parking_vagas"
              placeholder="Ex: 50 vagas"
              value={parking.vagas || ""}
              onChange={(e) => updateParking("vagas", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parking_valor">Valor</Label>
            <Input
              id="parking_valor"
              placeholder="Ex: Cortesia, R$ 30/dia"
              value={parking.valor || ""}
              onChange={(e) => updateParking("valor", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parking_horario">Horário</Label>
            <Input
              id="parking_horario"
              placeholder="Ex: 24 horas"
              value={parking.horario || ""}
              onChange={(e) => updateParking("horario", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="parking_obs">Observações</Label>
            <Textarea
              id="parking_obs"
              placeholder="Informações adicionais sobre o estacionamento"
              value={parking.observacoes || ""}
              onChange={(e) => updateParking("observacoes", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Site */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Informações do Site</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="site_plataforma">Plataforma do Site</Label>
            <Input
              id="site_plataforma"
              placeholder="Ex: WordPress, Wix, desenvolvimento próprio"
              value={siteInfo.plataforma || ""}
              onChange={(e) => updateSiteInfo("plataforma", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_dominio">Domínio</Label>
            <Input
              id="site_dominio"
              placeholder="Ex: www.hotel.com.br"
              value={siteInfo.dominio || ""}
              onChange={(e) => updateSiteInfo("dominio", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_hospedagem">Hospedagem</Label>
            <Input
              id="site_hospedagem"
              placeholder="Ex: Hostgator, AWS, Locaweb"
              value={siteInfo.hospedagem || ""}
              onChange={(e) => updateSiteInfo("hospedagem", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_motor">Motor de Reservas</Label>
            <Input
              id="site_motor"
              placeholder="Ex: Omnibees, Reserva Fácil"
              value={siteInfo.motor_reservas || ""}
              onChange={(e) => updateSiteInfo("motor_reservas", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="site_obs">Observações sobre o Site</Label>
            <Textarea
              id="site_obs"
              placeholder="Informações adicionais sobre o site"
              value={siteInfo.observacoes || ""}
              onChange={(e) => updateSiteInfo("observacoes", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
