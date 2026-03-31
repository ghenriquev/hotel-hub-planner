import { AlertCircle, AlertTriangle } from "lucide-react";
import { useHotelMaterials, MaterialsState } from "@/hooks/useHotelMaterials";
import { useHotelManualData } from "@/hooks/useHotelManualData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PendingItem {
  field: string;
  label: string;
  category: "basic" | "material";
}

interface Hotel {
  id: string;
  name: string;
  city: string;
  contact?: string | null;
  category?: string | null;
  website?: string | null;
  has_no_website?: boolean | null;
  project_start_date?: string | null;
}

export interface ManualDataStatus {
  isComplete?: boolean;
  inputMethod?: string;
}

export function getPendingItems(
  hotel: Hotel,
  materialsState: MaterialsState,
  manualDataStatus?: ManualDataStatus
): PendingItem[] {
  const pendingItems: PendingItem[] = [];

  // Verificar dados básicos
  if (!hotel.contact) {
    pendingItems.push({ field: "contact", label: "Contato", category: "basic" });
  }
  if (!hotel.category) {
    pendingItems.push({ field: "category", label: "Categoria", category: "basic" });
  }
  if (!hotel.website && !hotel.has_no_website) {
    pendingItems.push({ field: "website", label: "Site", category: "basic" });
  }
  if (!hotel.project_start_date) {
    pendingItems.push({ field: "project_start_date", label: "Data de início", category: "basic" });
  }

  // Verificar materiais primários
  // Manual: check hotel_materials OR hotel_manual_data
  const hasManualInMaterials = !!materialsState.manual;
  const hasManualInFormData = manualDataStatus?.isComplete === true;
  if (!hasManualInMaterials && !hasManualInFormData) {
    pendingItems.push({ field: "manual", label: "Manual de Funcionamento", category: "material" });
  }
  if (!materialsState.dados) {
    pendingItems.push({ field: "dados", label: "Briefing de Criação", category: "material" });
  }
  if (!materialsState.transcricao) {
    pendingItems.push({ field: "transcricao", label: "Transcrição de Kickoff", category: "material" });
  }
  if (!materialsState.cliente_oculto) {
    pendingItems.push({ field: "cliente_oculto", label: "Cliente Oculto", category: "material" });
  }

  return pendingItems;
}

interface HotelPendingBadgeProps {
  hotel: Hotel;
}

export function HotelPendingBadge({ hotel }: HotelPendingBadgeProps) {
  const { materialsState, loading } = useHotelMaterials(hotel.id);

  if (loading) return null;

  const pendingItems = getPendingItems(hotel, materialsState);

  if (pendingItems.length === 0) return null;

  const basicItems = pendingItems.filter((item) => item.category === "basic");
  const materialItems = pendingItems.filter((item) => item.category === "material");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-help">
            <AlertCircle className="h-3 w-3" />
            {pendingItems.length} pendência(s)
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-sm space-y-2">
            {basicItems.length > 0 && (
              <div>
                <p className="font-medium text-foreground mb-1">Dados básicos:</p>
                <ul className="text-muted-foreground">
                  {basicItems.map((item) => (
                    <li key={item.field}>• {item.label}</li>
                  ))}
                </ul>
              </div>
            )}
            {materialItems.length > 0 && (
              <div>
                <p className="font-medium text-foreground mb-1">Materiais primários:</p>
                <ul className="text-muted-foreground">
                  {materialItems.map((item) => (
                    <li key={item.field}>• {item.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HotelPendingAlertProps {
  hotel: Hotel;
  materialsState: MaterialsState;
}

export function HotelPendingAlert({ hotel, materialsState }: HotelPendingAlertProps) {
  const pendingItems = getPendingItems(hotel, materialsState);

  if (pendingItems.length === 0) return null;

  const basicItems = pendingItems.filter((item) => item.category === "basic");
  const materialItems = pendingItems.filter((item) => item.category === "material");

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-700 dark:text-yellow-400">
            Informações Pendentes ({pendingItems.length})
          </h3>
          <div className="text-sm text-yellow-600 dark:text-yellow-500/80 mt-1 space-y-1">
            <p>
              <span className="font-medium">Dados básicos:</span>{" "}
              {basicItems.length > 0
                ? basicItems.map((i) => i.label).join(", ")
                : "✓ Completo"}
            </p>
            <p>
              <span className="font-medium">Materiais primários:</span>{" "}
              {materialItems.length > 0
                ? materialItems.map((m) => m.label).join(", ")
                : "✓ Completo"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
