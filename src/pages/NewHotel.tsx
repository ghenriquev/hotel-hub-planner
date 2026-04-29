import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

const RAI_URL = "https://rai.reprotel.com.br/hotel-hub";

export default function NewHotel() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-primary/10 border border-primary/30 p-8 text-center space-y-4">
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
        <div className="pt-2">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
