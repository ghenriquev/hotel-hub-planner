import { Clock, FileEdit, Send, User } from 'lucide-react';
import { ManualDataHistoryEntry } from '@/hooks/useManualDataHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EditHistoryTimelineProps {
  history: ManualDataHistoryEntry[];
  submittedAt?: string | null;
  loading?: boolean;
}

export function EditHistoryTimeline({ history, submittedAt, loading }: EditHistoryTimelineProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-3 w-48 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const allEvents = [
    ...history.map(entry => ({
      type: 'edit' as const,
      date: new Date(entry.edited_at),
      data: entry
    })),
    ...(submittedAt ? [{
      type: 'submit' as const,
      date: new Date(submittedAt),
      data: null
    }] : [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum histórico de edições</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      
      <div className="space-y-6">
        {allEvents.map((event, index) => (
          <div key={index} className="flex gap-4 relative">
            {/* Icon */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center z-10
              ${event.type === 'submit' 
                ? 'bg-green-500/20 text-green-600' 
                : 'bg-primary/10 text-primary'
              }
            `}>
              {event.type === 'submit' ? (
                <Send className="h-4 w-4" />
              ) : (
                <FileEdit className="h-4 w-4" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-foreground">
                  {event.type === 'submit' ? 'Formulário enviado' : 'Respostas editadas'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(event.date, { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {event.date.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              
              {event.type === 'edit' && event.data && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {Object.keys(event.data.changes || {}).length} campo(s) alterado(s)
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
