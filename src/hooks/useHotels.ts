import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Hotel {
  id: string;
  name: string;
  city: string;
  contact: string | null;
  category: string | null;
  website: string | null;
  has_no_website: boolean | null;
  project_start_date: string | null;
  instagram_url: string | null;
  tripadvisor_url: string | null;
  booking_url: string | null;
  google_business_url: string | null;
  slug: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HotelInsert {
  name: string;
  city: string;
  contact?: string;
  category?: string;
  website?: string;
  has_no_website?: boolean;
  project_start_date?: string;
}

export interface HotelUpdate {
  name?: string;
  city?: string;
  contact?: string;
  category?: string;
  website?: string | null;
  has_no_website?: boolean;
  project_start_date?: string | null;
  instagram_url?: string | null;
  tripadvisor_url?: string | null;
  booking_url?: string | null;
  google_business_url?: string | null;
}

export function useHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setHotels(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching hotels:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar hotéis');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const addHotel = useCallback(async (hotel: HotelInsert): Promise<Hotel | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: insertError } = await supabase
        .from('hotels')
        .insert({
          ...hotel,
          created_by: user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      setHotels(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding hotel:', err);
      toast.error('Erro ao cadastrar hotel');
      return null;
    }
  }, []);

  const updateHotel = useCallback(async (id: string, updates: HotelUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('hotels')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      
      setHotels(prev => prev.map(h => 
        h.id === id ? { ...h, ...updates } : h
      ));
      return true;
    } catch (err) {
      console.error('Error updating hotel:', err);
      toast.error('Erro ao atualizar hotel');
      return false;
    }
  }, []);

  const deleteHotel = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('hotels')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setHotels(prev => prev.filter(h => h.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting hotel:', err);
      toast.error('Erro ao excluir hotel');
      return false;
    }
  }, []);

  const getHotel = useCallback((id: string): Hotel | undefined => {
    return hotels.find(h => h.id === id);
  }, [hotels]);

  return {
    hotels,
    loading,
    error,
    fetchHotels,
    addHotel,
    updateHotel,
    deleteHotel,
    getHotel,
  };
}

export function useHotel(id: string | undefined) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHotel = useCallback(async () => {
    if (!id) {
      setHotel(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setHotel(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching hotel:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar hotel');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHotel();
  }, [fetchHotel]);

  const updateHotel = useCallback(async (updates: HotelUpdate): Promise<boolean> => {
    if (!id) return false;
    
    try {
      const { error: updateError } = await supabase
        .from('hotels')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      
      setHotel(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      console.error('Error updating hotel:', err);
      toast.error('Erro ao atualizar hotel');
      return false;
    }
  }, [id]);

  const deleteHotel = useCallback(async (): Promise<boolean> => {
    if (!id) return false;
    
    try {
      const { error: deleteError } = await supabase
        .from('hotels')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return true;
    } catch (err) {
      console.error('Error deleting hotel:', err);
      toast.error('Erro ao excluir hotel');
      return false;
    }
  }, [id]);

  return {
    hotel,
    loading,
    error,
    fetchHotel,
    updateHotel,
    deleteHotel,
  };
}
