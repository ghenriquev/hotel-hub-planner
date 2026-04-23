import { Lock, ExternalLink } from "lucide-react";

export function MigrationNotice() {
  return (
    <div className="bg-primary/10 border-b border-primary/30 px-4 py-2.5 flex items-center justify-center gap-3 text-sm flex-wrap">
      <Lock className="h-4 w-4 text-primary shrink-0" />
      <span className="text-foreground">
        Este projeto foi migrado para a <strong>RAI</strong> e está em modo somente leitura.
      </span>
      <a
        href="https://rai.reprotel.com.br/hotel-hub"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
      >
        Acessar na RAI
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
