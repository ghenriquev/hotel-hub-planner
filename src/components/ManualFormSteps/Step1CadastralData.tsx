import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HotelManualData } from "@/hooks/useHotelManualData";
import { Building2, FileText } from "lucide-react";

interface Step1Props {
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}

export function Step1CadastralData({ data, onChange }: Step1Props) {
  return (
    <div className="space-y-8">
      {/* Dados Cadastrais */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Dados Cadastrais</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="foundation_year">Ano de Fundação</Label>
            <Input
              id="foundation_year"
              placeholder="Ex: 1995"
              value={data.foundation_year || ""}
              onChange={(e) => onChange({ foundation_year: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room_count">Número de UHs (Unidades Habitacionais)</Label>
            <Input
              id="room_count"
              placeholder="Ex: 120"
              value={data.room_count || ""}
              onChange={(e) => onChange({ room_count: e.target.value })}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="main_structure">Estrutura Principal</Label>
            <Textarea
              id="main_structure"
              placeholder="Descreva a estrutura principal do hotel (prédio, áreas comuns, etc.)"
              value={data.main_structure || ""}
              onChange={(e) => onChange({ main_structure: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="other_social_media">Outras Redes Sociais</Label>
            <Textarea
              id="other_social_media"
              placeholder="Liste outras redes sociais (TikTok, LinkedIn, etc.) com os links"
              value={data.other_social_media || ""}
              onChange={(e) => onChange({ other_social_media: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Dados Legais */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Dados Legais</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="legal_name">Razão Social</Label>
            <Input
              id="legal_name"
              placeholder="Razão social completa"
              value={data.legal_name || ""}
              onChange={(e) => onChange({ legal_name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0001-00"
              value={data.cnpj || ""}
              onChange={(e) => onChange({ cnpj: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP</Label>
            <Input
              id="zip_code"
              placeholder="00000-000"
              value={data.zip_code || ""}
              onChange={(e) => onChange({ zip_code: e.target.value })}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Input
              id="address"
              placeholder="Rua, número, complemento"
              value={data.address || ""}
              onChange={(e) => onChange({ address: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              placeholder="Bairro"
              value={data.neighborhood || ""}
              onChange={(e) => onChange({ neighborhood: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              placeholder="UF"
              value={data.state || ""}
              onChange={(e) => onChange({ state: e.target.value })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
