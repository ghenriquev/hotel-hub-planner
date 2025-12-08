import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function MigrationBanner() {
  const { hotels: localHotels } = useStore();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [migrated, setMigrated] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  // Don't show if no hotels in localStorage
  if (localHotels.length === 0 || completed) {
    return null;
  }

  const handleMigration = async () => {
    setIsMigrating(true);
    setProgress(0);
    setMigrated(0);
    setErrors([]);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Você precisa estar logado para migrar os dados');
      setIsMigrating(false);
      return;
    }

    const totalHotels = localHotels.length;
    let successCount = 0;
    const errorMessages: string[] = [];

    for (let i = 0; i < localHotels.length; i++) {
      const localHotel = localHotels[i];
      
      try {
        // Check if hotel already exists (by name and city)
        const { data: existing } = await supabase
          .from('hotels')
          .select('id')
          .eq('name', localHotel.name)
          .eq('city', localHotel.city)
          .maybeSingle();

        if (existing) {
          console.log(`Hotel ${localHotel.name} already exists, skipping...`);
          successCount++;
          setProgress(Math.round(((i + 1) / totalHotels) * 100));
          setMigrated(successCount);
          continue;
        }

        // Insert hotel
        const { data: newHotel, error: hotelError } = await supabase
          .from('hotels')
          .insert({
            name: localHotel.name,
            city: localHotel.city,
            contact: localHotel.contact || null,
            category: localHotel.category || null,
            website: localHotel.website || null,
            has_no_website: localHotel.hasNoWebsite || false,
            project_start_date: localHotel.projectStartDate 
              ? localHotel.projectStartDate.split('T')[0] 
              : null,
            created_by: user.id,
          })
          .select()
          .single();

        if (hotelError) throw hotelError;

        // Migrate strategic materials if they exist
        if (localHotel.strategicMaterials) {
          const materials = localHotel.strategicMaterials;
          const materialsToInsert = [];

          if (materials.manualFuncionamentoUrl && materials.manualFuncionamentoName) {
            materialsToInsert.push({
              hotel_id: newHotel.id,
              material_type: 'manual',
              file_url: materials.manualFuncionamentoUrl,
              file_name: materials.manualFuncionamentoName,
            });
          }

          if (materials.dadosHotelUrl && materials.dadosHotelName) {
            materialsToInsert.push({
              hotel_id: newHotel.id,
              material_type: 'dados',
              file_url: materials.dadosHotelUrl,
              file_name: materials.dadosHotelName,
            });
          }

          if (materials.transcricaoKickoffUrl && materials.transcricaoKickoffName) {
            materialsToInsert.push({
              hotel_id: newHotel.id,
              material_type: 'transcricao',
              file_url: materials.transcricaoKickoffUrl,
              file_name: materials.transcricaoKickoffName,
            });
          }

          if (materialsToInsert.length > 0) {
            const { error: materialsError } = await supabase
              .from('hotel_materials')
              .insert(materialsToInsert);

            if (materialsError) {
              console.error('Error migrating materials:', materialsError);
            }
          }
        }

        // Migrate milestones if they exist
        if (localHotel.milestones && localHotel.milestones.length > 0) {
          const milestonesToInsert = localHotel.milestones.map(m => ({
            hotel_id: newHotel.id,
            milestone_key: m.id,
            name: m.name,
            start_week: m.startWeek,
            end_week: m.endWeek,
            start_date: m.startDate.split('T')[0],
            end_date: m.endDate.split('T')[0],
          }));

          const { error: milestonesError } = await supabase
            .from('hotel_milestones')
            .insert(milestonesToInsert);

          if (milestonesError) {
            console.error('Error migrating milestones:', milestonesError);
          }
        }

        successCount++;
        console.log(`Migrated hotel: ${localHotel.name}`);

      } catch (err) {
        console.error(`Error migrating hotel ${localHotel.name}:`, err);
        errorMessages.push(`${localHotel.name}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }

      setProgress(Math.round(((i + 1) / totalHotels) * 100));
      setMigrated(successCount);
    }

    setErrors(errorMessages);
    setIsMigrating(false);

    if (successCount === totalHotels) {
      toast.success(`${successCount} hotel(is) migrado(s) com sucesso!`);
      setCompleted(true);
      
      // Clear localStorage after successful migration
      localStorage.removeItem('reprotel-hub-storage');
      
      // Reload page to fetch from Supabase
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else if (successCount > 0) {
      toast.warning(`${successCount} de ${totalHotels} hotéis migrados. Verifique os erros.`);
    } else {
      toast.error('Falha na migração. Verifique os erros.');
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
          <Database className="h-5 w-5 text-amber-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            Migração de Dados Disponível
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Encontramos {localHotels.length} hotel(is) salvos localmente. 
            Migre para o banco de dados na nuvem para não perder seus dados e permitir acesso de qualquer dispositivo.
          </p>
          
          {isMigrating ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Migrando... {migrated} de {localHotels.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : errors.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Alguns erros ocorreram:</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {errors.slice(0, 3).map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
                {errors.length > 3 && (
                  <li>• ... e mais {errors.length - 3} erro(s)</li>
                )}
              </ul>
              <Button size="sm" onClick={handleMigration} className="mt-2">
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleMigration}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Migrar Agora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
