import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHotel } from '@/hooks/useHotels';
import { useHotelManualData, HotelManualData } from '@/hooks/useHotelManualData';
import { useManualFormTemplate } from '@/hooks/useManualFormTemplate';
import { useManualDataHistory } from '@/hooks/useManualDataHistory';
import { ManualResponsesViewer } from '@/components/ManualResponsesViewer';
import { EditHistoryTimeline } from '@/components/EditHistoryTimeline';
import { DynamicFormStep } from '@/components/DynamicFormStep';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Eye, 
  History, 
  Loader2, 
  MapPin,
  Save,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ManualResponses() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  
  const { hotel, loading: hotelLoading } = useHotel(hotelId);
  const { manualData, loading: manualLoading, updateManualData, saving } = useHotelManualData(hotelId);
  const { template, loading: templateLoading } = useManualFormTemplate();
  const { history, loading: historyLoading, addHistoryEntry } = useManualDataHistory(hotelId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingStep, setEditingStep] = useState(1);
  const [formData, setFormData] = useState<Partial<HotelManualData>>({});
  const [originalData, setOriginalData] = useState<Partial<HotelManualData>>({});

  useEffect(() => {
    if (manualData) {
      setFormData(manualData);
      setOriginalData(manualData);
    }
  }, [manualData]);

  const loading = hotelLoading || manualLoading || templateLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Hotel não encontrado</h2>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!manualData || !manualData.is_complete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Formulário não preenchido</h2>
          <p className="text-muted-foreground mb-4">Este hotel ainda não possui respostas do Manual de Funcionamento.</p>
          <Button onClick={() => navigate(`/hotel/${hotelId}`)}>Voltar ao Hotel</Button>
        </div>
      </div>
    );
  }

  const handleUpdateFormData = (updates: Partial<HotelManualData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSaveChanges = async () => {
    // Find what changed
    const changes: Record<string, any> = {};
    const previousValues: Record<string, any> = {};
    
    for (const key of Object.keys(formData)) {
      const newVal = (formData as any)[key];
      const oldVal = (originalData as any)[key];
      
      if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        changes[key] = newVal;
        previousValues[key] = oldVal;
      }
    }
    
    if (Object.keys(changes).length === 0) {
      toast.info('Nenhuma alteração detectada');
      setIsEditing(false);
      return;
    }
    
    const success = await updateManualData(formData);
    
    if (success && manualData) {
      await addHistoryEntry(manualData.id, changes, previousValues, 'update');
      setOriginalData(formData);
      setIsEditing(false);
      toast.success('Alterações salvas com sucesso!');
    } else {
      toast.error('Erro ao salvar alterações');
    }
  };

  const handleCancelEdit = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const steps = template?.steps || [];
  const totalSteps = steps.length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/hotel/${hotelId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display text-foreground">Respostas do Manual</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {hotel.name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {hotel.city}
            </span>
          </div>
        </div>
        
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Respostas
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium text-foreground">Formulário Enviado</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enviado em</p>
              <p className="font-medium text-foreground">
                {manualData.submitted_at 
                  ? new Date(manualData.submitted_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })
                  : '-'
                }
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última atualização</p>
              <p className="font-medium text-foreground">
                {manualData.updated_at 
                  ? formatDistanceToNow(new Date(manualData.updated_at), { addSuffix: true, locale: ptBR })
                  : '-'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Responses */}
        <div className="lg:col-span-3">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Editando Respostas</span>
                  <div className="flex items-center gap-2">
                    {steps.map((step) => (
                      <Button
                        key={step.id}
                        variant={editingStep === step.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingStep(step.id)}
                      >
                        {step.id}
                      </Button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {steps.find(s => s.id === editingStep) && (
                  <DynamicFormStep
                    step={steps.find(s => s.id === editingStep)!}
                    data={formData}
                    onChange={handleUpdateFormData}
                  />
                )}
                
                <div className="flex justify-between mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setEditingStep(prev => Math.max(1, prev - 1))}
                    disabled={editingStep === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    Etapa {editingStep} de {totalSteps}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setEditingStep(prev => Math.min(totalSteps, prev + 1))}
                    disabled={editingStep === totalSteps}
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="responses">
              <TabsList className="mb-4">
                <TabsTrigger value="responses" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Respostas
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Histórico
                  {history.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{history.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="responses">
                <ManualResponsesViewer data={manualData} steps={steps} />
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Histórico de Alterações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EditHistoryTimeline 
                      history={history} 
                      submittedAt={manualData.submitted_at}
                      loading={historyLoading}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditHistoryTimeline 
                history={history.slice(0, 5)} 
                submittedAt={manualData.submitted_at}
                loading={historyLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
