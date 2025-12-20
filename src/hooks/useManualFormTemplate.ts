import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'checkbox';
  required: boolean;
  placeholder?: string;
}

export interface TemplateOption {
  key: string;
  label: string;
}

export interface TemplateDepartment {
  key: string;
  label: string;
}

export interface TemplateCredentialType {
  key: string;
  label: string;
  fields: string[];
}

export interface TemplateAccommodationField {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

export interface TemplateSection {
  title: string;
  icon: string;
  type?: 'department_contacts' | 'checkbox_group' | 'accommodations_list' | 'access_credentials';
  fields?: TemplateField[];
  field_key?: string;
  options?: TemplateOption[];
  departments?: TemplateDepartment[];
  accommodation_fields?: TemplateAccommodationField[];
  credential_types?: TemplateCredentialType[];
}

export interface TemplateStep {
  id: number;
  title: string;
  subtitle: string;
  sections: TemplateSection[];
}

export interface ManualFormTemplate {
  id: string;
  name: string;
  steps: TemplateStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useManualFormTemplate() {
  const [template, setTemplate] = useState<ManualFormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTemplate = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('manual_form_template')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTemplate({
          ...data,
          steps: data.steps as unknown as TemplateStep[]
        });
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: 'Erro ao carregar template',
        description: 'Não foi possível carregar o template do formulário.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const updateTemplate = useCallback(async (updates: Partial<ManualFormTemplate>) => {
    if (!template) return;

    setSaving(true);
    try {
      // Convert steps to JSON-compatible format
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.steps !== undefined) dbUpdates.steps = JSON.parse(JSON.stringify(updates.steps));

      const { error } = await supabase
        .from('manual_form_template')
        .update(dbUpdates)
        .eq('id', template.id);

      if (error) throw error;

      setTemplate(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Template salvo',
        description: 'As alterações foram salvas com sucesso.'
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [template, toast]);

  const updateSteps = useCallback(async (steps: TemplateStep[]) => {
    await updateTemplate({ steps });
  }, [updateTemplate]);

  return {
    template,
    loading,
    saving,
    updateTemplate,
    updateSteps,
    refetch: fetchTemplate
  };
}
