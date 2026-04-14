import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubRank {
  id: string;
  name: string;
  icon_url: string | null;
  created_at: string;
}

export const useSubRanks = () => {
  return useQuery({
    queryKey: ['sub-ranks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_ranks')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as SubRank[];
    },
  });
};

export const useCreateSubRank = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subRank: { name: string; icon_url?: string }) => {
      const { data, error } = await supabase
        .from('sub_ranks')
        .insert(subRank)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-ranks'] });
    },
  });
};

export const useUpdateSubRank = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; icon_url?: string } }) => {
      const { data, error } = await supabase
        .from('sub_ranks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-ranks'] });
    },
  });
};

export const useDeleteSubRank = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sub_ranks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-ranks'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
};

export const useUpdateProfileSubRank = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ profileId, subRankId }: { profileId: string; subRankId: string | null }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ sub_rank_id: subRankId })
        .eq('id', profileId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
};
