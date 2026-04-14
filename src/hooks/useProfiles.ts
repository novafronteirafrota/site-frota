import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/contexts/AuthContext';
import { SubRank } from './useSubRanks';

export interface ProfileWithRole extends Profile {
  role: AppRole;
  sub_rank?: SubRank | null;
}

export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<ProfileWithRole[]> => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const { data: subRanks, error: subRanksError } = await supabase
        .from('sub_ranks')
        .select('*');

      if (subRanksError) throw subRanksError;

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);
      const subRankMap = new Map(subRanks?.map(sr => [sr.id, sr as SubRank]) || []);

      return (profiles || []).map(p => ({
        ...p,
        role: roleMap.get(p.id) || 'member',
        sub_rank: p.sub_rank_id ? subRankMap.get(p.sub_rank_id) || null : null,
      }));
    },
  });
};

export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<ProfileWithRole | null> => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return null;

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;

      let subRank: SubRank | null = null;
      if (profile.sub_rank_id) {
        const { data: subRankData } = await supabase
          .from('sub_ranks')
          .select('*')
          .eq('id', profile.sub_rank_id)
          .maybeSingle();
        subRank = subRankData as SubRank | null;
      }

      return {
        ...profile,
        role: (roleData?.role as AppRole) || 'member',
        sub_rank: subRank,
      };
    },
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
