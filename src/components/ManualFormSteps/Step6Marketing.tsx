import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HotelManualData } from "@/hooks/useHotelManualData";
import { Megaphone, Target, BarChart3 } from "lucide-react";

interface Step6Props {
  data: Partial<HotelManualData>;
  onChange: (updates: Partial<HotelManualData>) => void;
}

export function Step6Marketing({ data, onChange }: Step6Props) {
  const adsMarketing = data.ads_marketing || {};

  const updateAds = (field: string, value: string) => {
    onChange({ ads_marketing: { ...adsMarketing, [field]: value } });
  };

  return (
    <div className="space-y-8">
      {/* Google Ads */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Google Ads</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="google_ads_id">ID da Conta Google Ads</Label>
            <Input
              id="google_ads_id"
              placeholder="Ex: 123-456-7890"
              value={adsMarketing.google_ads_id || ""}
              onChange={(e) => updateAds("google_ads_id", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google_ads_orcamento">Orçamento Mensal</Label>
            <Input
              id="google_ads_orcamento"
              placeholder="Ex: R$ 5.000"
              value={adsMarketing.google_ads_orcamento || ""}
              onChange={(e) => updateAds("google_ads_orcamento", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="google_ads_campanhas">Campanhas Ativas</Label>
            <Textarea
              id="google_ads_campanhas"
              placeholder="Liste as campanhas ativas e seus objetivos"
              value={adsMarketing.google_ads_campanhas || ""}
              onChange={(e) => updateAds("google_ads_campanhas", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Meta Ads */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Meta Ads (Facebook/Instagram)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meta_ads_id">ID da Conta Meta Ads</Label>
            <Input
              id="meta_ads_id"
              placeholder="ID da conta de anúncios"
              value={adsMarketing.meta_ads_id || ""}
              onChange={(e) => updateAds("meta_ads_id", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_ads_orcamento">Orçamento Mensal</Label>
            <Input
              id="meta_ads_orcamento"
              placeholder="Ex: R$ 3.000"
              value={adsMarketing.meta_ads_orcamento || ""}
              onChange={(e) => updateAds("meta_ads_orcamento", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="meta_ads_campanhas">Campanhas Ativas</Label>
            <Textarea
              id="meta_ads_campanhas"
              placeholder="Liste as campanhas ativas e seus objetivos"
              value={adsMarketing.meta_ads_campanhas || ""}
              onChange={(e) => updateAds("meta_ads_campanhas", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Analytics e Tracking */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Analytics e Tracking</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ga4_id">ID do Google Analytics 4</Label>
            <Input
              id="ga4_id"
              placeholder="Ex: G-XXXXXXXXXX"
              value={adsMarketing.ga4_id || ""}
              onChange={(e) => updateAds("ga4_id", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gtm_id">ID do Google Tag Manager</Label>
            <Input
              id="gtm_id"
              placeholder="Ex: GTM-XXXXXXX"
              value={adsMarketing.gtm_id || ""}
              onChange={(e) => updateAds("gtm_id", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pixel_facebook">Pixel do Facebook</Label>
            <Input
              id="pixel_facebook"
              placeholder="ID do Pixel"
              value={adsMarketing.pixel_facebook || ""}
              onChange={(e) => updateAds("pixel_facebook", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pixel_tiktok">Pixel do TikTok</Label>
            <Input
              id="pixel_tiktok"
              placeholder="ID do Pixel (se houver)"
              value={adsMarketing.pixel_tiktok || ""}
              onChange={(e) => updateAds("pixel_tiktok", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Outras Estratégias */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Outras Estratégias de Marketing</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email_marketing">E-mail Marketing</Label>
            <Textarea
              id="email_marketing"
              placeholder="Ferramenta utilizada, frequência de envios, base de contatos"
              value={adsMarketing.email_marketing || ""}
              onChange={(e) => updateAds("email_marketing", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parcerias">Parcerias e Afiliados</Label>
            <Textarea
              id="parcerias"
              placeholder="OTAs, agências, programas de afiliados"
              value={adsMarketing.parcerias || ""}
              onChange={(e) => updateAds("parcerias", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marketing_obs">Observações Gerais de Marketing</Label>
            <Textarea
              id="marketing_obs"
              placeholder="Outras informações relevantes sobre marketing"
              value={adsMarketing.observacoes || ""}
              onChange={(e) => updateAds("observacoes", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
