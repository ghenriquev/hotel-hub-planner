import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HotelManualData } from "@/hooks/useHotelManualData";
import { Bed, UtensilsCrossed, Plus, Trash2 } from "lucide-react";

interface Step4Props {
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}

interface Accommodation {
  id: string;
  name: string;
  description: string;
  capacity: string;
  amenities: string;
  size: string;
}

export function Step4Accommodations({ data, onChange }: Step4Props) {
  const accommodations = (data.accommodations || []) as Accommodation[];
  const gastronomy = data.gastronomy || {};

  const addAccommodation = () => {
    const newAccommodation: Accommodation = {
      id: Date.now().toString(),
      name: "",
      description: "",
      capacity: "",
      amenities: "",
      size: ""
    };
    onChange({ accommodations: [...accommodations, newAccommodation] });
  };

  const updateAccommodation = (id: string, field: keyof Accommodation, value: string) => {
    const updated = accommodations.map(acc =>
      acc.id === id ? { ...acc, [field]: value } : acc
    );
    onChange({ accommodations: updated });
  };

  const removeAccommodation = (id: string) => {
    const updated = accommodations.filter(acc => acc.id !== id);
    onChange({ accommodations: updated });
  };

  const updateGastronomy = (field: string, value: string) => {
    onChange({ gastronomy: { ...gastronomy, [field]: value } });
  };

  return (
    <div className="space-y-8">
      {/* Acomodações */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium text-foreground">Tipos de Acomodação</h3>
          </div>
          <Button variant="outline" size="sm" onClick={addAccommodation}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tipo
          </Button>
        </div>
        
        {accommodations.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <Bed className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Nenhum tipo de acomodação adicionado</p>
            <Button variant="link" onClick={addAccommodation}>
              Adicionar primeiro tipo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accommodations.map((acc, index) => (
              <div key={acc.id} className="p-4 bg-muted/30 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Tipo {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAccommodation(acc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Tipo</Label>
                    <Input
                      placeholder="Ex: Suíte Master"
                      value={acc.name}
                      onChange={(e) => updateAccommodation(acc.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacidade</Label>
                    <Input
                      placeholder="Ex: 2 adultos + 1 criança"
                      value={acc.capacity}
                      onChange={(e) => updateAccommodation(acc.id, "capacity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tamanho</Label>
                    <Input
                      placeholder="Ex: 45m²"
                      value={acc.size}
                      onChange={(e) => updateAccommodation(acc.id, "size", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amenidades</Label>
                    <Input
                      placeholder="Ex: TV, Ar-condicionado, Frigobar"
                      value={acc.amenities}
                      onChange={(e) => updateAccommodation(acc.id, "amenities", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descreva os detalhes desta acomodação"
                      value={acc.description}
                      onChange={(e) => updateAccommodation(acc.id, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Gastronomia */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Gastronomia</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="restaurante_nome">Nome do Restaurante</Label>
            <Input
              id="restaurante_nome"
              placeholder="Nome do restaurante principal"
              value={gastronomy.restaurante_nome || ""}
              onChange={(e) => updateGastronomy("restaurante_nome", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurante_horario">Horário de Funcionamento</Label>
            <Input
              id="restaurante_horario"
              placeholder="Ex: 06:00 às 22:00"
              value={gastronomy.restaurante_horario || ""}
              onChange={(e) => updateGastronomy("restaurante_horario", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="restaurante_desc">Descrição do Restaurante</Label>
            <Textarea
              id="restaurante_desc"
              placeholder="Tipo de culinária, capacidade, etc."
              value={gastronomy.restaurante_descricao || ""}
              onChange={(e) => updateGastronomy("restaurante_descricao", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bar_nome">Nome do Bar</Label>
            <Input
              id="bar_nome"
              placeholder="Nome do bar"
              value={gastronomy.bar_nome || ""}
              onChange={(e) => updateGastronomy("bar_nome", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bar_horario">Horário do Bar</Label>
            <Input
              id="bar_horario"
              placeholder="Ex: 18:00 às 00:00"
              value={gastronomy.bar_horario || ""}
              onChange={(e) => updateGastronomy("bar_horario", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cafe_info">Café da Manhã</Label>
            <Textarea
              id="cafe_info"
              placeholder="Horário, local, tipo (buffet, à la carte), incluído na diária?"
              value={gastronomy.cafe_manha || ""}
              onChange={(e) => updateGastronomy("cafe_manha", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="room_service">Room Service</Label>
            <Textarea
              id="room_service"
              placeholder="Horário de funcionamento, cardápio disponível, etc."
              value={gastronomy.room_service || ""}
              onChange={(e) => updateGastronomy("room_service", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
