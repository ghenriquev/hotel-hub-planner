import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HotelManualData {
  id: string;
  hotel_id: string;
  
  // Dados Cadastrais
  foundation_year?: string;
  room_count?: string;
  main_structure?: string;
  other_social_media?: string;
  
  // Dados Legais
  legal_name?: string;
  cnpj?: string;
  address?: string;
  neighborhood?: string;
  state?: string;
  zip_code?: string;
  
  // Contatos Contratante
  contractor_name?: string;
  contractor_email?: string;
  witness_name?: string;
  witness_email?: string;
  
  // JSON fields
  department_contacts?: Record<string, any>;
  differentials?: Record<string, any>;
  internet_info?: Record<string, any>;
  policies?: Record<string, any>;
  accommodations?: any[];
  gastronomy?: Record<string, any>;
  leisure?: Record<string, any>;
  parking?: Record<string, any>;
  site_info?: Record<string, any>;
  ads_marketing?: Record<string, any>;
  access_credentials?: Record<string, any>;
  
  // File upload fields
  uploaded_file_url?: string;
  uploaded_file_name?: string;
  input_method?: 'form' | 'upload';
  
  // Status
  mailing_submitted?: boolean;
  current_step?: number;
  is_complete?: boolean;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HotelBasicInfo {
  id: string;
  name: string;
  city: string;
  manual_form_token: string;
}

export function useHotelManualData(hotelId: string | undefined) {
  const [manualData, setManualData] = useState<HotelManualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchManualData = useCallback(async () => {
    if (!hotelId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotel_manual_data")
        .select("*")
        .eq("hotel_id", hotelId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching manual data:", error);
      }
      
      setManualData(data as HotelManualData | null);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchManualData();
  }, [fetchManualData]);

  const updateManualData = async (updates: Partial<HotelManualData>) => {
    if (!hotelId) return false;
    
    setSaving(true);
    try {
      if (manualData) {
        // Update existing record
        const { error } = await supabase
          .from("hotel_manual_data")
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq("hotel_id", hotelId);

        if (error) throw error;
        
        setManualData(prev => prev ? { ...prev, ...updates } : null);
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from("hotel_manual_data")
          .insert({
            hotel_id: hotelId,
            ...updates
          })
          .select()
          .single();

        if (error) throw error;
        
        setManualData(data as HotelManualData);
      }
      
      return true;
    } catch (err) {
      console.error("Error updating manual data:", err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitManual = async () => {
    return updateManualData({
      is_complete: true,
      submitted_at: new Date().toISOString(),
      input_method: 'form'
    });
  };

  const uploadManualFile = async (fileUrl: string, fileName: string) => {
    return updateManualData({
      uploaded_file_url: fileUrl,
      uploaded_file_name: fileName,
      input_method: 'upload',
      is_complete: true,
      submitted_at: new Date().toISOString()
    });
  };

  const removeManualFile = async () => {
    return updateManualData({
      uploaded_file_url: undefined,
      uploaded_file_name: undefined,
      input_method: undefined,
      is_complete: false,
      submitted_at: undefined
    });
  };

  return {
    manualData,
    loading,
    saving,
    updateManualData,
    submitManual,
    uploadManualFile,
    removeManualFile,
    refetch: fetchManualData
  };
}

// Hook for public form - validates token and fetches hotel info
export function usePublicManualForm(hotelId: string | undefined, token: string | undefined) {
  const [hotelInfo, setHotelInfo] = useState<HotelBasicInfo | null>(null);
  const [manualData, setManualData] = useState<HotelManualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateAndFetch = async () => {
      if (!hotelId || !token) {
        setError("Link inválido");
        setLoading(false);
        return;
      }

      try {
        // Validate token
        const { data: hotel, error: hotelError } = await supabase
          .from("hotels")
          .select("id, name, city, manual_form_token")
          .eq("id", hotelId)
          .maybeSingle();

        if (hotelError || !hotel) {
          setError("Hotel não encontrado");
          setLoading(false);
          return;
        }

        if ((hotel as any).manual_form_token !== token) {
          setError("Link expirado ou inválido");
          setLoading(false);
          return;
        }

        setHotelInfo(hotel as HotelBasicInfo);
        setIsValid(true);

        // Fetch existing manual data
        const { data: manual } = await supabase
          .from("hotel_manual_data")
          .select("*")
          .eq("hotel_id", hotelId)
          .maybeSingle();

        setManualData(manual as HotelManualData | null);
      } catch (err) {
        console.error("Error:", err);
        setError("Erro ao carregar formulário");
      } finally {
        setLoading(false);
      }
    };

    validateAndFetch();
  }, [hotelId, token]);

  const updateManualData = async (updates: Partial<HotelManualData>) => {
    if (!hotelId || !isValid) return false;
    
    setSaving(true);
    try {
      if (manualData) {
        const { error } = await supabase
          .from("hotel_manual_data")
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq("hotel_id", hotelId);

        if (error) throw error;
        
        setManualData(prev => prev ? { ...prev, ...updates } : null);
      } else {
        const { data, error } = await supabase
          .from("hotel_manual_data")
          .insert({
            hotel_id: hotelId,
            ...updates
          })
          .select()
          .single();

        if (error) throw error;
        
        setManualData(data as HotelManualData);
      }
      
      return true;
    } catch (err) {
      console.error("Error updating manual data:", err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitManual = async () => {
    return updateManualData({
      is_complete: true,
      submitted_at: new Date().toISOString()
    });
  };

  return {
    hotelInfo,
    manualData,
    loading,
    saving,
    error,
    isValid,
    updateManualData,
    submitManual
  };
}

// Hook to get manual form link for a hotel
export function useManualFormLink(hotelId: string | undefined) {
  const [formToken, setFormToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      if (!hotelId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("hotels")
        .select("manual_form_token")
        .eq("id", hotelId)
        .maybeSingle();

      if (!error && data) {
        setFormToken((data as any).manual_form_token);
      }
      setLoading(false);
    };

    fetchToken();
  }, [hotelId]);

  const getFormLink = () => {
    if (!hotelId || !formToken) return null;
    return `${window.location.origin}/manual/${hotelId}/${formToken}`;
  };

  return {
    formToken,
    loading,
    getFormLink
  };
}
