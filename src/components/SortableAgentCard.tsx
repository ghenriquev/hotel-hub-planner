import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Bot, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentConfig } from '@/hooks/useAgentConfigs';
import { cn } from '@/lib/utils';

interface SortableAgentCardProps {
  config: AgentConfig;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  getModelInfo: (model: string) => { label: string; icon: string };
  getPrimaryMaterialsLabel: (config: string[]) => string;
  getResearchMaterialsLabel: (config: string[]) => string;
  getSecondaryMaterialsLabel: (config: number[]) => string;
  children?: React.ReactNode;
}

export function SortableAgentCard({
  config,
  index,
  isEditing,
  onEdit,
  onDelete,
  isDeleting,
  getModelInfo,
  getPrimaryMaterialsLabel,
  getResearchMaterialsLabel,
  getSecondaryMaterialsLabel,
  children,
}: SortableAgentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.module_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    animationDelay: `${index * 0.03}s`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border border-border rounded-xl p-6 animate-slide-up",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing p-1 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            {config.module_title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span>Output: {config.output_type}</span>
            <span className="flex items-center gap-1">
              <span>{getModelInfo(config.llm_model || 'google/gemini-3-pro-preview').icon}</span>
              {getModelInfo(config.llm_model || 'google/gemini-3-pro-preview').label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit}>
                Editar
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}