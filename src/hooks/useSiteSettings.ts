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
        .maybeSingle();

      if (error) throw error;
      return data as SiteSettings | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>>) => {
      // Get current settings id if it exists
      const { data: current, error: fetchError } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!current) {
        // If no settings exist yet, insert the first record
        const { data, error } = await supabase
          .from('site_settings')
          .insert(updates)
          .select()
          .single();

        if (error) throw error;
        return data as SiteSettings;
      }

      // If record exists, update it
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
