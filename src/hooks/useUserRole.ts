import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user';

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setRole(null);
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      setRole('user'); // Default to user if error
    } else if (data) {
      setRole(data.role as AppRole);
    } else {
      setRole('user'); // Default to user if no role found
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, [fetchRole]);

  const isAdmin = role === 'admin';

  return { role, isAdmin, loading, userId, refetch: fetchRole };
}
