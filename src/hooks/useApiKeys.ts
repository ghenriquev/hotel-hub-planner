import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApiKey {
  id: string;
  name: string;
  key_type: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyInput {
  name: string;
  key_type: string;
  api_key: string;
  is_active?: boolean;
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys((data as ApiKey[]) || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Erro ao carregar API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const addApiKey = async (input: ApiKeyInput): Promise<boolean> => {
    try {
      const { error } = await supabase.from("api_keys").insert({
        name: input.name,
        key_type: input.key_type,
        api_key: input.api_key,
        is_active: input.is_active ?? true,
      });

      if (error) throw error;
      
      toast.success("API key adicionada com sucesso");
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error("Error adding API key:", error);
      toast.error("Erro ao adicionar API key");
      return false;
    }
  };

  const updateApiKey = async (id: string, input: Partial<ApiKeyInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update(input)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("API key atualizada com sucesso");
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.error("Erro ao atualizar API key");
      return false;
    }
  };

  const deleteApiKey = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("API key excluída com sucesso");
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Erro ao excluir API key");
      return false;
    }
  };

  const toggleApiKey = async (id: string, isActive: boolean): Promise<boolean> => {
    return updateApiKey(id, { is_active: isActive });
  };

  return {
    apiKeys,
    loading,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    toggleApiKey,
    refetch: fetchApiKeys,
  };
}
