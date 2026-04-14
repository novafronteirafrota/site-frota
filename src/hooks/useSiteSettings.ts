import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  logo_shape: 'square' | 'rounded' | 'circle';
  org_name: string;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  created_at: string;
  updated_at: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as SiteSettings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>>) => {
      // Get current settings id first
      const { data: current, error: fetchError } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', current.id)
        .select()
        .single();

      if (error) throw error;
      return data as SiteSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
};
