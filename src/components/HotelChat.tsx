import { useState, useRef, useEffect } from 'react';
import { useHotelChat } from '@/hooks/useHotelChat';
import { useAgentResults } from '@/hooks/useAgentResults';
import { useHotelWebsiteData } from '@/hooks/useHotelWebsiteData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles,
  AlertCircle,
  Trash2,
  Database,
  FileText,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ContextMode = 'all' | 'materials' | 'agents';

interface HotelChatProps {
  hotelId: string;
  hotelName: string;
  onClose?: () => void;
}

const SUGGESTED_QUESTIONS = [
  "Qual é o público-alvo principal deste hotel?",
  "Quais são os principais pontos fortes do hotel?",
  "Quais canais de distribuição são recomendados?",
  "Como está a presença digital do hotel?",
];

export function HotelChat({ hotelId, hotelName, onClose }: HotelChatProps) {
  const [input, setInput] = useState('');
  const [contextMode, setContextMode] = useState<ContextMode>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, isLoading, error, sendMessage, clearMessages } = useHotelChat({ hotelId, contextMode });
  const { results } = useAgentResults(hotelId);
  const { websiteData } = useHotelWebsiteData(hotelId);

  const completedAgents = results.filter(r => r.status === 'completed').length;
  const hasWebsiteData = websiteData?.status === 'completed';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleSuggestionClick = (question: string) => {
    if (!isLoading) {
      sendMessage(question);
    }
  };

  return (
    <div className="bg-card border border-border rounded-none overflow-hidden flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                HotelGPT
                <Sparkles className="h-4 w-4 text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground">
                Assistente inteligente para {hotelName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Context selector */}
        <div className="mt-3">
          <Select value={contextMode} onValueChange={(value: ContextMode) => setContextMode(value)}>
            <SelectTrigger className="w-full h-8 text-xs bg-background">
              <SelectValue placeholder="Selecione o contexto" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Materiais + Agentes</SelectItem>
              <SelectItem value="materials">Apenas Materiais Primários</SelectItem>
              <SelectItem value="agents">Apenas Agentes Estratégicos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Context badges */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Database className="h-3 w-3" />
            {completedAgents} agentes
          </Badge>
          {hasWebsiteData && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Site analisado
            </Badge>
          )}
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Bot className="h-12 w-12 text-primary/30 mb-4" />
            <h4 className="font-medium text-foreground mb-2">
              Olá! Sou o HotelGPT
            </h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Posso responder perguntas sobre os materiais e análises estratégicas deste hotel.
            </p>
            
            <div className="w-full max-w-sm space-y-2">
              <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  disabled={isLoading}
                  className="w-full text-left text-sm p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="h-3 w-3 inline mr-2 text-muted-foreground" />
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                    {isLoading && index === messages.length - 1 && message.role === 'assistant' && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo sobre o hotel..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
