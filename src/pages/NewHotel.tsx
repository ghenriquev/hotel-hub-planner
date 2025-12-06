import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ArrowLeft, Building2, MapPin, Phone, Tag, Globe } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const addHotel = useStore((state) => state.addHotel);
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

    await new Promise((resolve) => setTimeout(resolve, 500));

    addHotel({
      name: form.name,
      city: form.city,
      contact: form.contact,
      category: form.category,
      website: form.hasNoWebsite ? undefined : form.website,
      hasNoWebsite: form.hasNoWebsite,
    });
    toast.success("Hotel cadastrado com sucesso!");
    navigate("/dashboard");
    
    setLoading(false);
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Logo />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-fade-in">
          <h1 className="font-display text-3xl text-foreground mb-2">
            Cadastrar Novo Hotel
          </h1>
          <p className="text-muted-foreground mb-8">
            Preencha as informações básicas do hotel para iniciar o plano estratégico
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
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
              variant="premium"
              className="flex-1"
              disabled={loading || !form.name || !form.city || !form.contact || !form.category || (!form.website && !form.hasNoWebsite)}
            >
              {loading ? "Salvando..." : "Cadastrar Hotel"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
