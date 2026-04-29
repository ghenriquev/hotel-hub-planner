import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHotels } from "@/hooks/useHotels";
import { toast } from "sonner";
import { Building2, MapPin, Phone, Tag, Globe, AlertTriangle, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RAI_URL = "https://rai.reprotel.com.br/hotel-hub";

const CATEGORIES = [
  "Hotel Urbano",
  "Resort",
  "Pousada",
  "Hotel Fazenda",
  "Flat/Apart-Hotel",
  "Hostel",
  "Boutique Hotel",
  "Hotel Econômico",
  "Hotel Executivo",
];

export default function NewHotel() {
  const navigate = useNavigate();
  const { addHotel } = useHotels();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    contact: "",
    category: "",
    website: "",
    hasNoWebsite: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const hotel = await addHotel({
      name: form.name,
      city: form.city,
      contact: form.contact,
      category: form.category,
      website: form.hasNoWebsite ? undefined : form.website,
      has_no_website: form.hasNoWebsite,
    });

    if (hotel) {
      toast.success("Hotel cadastrado com sucesso!");
      navigate(`/hotel/${hotel.id}`);
    }
    
    setLoading(false);
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-primary/10 border border-primary/30 p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="font-display text-xl text-foreground">
          Cadastro de hotéis desativado
        </h2>
        <p className="text-muted-foreground">
          Este projeto foi migrado para a <strong>RAI</strong>. A criação de novos
          hotéis deve ser feita na nova plataforma.
        </p>
        <a
          href={RAI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary font-semibold hover:underline break-all"
        >
          {RAI_URL}
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
        <div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
      {false && (
      <div className="mb-6">
        <p className="text-muted-foreground">
          Preencha as informações básicas do hotel para iniciar o plano estratégico
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border/60 p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Hotel</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Ex: Hotel Sunset Paradise"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="border-t border-border/60" />

          <div className="space-y-2">
            <Label htmlFor="city">Cidade / Estado</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="city"
                placeholder="Ex: Florianópolis, SC"
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="border-t border-border/60" />

          <div className="space-y-2">
            <Label htmlFor="contact">Contato Principal</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact"
                placeholder="Ex: João Silva - (48) 99999-0000"
                value={form.contact}
                onChange={(e) => updateForm("contact", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="border-t border-border/60" />

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={form.category}
                onValueChange={(value) => updateForm("category", value)}
                required
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border/60" />

          <div className="space-y-2">
            <Label htmlFor="website">Site do Hotel</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                placeholder="Ex: https://www.hotelexemplo.com.br"
                value={form.website}
                onChange={(e) => updateForm("website", e.target.value)}
                className="pl-10"
                disabled={form.hasNoWebsite}
                required={!form.hasNoWebsite}
              />
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="hasNoWebsite"
                checked={form.hasNoWebsite}
                onCheckedChange={(checked) => {
                  setForm((prev) => ({
                    ...prev,
                    hasNoWebsite: checked === true,
                    website: checked === true ? "" : prev.website,
                  }));
                }}
              />
              <Label htmlFor="hasNoWebsite" className="text-sm text-muted-foreground cursor-pointer">
                Hotel não tem site
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/dashboard")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || !form.name || !form.city || !form.contact || !form.category || (!form.website && !form.hasNoWebsite)}
          >
            {loading ? "Salvando..." : "Cadastrar Hotel"}
          </Button>
        </div>
      </form>
    </div>
  );
}
