import { useState, useRef, useEffect, useCallback } from "react";
import { ClientMilestone } from "@/lib/store";
import { addDays, differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface GanttChartProps {
  startDate: string;
  milestones: ClientMilestone[];
  onMilestonesChange: (milestones: ClientMilestone[]) => void;
}

const WEEK_WIDTH = 100;
const BAR_HEIGHT = 40;
const TOTAL_WEEKS = 10;

const MILESTONE_COLORS = [
  "bg-primary",
  "bg-blue-500",
  "bg-amber-500",
  "bg-emerald-500"
];

export function GanttChart({ startDate, milestones, onMilestonesChange }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; originalStartWeek: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; originalEndWeek: number; edge: 'left' | 'right' } | null>(null);

  const projectStart = parseISO(startDate);

  const calculateDatesFromWeeks = useCallback((startWeek: number, endWeek: number) => {
    const milestoneStart = addDays(projectStart, (startWeek - 1) * 7);
    const milestoneEnd = addDays(projectStart, endWeek * 7 - 1);
    return {
      startDate: milestoneStart.toISOString(),
      endDate: milestoneEnd.toISOString()
    };
  }, [projectStart]);

  const handleMouseDown = (e: React.MouseEvent, milestone: ClientMilestone, action: 'drag' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'drag') {
      setDragging({
        id: milestone.id,
        startX: e.clientX,
        originalStartWeek: milestone.startWeek
      });
    } else {
      setResizing({
        id: milestone.id,
        startX: e.clientX,
        originalEndWeek: action === 'resize-right' ? milestone.endWeek : milestone.startWeek,
        edge: action === 'resize-left' ? 'left' : 'right'
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const deltaX = e.clientX - dragging.startX;
        const weeksDelta = Math.round(deltaX / WEEK_WIDTH);
        const newStartWeek = Math.max(1, Math.min(TOTAL_WEEKS - 1, dragging.originalStartWeek + weeksDelta));
        
        const updated = milestones.map(m => {
          if (m.id === dragging.id) {
            const duration = m.endWeek - m.startWeek;
            const newEndWeek = Math.min(TOTAL_WEEKS, newStartWeek + duration);
            const dates = calculateDatesFromWeeks(newStartWeek, newEndWeek);
            return { ...m, startWeek: newStartWeek, endWeek: newEndWeek, ...dates };
          }
          return m;
        });
        onMilestonesChange(updated);
      }
      
      if (resizing) {
        const deltaX = e.clientX - resizing.startX;
        const weeksDelta = Math.round(deltaX / WEEK_WIDTH);
        
        const updated = milestones.map(m => {
          if (m.id === resizing.id) {
            if (resizing.edge === 'right') {
              const newEndWeek = Math.max(m.startWeek + 1, Math.min(TOTAL_WEEKS, resizing.originalEndWeek + weeksDelta));
              const dates = calculateDatesFromWeeks(m.startWeek, newEndWeek);
              return { ...m, endWeek: newEndWeek, ...dates };
            } else {
              const newStartWeek = Math.max(1, Math.min(m.endWeek - 1, resizing.originalEndWeek + weeksDelta));
              const dates = calculateDatesFromWeeks(newStartWeek, m.endWeek);
              return { ...m, startWeek: newStartWeek, ...dates };
            }
          }
          return m;
        });
        onMilestonesChange(updated);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };

    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, milestones, onMilestonesChange, calculateDatesFromWeeks]);

  const weeks = Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);

  return (
    <div className="relative overflow-x-auto">
      <div 
        ref={containerRef}
        className="relative"
        style={{ width: WEEK_WIDTH * TOTAL_WEEKS + 200, minHeight: milestones.length * (BAR_HEIGHT + 12) + 60 }}
      >
        {/* Header */}
        <div className="flex border-b border-border sticky top-0 bg-card z-10">
          <div className="w-[200px] shrink-0 p-2 text-sm font-medium text-muted-foreground border-r border-border">
            Etapa
          </div>
          {weeks.map((week) => (
            <div 
              key={week}
              className="text-center p-2 text-xs text-muted-foreground border-r border-border/50"
              style={{ width: WEEK_WIDTH }}
            >
              <div className="font-medium">Semana {week}</div>
              <div className="text-[10px] text-muted-foreground/70">
                {format(addDays(projectStart, (week - 1) * 7), "dd/MM", { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute top-[52px] left-[200px] right-0 bottom-0 pointer-events-none">
          {weeks.map((week) => (
            <div
              key={week}
              className="absolute top-0 bottom-0 border-r border-border/30"
              style={{ left: (week - 1) * WEEK_WIDTH }}
            />
          ))}
        </div>

        {/* Milestones */}
        <div className="pt-2">
          {milestones.map((milestone, index) => {
            const left = 200 + (milestone.startWeek - 1) * WEEK_WIDTH;
            const width = (milestone.endWeek - milestone.startWeek + 1) * WEEK_WIDTH - 8;
            const top = index * (BAR_HEIGHT + 12);

            return (
              <div 
                key={milestone.id}
                className="absolute flex items-center"
                style={{ top, height: BAR_HEIGHT + 12 }}
              >
                {/* Label */}
                <div className="w-[200px] shrink-0 px-3 text-sm font-medium text-foreground truncate">
                  {milestone.name}
                </div>

                {/* Bar */}
                <div
                  className={cn(
                    "absolute rounded-md cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg group",
                    MILESTONE_COLORS[index % MILESTONE_COLORS.length],
                    (dragging?.id === milestone.id || resizing?.id === milestone.id) && "shadow-lg ring-2 ring-primary/50"
                  )}
                  style={{
                    left,
                    width,
                    height: BAR_HEIGHT,
                    top: 6
                  }}
                  onMouseDown={(e) => handleMouseDown(e, milestone, 'drag')}
                >
                  {/* Resize handles */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-foreground/20 rounded-l-md"
                    onMouseDown={(e) => handleMouseDown(e, milestone, 'resize-left')}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-foreground/20 rounded-r-md"
                    onMouseDown={(e) => handleMouseDown(e, milestone, 'resize-right')}
                  />

                  {/* Content */}
                  <div className="h-full flex items-center justify-center px-3 text-white text-xs font-medium select-none">
                    {format(parseISO(milestone.startDate), "dd/MM")} - {format(parseISO(milestone.endDate), "dd/MM")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-primary/50 rounded" />
          Arraste para mover
        </span>
        <span className="text-border">|</span>
        <span>Arraste as bordas para redimensionar</span>
      </div>
    </div>
  );
}
