import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MaterialType = 'manual' | 'dados' | 'transcricao';

export interface HotelMaterial {
  id: string;
  hotel_id: string;
  material_type: MaterialType;
  file_url: string;
  file_name: string;
  text_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialsState {
  manual?: { url: string; name: string };
  dados?: { url: string; name: string };
  transcricao?: { url: string; name: string };
}

export function useHotelMaterials(hotelId: string | undefined) {
  const [materials, setMaterials] = useState<HotelMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!hotelId) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('hotel_materials')
        .select('*')
        .eq('hotel_id', hotelId);

      if (fetchError) throw fetchError;
      
      // Cast the data to our type (material_type comes as string from DB)
      const typedData = (data || []).map(item => ({
        ...item,
        material_type: item.material_type as MaterialType,
      }));
      setMaterials(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const upsertMaterial = useCallback(async (
    materialType: MaterialType,
    fileUrl: string,
    fileName: string,
    textContent?: string
  ): Promise<boolean> => {
    if (!hotelId) return false;

    try {
      const { error: upsertError } = await supabase
        .from('hotel_materials')
        .upsert({
          hotel_id: hotelId,
          material_type: materialType,
          file_url: fileUrl,
          file_name: fileName,
          text_content: textContent || null,
        }, {
          onConflict: 'hotel_id,material_type',
        });

      if (upsertError) throw upsertError;
      
      await fetchMaterials();
      return true;
    } catch (err) {
      console.error('Error upserting material:', err);
      toast.error('Erro ao salvar material');
      return false;
    }
  }, [hotelId, fetchMaterials]);

  const deleteMaterial = useCallback(async (materialType: MaterialType): Promise<boolean> => {
    if (!hotelId) return false;

    try {
      const { error: deleteError } = await supabase
        .from('hotel_materials')
        .delete()
        .eq('hotel_id', hotelId)
        .eq('material_type', materialType);

      if (deleteError) throw deleteError;
      
      setMaterials(prev => prev.filter(m => m.material_type !== materialType));
      return true;
    } catch (err) {
      console.error('Error deleting material:', err);
      toast.error('Erro ao remover material');
      return false;
    }
  }, [hotelId]);

  const getMaterial = useCallback((materialType: MaterialType): HotelMaterial | undefined => {
    return materials.find(m => m.material_type === materialType);
  }, [materials]);

  // Convert to the old format for backwards compatibility
  const materialsState: MaterialsState = {
    manual: getMaterial('manual') ? { url: getMaterial('manual')!.file_url, name: getMaterial('manual')!.file_name } : undefined,
    dados: getMaterial('dados') ? { url: getMaterial('dados')!.file_url, name: getMaterial('dados')!.file_name } : undefined,
    transcricao: getMaterial('transcricao') ? { url: getMaterial('transcricao')!.file_url, name: getMaterial('transcricao')!.file_name } : undefined,
  };

  return {
    materials,
    materialsState,
    loading,
    error,
    fetchMaterials,
    upsertMaterial,
    deleteMaterial,
    getMaterial,
  };
}
