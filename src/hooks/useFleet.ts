import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ship } from './useShips';
import { ProfileWithRole } from './useProfiles';

export type AcquisitionType = 'ingame' | 'hangar';

export interface UserFleetItem {
  id: string;
  user_id: string;
  ship_id: string;
  quantity: number;
  acquisition_type: AcquisitionType;
  created_at: string;
  updated_at: string;
  ship: Ship;
}

export interface FleetAggregation {
  ship: Ship;
  totalQuantity: number;
  owners: {
    profile: ProfileWithRole;
    quantity: number;
    acquisitionType: AcquisitionType;
  }[];
}

export const useUserFleet = (userId: string) => {
  return useQuery({
    queryKey: ['user-fleet', userId],
    queryFn: async (): Promise<UserFleetItem[]> => {
      const { data, error } = await supabase
        .from('user_fleet')
        .select(`
          *,
          ship:ships(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        ship: item.ship as Ship,
      }));
    },
    enabled: !!userId,
  });
};

export const useAggregatedFleet = () => {
  return useQuery({
    queryKey: ['aggregated-fleet'],
    queryFn: async (): Promise<FleetAggregation[]> => {
      // Get all fleet items with ship info
      const { data: fleetItems, error: fleetError } = await supabase
        .from('user_fleet')
        .select(`
          *,
          ship:ships(*)
        `);

      if (fleetError) throw fleetError;

      // Get all profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);
      const profileMap = new Map(
        profiles?.map((p) => [
          p.id,
          { ...p, role: roleMap.get(p.id) || 'member' } as ProfileWithRole,
        ]) || []
      );

      // Aggregate by ship
      const aggregationMap = new Map<string, FleetAggregation>();

      for (const item of fleetItems || []) {
        const ship = item.ship as Ship;
        const profile = profileMap.get(item.user_id);

        if (!profile) continue;

        if (!aggregationMap.has(ship.id)) {
          aggregationMap.set(ship.id, {
            ship,
            totalQuantity: 0,
            owners: [],
          });
        }

        const agg = aggregationMap.get(ship.id)!;
        agg.totalQuantity += item.quantity;
        agg.owners.push({
          profile,
          quantity: item.quantity,
          acquisitionType: item.acquisition_type as AcquisitionType,
        });
      }

      return Array.from(aggregationMap.values());
    },
  });
};

export const useAddToFleet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      shipId,
      quantity = 1,
      acquisitionType = 'hangar',
    }: {
      userId: string;
      shipId: string;
      quantity?: number;
      acquisitionType?: AcquisitionType;
    }) => {
      // Check if user already has this ship with the same acquisition type
      const { data: existing } = await supabase
        .from('user_fleet')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('ship_id', shipId)
        .eq('acquisition_type', acquisitionType)
        .maybeSingle();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('user_fleet')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_fleet')
          .insert({ user_id: userId, ship_id: shipId, quantity, acquisition_type: acquisitionType });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-fleet'] });
      queryClient.invalidateQueries({ queryKey: ['aggregated-fleet'] });
    },
  });
};

export const useUpdateFleetItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from('user_fleet')
          .delete()
          .eq('id', itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_fleet')
          .update({ quantity })
          .eq('id', itemId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-fleet'] });
      queryClient.invalidateQueries({ queryKey: ['aggregated-fleet'] });
    },
  });
};

export const useRemoveFromFleet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('user_fleet')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-fleet'] });
      queryClient.invalidateQueries({ queryKey: ['aggregated-fleet'] });
    },
  });
};

export const useImportFleetFromJSON = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      jsonData,
    }: {
      userId: string;
      jsonData: unknown;
    }) => {
      const data = jsonData as { canvasItems?: Array<{ itemType: string; shipSlug: string; defaultText: string }> };
      const canvasItems = data.canvasItems || [];
      const shipItems = canvasItems.filter((item) => item.itemType === 'SHIP');

      // Get all ships
      const { data: ships } = await supabase.from('ships').select('id, ship_slug');
      const shipMap = new Map(ships?.map((s) => [s.ship_slug, s.id]) || []);

      // Count occurrences of each ship in JSON
      const shipCounts = new Map<string, number>();
      for (const item of shipItems) {
        const shipId = shipMap.get(item.shipSlug);
        if (shipId) {
          shipCounts.set(shipId, (shipCounts.get(shipId) || 0) + 1);
        }
      }

      // Add to fleet
      for (const [shipId, quantity] of shipCounts) {
        const { data: existing } = await supabase
          .from('user_fleet')
          .select('id, quantity')
          .eq('user_id', userId)
          .eq('ship_id', shipId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('user_fleet')
            .update({ quantity: existing.quantity + quantity })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('user_fleet')
            .insert({ user_id: userId, ship_id: shipId, quantity });
        }
      }

      return { imported: shipCounts.size };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-fleet'] });
      queryClient.invalidateQueries({ queryKey: ['aggregated-fleet'] });
    },
  });
};
