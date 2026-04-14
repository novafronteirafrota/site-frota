import React, { useState, useMemo } from 'react';
import { useProfiles, ProfileWithRole } from '@/hooks/useProfiles';
import { useShips } from '@/hooks/useShips';
import { useUserFleet, useAddToFleet, useUpdateFleetItem, useRemoveFromFleet } from '@/hooks/useFleet';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import SearchInput from '@/components/common/SearchInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Rocket, Plus, Minus, Trash2, ChevronLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type SortOption = 'name' | 'quantity';

const FleetManager: React.FC = () => {
  const { role: callerRole, user } = useAuth();
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const { data: ships } = useShips();
  const [selectedMember, setSelectedMember] = useState<ProfileWithRole | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string>('');
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetSortBy, setFleetSortBy] = useState<SortOption>('name');

  const { data: fleet, isLoading: loadingFleet } = useUserFleet(selectedMember?.id || '');

  const filteredAndSortedFleet = useMemo(() => {
    if (!fleet) return [];
    let result = [...fleet];

    if (fleetSearch.trim()) {
      const searchLower = fleetSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.ship.name.toLowerCase().includes(searchLower) ||
          item.ship.manufacturer?.toLowerCase().includes(searchLower)
      );
    }

    result.sort((a, b) => {
      if (fleetSortBy === 'quantity') {
        return b.quantity - a.quantity;
      }
      return a.ship.name.localeCompare(b.ship.name);
    });

    return result;
  }, [fleet, fleetSearch, fleetSortBy]);
  const addToFleet = useAddToFleet();
  const updateFleetItem = useUpdateFleetItem();
  const removeFromFleet = useRemoveFromFleet();

  const canEditFleet = (member: ProfileWithRole) => {
    if (callerRole === 'admin') return true;
    if (user?.id === member.id) return true;
    if (callerRole === 'moderator' && member.role === 'member') return true;
    return false;
  };

  const handleAddShip = async () => {
    if (!selectedMember || !selectedShipId) return;

    try {
      await addToFleet.mutateAsync({
        userId: selectedMember.id,
        shipId: selectedShipId,
        quantity: 1,
      });
      toast({ title: 'Nave adicionada!', description: 'Nave adicionada à frota.' });
      setSelectedShipId('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao adicionar nave',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await updateFleetItem.mutateAsync({ itemId, quantity: newQuantity });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar quantidade',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromFleet.mutateAsync(itemId);
      toast({ title: 'Nave removida', description: 'Nave removida da frota.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover nave',
        variant: 'destructive',
      });
    }
  };

  if (loadingProfiles) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!selectedMember) {
    const editableProfiles = profiles?.filter(p => canEditFleet(p)) || [];

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione um membro para editar a frota:
        </p>
        
        {editableProfiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum membro disponível para edição
          </div>
        ) : (
          <div className="space-y-2">
            {editableProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedMember(profile)}
                className="flex items-center gap-4 p-4 w-full glass-card rounded-lg hover:border-primary/30 transition-colors text-left"
              >
                <Avatar className="h-10 w-10 border border-border/50">
                  <AvatarImage src={profile.photo_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-display text-sm">
                    {profile.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-foreground truncate">
                    {profile.display_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                </div>
                <Rocket className="w-5 h-5 text-primary/50" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedMember(null)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Avatar className="h-10 w-10 border border-border/50">
          <AvatarImage src={selectedMember.photo_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-display text-sm">
            {selectedMember.display_name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-display text-foreground">{selectedMember.display_name}</h3>
          <p className="text-sm text-muted-foreground">@{selectedMember.username}</p>
        </div>
      </div>

      {/* Add Ship */}
      <div className="flex gap-2">
        <Select value={selectedShipId} onValueChange={setSelectedShipId}>
          <SelectTrigger className="flex-1 bg-background/50">
            <SelectValue placeholder="Selecione uma nave" />
          </SelectTrigger>
          <SelectContent>
            {ships?.map((ship) => (
              <SelectItem key={ship.id} value={ship.id}>
                {ship.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="neon"
          onClick={handleAddShip}
          disabled={!selectedShipId || addToFleet.isPending}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Search & Filter */}
      {fleet && fleet.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <SearchInput
            value={fleetSearch}
            onChange={setFleetSearch}
            placeholder="Buscar nave..."
            className="w-full sm:w-64"
          />
          <Select value={fleetSortBy} onValueChange={(v) => setFleetSortBy(v as SortOption)}>
            <SelectTrigger className="w-36 bg-secondary border-border">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome A-Z</SelectItem>
              <SelectItem value="quantity">Quantidade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Fleet List */}
      {loadingFleet ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !fleet || fleet.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Rocket className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Nenhuma nave na frota</p>
        </div>
      ) : filteredAndSortedFleet.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Rocket className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Nenhuma nave encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedFleet.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 glass-card rounded-lg"
            >
              {item.ship.photo_url ? (
                <img
                  src={item.ship.photo_url}
                  alt={item.ship.name}
                  className="w-10 h-10 object-cover rounded border border-border/50"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-primary/10 border border-border/50 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-primary/50" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-display text-foreground truncate">
                  {item.ship.name}
                </h4>
                {item.ship.manufacturer && (
                  <p className="text-xs text-muted-foreground">{item.ship.manufacturer}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-14 h-8 text-center bg-background/50 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FleetManager;
