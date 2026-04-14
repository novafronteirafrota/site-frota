import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ship {
  id: string;
  ship_slug: string;
  name: string;
  manufacturer?: string;
  photo_url?: string;
  available_ingame: boolean;
  available_hangar: boolean;
  created_at: string;
}

export const useShips = () => {
  return useQuery({
    queryKey: ['ships'],
    queryFn: async (): Promise<Ship[]> => {
      const { data, error } = await supabase
        .from('ships')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useShip = (shipId: string) => {
  return useQuery({
    queryKey: ['ship', shipId],
    queryFn: async (): Promise<Ship | null> => {
      const { data, error } = await supabase
        .from('ships')
        .select('*')
        .eq('id', shipId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!shipId,
  });
};

export const useCreateShip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ship: Omit<Ship, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ships')
        .insert(ship)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
    },
  });
};

export const useUpdateShip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shipId,
      updates,
    }: {
      shipId: string;
      updates: Partial<Omit<Ship, 'id' | 'created_at'>>;
    }) => {
      const { error } = await supabase
        .from('ships')
        .update(updates)
        .eq('id', shipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      queryClient.invalidateQueries({ queryKey: ['ship'] });
    },
  });
};

export const useDeleteShip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipId: string) => {
      const { error } = await supabase
        .from('ships')
        .delete()
        .eq('id', shipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
    },
  });
};

export const useImportShipsFromJSON = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jsonData: unknown) => {
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('JSON inválido');
      }

      const data = jsonData as { canvasItems?: Array<{ itemType: string; shipSlug: string; defaultText: string }> };
      const canvasItems = data.canvasItems;
      
      if (!canvasItems || !Array.isArray(canvasItems)) {
        throw new Error('O JSON deve conter um array "canvasItems"');
      }

      const shipsFromJson = canvasItems
        .filter((item) => item.itemType === 'SHIP' && item.shipSlug && item.defaultText)
        .map((item) => ({
          ship_slug: item.shipSlug,
          name: item.defaultText,
        }));

      if (shipsFromJson.length === 0) {
        throw new Error('Nenhuma nave encontrada no JSON. Verifique se o formato está correto.');
      }

      // Deduplicate ships from JSON (keep first occurrence)
      const uniqueShipsMap = new Map<string, { ship_slug: string; name: string }>();
      for (const ship of shipsFromJson) {
        if (!uniqueShipsMap.has(ship.ship_slug)) {
          uniqueShipsMap.set(ship.ship_slug, ship);
        }
      }
      const uniqueShips = Array.from(uniqueShipsMap.values());

      // Get existing ships to check for duplicates
      const { data: existingShips, error: fetchError } = await supabase
        .from('ships')
        .select('ship_slug');

      if (fetchError) throw new Error(`Erro ao verificar naves existentes: ${fetchError.message}`);

      const existingSlugs = new Set(existingShips?.map((s) => s.ship_slug) || []);
      const newShips = uniqueShips.filter((s) => !existingSlugs.has(s.ship_slug));

      if (newShips.length > 0) {
        const { error } = await supabase.from('ships').insert(newShips);
        if (error) throw new Error(`Erro ao inserir naves: ${error.message}`);
      }

      return { imported: newShips.length, skipped: shipsFromJson.length - newShips.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
    },
  });
};
