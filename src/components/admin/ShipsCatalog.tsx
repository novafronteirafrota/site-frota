import React, { useState, useMemo } from 'react';
import { useShips, useCreateShip, useUpdateShip, useDeleteShip, Ship } from '@/hooks/useShips';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import SearchInput from '@/components/common/SearchInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Rocket, Plus, Pencil, Trash2, Loader2, Gamepad2, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type SortOption = 'name' | 'manufacturer';

const ShipsCatalog: React.FC = () => {
  const { role } = useAuth();
  const { data: ships, isLoading, error } = useShips();
  const createShip = useCreateShip();
  const updateShip = useUpdateShip();
  const deleteShip = useDeleteShip();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [createOpen, setCreateOpen] = useState(false);
  const [editShip, setEditShip] = useState<Ship | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Ship | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ship_slug: '',
    manufacturer: '',
    photo_url: '',
    available_ingame: true,
    available_hangar: true,
  });

  const canManageShips = role === 'admin' || role === 'moderator';

  const filteredAndSortedShips = useMemo(() => {
    if (!ships) return [];
    let result = [...ships];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (ship) =>
          ship.name.toLowerCase().includes(searchLower) ||
          ship.manufacturer?.toLowerCase().includes(searchLower) ||
          ship.ship_slug.toLowerCase().includes(searchLower)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'manufacturer') {
        return (a.manufacturer || '').localeCompare(b.manufacturer || '');
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [ships, search, sortBy]);

  const resetForm = () => {
    setFormData({ name: '', ship_slug: '', manufacturer: '', photo_url: '', available_ingame: true, available_hangar: true });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.ship_slug) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e Ship Slug são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createShip.mutateAsync({
        name: formData.name,
        ship_slug: formData.ship_slug,
        manufacturer: formData.manufacturer || undefined,
        photo_url: formData.photo_url || undefined,
        available_ingame: formData.available_ingame,
        available_hangar: formData.available_hangar,
      });
      toast({ title: 'Nave criada!', description: `${formData.name} foi adicionada ao catálogo.` });
      setCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Erro ao criar nave',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShip) return;

    try {
      await updateShip.mutateAsync({
        shipId: editShip.id,
        updates: {
          name: formData.name,
          ship_slug: formData.ship_slug,
          manufacturer: formData.manufacturer || undefined,
          photo_url: formData.photo_url || undefined,
          available_ingame: formData.available_ingame,
          available_hangar: formData.available_hangar,
        },
      });
      toast({ title: 'Nave atualizada!', description: `${formData.name} foi atualizada.` });
      setEditShip(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar nave',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteShip.mutateAsync(deleteConfirm.id);
      toast({ title: 'Nave removida!', description: `${deleteConfirm.name} foi removida do catálogo.` });
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: 'Erro ao remover nave',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const openEdit = (ship: Ship) => {
    setFormData({
      name: ship.name,
      ship_slug: ship.ship_slug,
      manufacturer: ship.manufacturer || '',
      photo_url: ship.photo_url || '',
      available_ingame: ship.available_ingame,
      available_hangar: ship.available_hangar,
    });
    setEditShip(ship);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-lg p-4">
            <Skeleton className="h-20 w-20 mx-auto rounded-lg mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Erro ao carregar naves: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar nave..."
          className="w-full sm:w-64"
        />
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome A-Z</SelectItem>
              <SelectItem value="manufacturer">Fabricante</SelectItem>
            </SelectContent>
          </Select>
          {canManageShips && (
            <Button variant="neon" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Nave
            </Button>
          )}
        </div>
      </div>

      {filteredAndSortedShips.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Rocket className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{ships?.length === 0 ? 'Nenhuma nave no catálogo' : 'Nenhuma nave encontrada'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredAndSortedShips.map((ship) => (
            <div
              key={ship.id}
              className="glass-card rounded-lg p-4 hover:border-primary/30 transition-colors group"
            >
              <div className="relative">
                {ship.photo_url ? (
                  <img
                    src={ship.photo_url}
                    alt={ship.name}
                    className="w-20 h-20 object-cover rounded-lg mx-auto mb-3 border border-border/50"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg mx-auto mb-3 bg-primary/10 border border-border/50 flex items-center justify-center">
                    <Rocket className="w-8 h-8 text-primary/50" />
                  </div>
                )}
                
                {canManageShips && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(ship)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteConfirm(ship)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <h4 className="font-display text-sm text-foreground text-center truncate">
                {ship.name}
              </h4>
              {ship.manufacturer && (
                <p className="text-xs text-muted-foreground text-center truncate">
                  {ship.manufacturer}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Nova Nave</DialogTitle>
            <DialogDescription>Adicione uma nova nave ao catálogo</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Aurora MR"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ship_slug">Ship Slug</Label>
              <Input
                id="ship_slug"
                required
                value={formData.ship_slug}
                onChange={(e) => setFormData((p) => ({ ...p, ship_slug: e.target.value }))}
                placeholder="aurora_mr"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData((p) => ({ ...p, manufacturer: e.target.value }))}
                placeholder="RSI"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo_url">URL da Foto</Label>
              <Input
                id="photo_url"
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData((p) => ({ ...p, photo_url: e.target.value }))}
                placeholder="https://exemplo.com/foto.jpg"
                className="bg-background/50"
              />
            </div>
            
            {/* Acquisition Options */}
            <div className="space-y-3">
              <Label>Disponível para aquisição</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="available_ingame"
                    checked={formData.available_ingame}
                    onCheckedChange={(checked) => setFormData((p) => ({ ...p, available_ingame: !!checked }))}
                  />
                  <label htmlFor="available_ingame" className="text-sm text-foreground flex items-center gap-2 cursor-pointer">
                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                    Compra no Jogo (In-game)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="available_hangar"
                    checked={formData.available_hangar}
                    onCheckedChange={(checked) => setFormData((p) => ({ ...p, available_hangar: !!checked }))}
                  />
                  <label htmlFor="available_hangar" className="text-sm text-foreground flex items-center gap-2 cursor-pointer">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Hangar da Conta (Dinheiro Real)
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="neon" disabled={createShip.isPending} className="flex-1">
                {createShip.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editShip} onOpenChange={(open) => !open && setEditShip(null)}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Editar Nave</DialogTitle>
            <DialogDescription>Atualize os dados da nave</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ship_slug">Ship Slug</Label>
              <Input
                id="edit-ship_slug"
                required
                value={formData.ship_slug}
                onChange={(e) => setFormData((p) => ({ ...p, ship_slug: e.target.value }))}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manufacturer">Fabricante</Label>
              <Input
                id="edit-manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData((p) => ({ ...p, manufacturer: e.target.value }))}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-photo_url">URL da Foto</Label>
              <Input
                id="edit-photo_url"
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData((p) => ({ ...p, photo_url: e.target.value }))}
                className="bg-background/50"
              />
            </div>
            
            {/* Acquisition Options */}
            <div className="space-y-3">
              <Label>Disponível para aquisição</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="edit-available_ingame"
                    checked={formData.available_ingame}
                    onCheckedChange={(checked) => setFormData((p) => ({ ...p, available_ingame: !!checked }))}
                  />
                  <label htmlFor="edit-available_ingame" className="text-sm text-foreground flex items-center gap-2 cursor-pointer">
                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                    Compra no Jogo (In-game)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="edit-available_hangar"
                    checked={formData.available_hangar}
                    onCheckedChange={(checked) => setFormData((p) => ({ ...p, available_hangar: !!checked }))}
                  />
                  <label htmlFor="edit-available_hangar" className="text-sm text-foreground flex items-center gap-2 cursor-pointer">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Hangar da Conta (Dinheiro Real)
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditShip(null)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="neon" disabled={updateShip.isPending} className="flex-1">
                {updateShip.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Nave</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteConfirm?.name}" do catálogo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShipsCatalog;
