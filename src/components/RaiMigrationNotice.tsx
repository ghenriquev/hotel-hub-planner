import { AlertTriangle, ExternalLink } from "lucide-react";

const RAI_URL = "https://rai.reprotel.com.br/hotel-hub";

interface RaiMigrationNoticeProps {
  variant?: "header" | "card";
}

export function RaiMigrationNotice({ variant = "header" }: RaiMigrationNoticeProps) {
  if (variant === "card") {
    return (
      <div className="bg-primary/10 border border-primary/30 p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-foreground mb-1">
            Este projeto foi migrado para a RAI
          </p>
          <p className="text-muted-foreground mb-2">
            Acesse a nova plataforma para continuar utilizando o Hotel Hub.
            Esta versão está disponível apenas para consulta.
          </p>
          <a
            href={RAI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary font-medium hover:underline break-all"
          >
            {RAI_URL}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border-b border-primary/30 px-4 py-2 text-center text-sm text-foreground flex items-center justify-center gap-2 flex-wrap">
      <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
      <span>
        Este projeto foi migrado para a <strong>RAI</strong>. Acesse:
      </span>
      <a
        href={RAI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
      >
        {RAI_URL}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
