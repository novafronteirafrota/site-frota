import React, { useState } from 'react';
import { useSubRanks, useCreateSubRank, useUpdateSubRank, useDeleteSubRank, SubRank } from '@/hooks/useSubRanks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Shield, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SubRanksManager: React.FC = () => {
  const { data: subRanks, isLoading, error } = useSubRanks();
  const createSubRank = useCreateSubRank();
  const updateSubRank = useUpdateSubRank();
  const deleteSubRank = useDeleteSubRank();

  const [createOpen, setCreateOpen] = useState(false);
  const [editSubRank, setEditSubRank] = useState<SubRank | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SubRank | null>(null);
  const [formData, setFormData] = useState({ name: '', icon_url: '' });

  const resetForm = () => {
    setFormData({ name: '', icon_url: '' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Nome é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createSubRank.mutateAsync({
        name: formData.name.trim(),
        icon_url: formData.icon_url.trim() || undefined,
      });
      toast({ title: 'Sub-rank criado!', description: `${formData.name} foi adicionado.` });
      setCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Erro ao criar sub-rank',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubRank) return;

    try {
      await updateSubRank.mutateAsync({
        id: editSubRank.id,
        updates: {
          name: formData.name.trim(),
          icon_url: formData.icon_url.trim() || undefined,
        },
      });
      toast({ title: 'Sub-rank atualizado!', description: `${formData.name} foi atualizado.` });
      setEditSubRank(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar sub-rank',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteSubRank.mutateAsync(deleteConfirm.id);
      toast({ title: 'Sub-rank removido!', description: `${deleteConfirm.name} foi removido.` });
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: 'Erro ao remover sub-rank',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const openEdit = (subRank: SubRank) => {
    setFormData({
      name: subRank.name,
      icon_url: subRank.icon_url || '',
    });
    setEditSubRank(subRank);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-lg p-4">
            <Skeleton className="h-10 w-10 mx-auto rounded-lg mb-3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Erro ao carregar sub-ranks: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="neon" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Sub-Rank
        </Button>
      </div>

      {!subRanks || subRanks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum sub-rank cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {subRanks.map((subRank) => (
            <div
              key={subRank.id}
              className="glass-card rounded-lg p-4 hover:border-primary/30 transition-colors group"
            >
              <div className="relative">
                {subRank.icon_url ? (
                  <img
                    src={subRank.icon_url}
                    alt={subRank.name}
                    className="w-10 h-10 object-contain rounded mx-auto mb-3"
                  />
                ) : (
                  <div className="w-10 h-10 rounded mx-auto mb-3 bg-primary/10 border border-border/50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary/50" />
                  </div>
                )}
                
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(subRank)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setDeleteConfirm(subRank)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <h4 className="font-display text-sm text-foreground text-center truncate">
                {subRank.name}
              </h4>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Novo Sub-Rank</DialogTitle>
            <DialogDescription>Adicione um novo sub-rank</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Mercenário"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon_url">URL do Ícone</Label>
              <Input
                id="icon_url"
                type="url"
                value={formData.icon_url}
                onChange={(e) => setFormData((p) => ({ ...p, icon_url: e.target.value }))}
                placeholder="https://exemplo.com/icone.png"
                className="bg-background/50"
              />
            </div>
            {formData.icon_url && (
              <div className="flex justify-center">
                <img
                  src={formData.icon_url}
                  alt="Preview"
                  className="w-12 h-12 object-contain rounded border border-border/50"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="neon" disabled={createSubRank.isPending} className="flex-1">
                {createSubRank.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSubRank} onOpenChange={(open) => !open && setEditSubRank(null)}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Editar Sub-Rank</DialogTitle>
            <DialogDescription>Atualize os dados do sub-rank</DialogDescription>
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
              <Label htmlFor="edit-icon_url">URL do Ícone</Label>
              <Input
                id="edit-icon_url"
                type="url"
                value={formData.icon_url}
                onChange={(e) => setFormData((p) => ({ ...p, icon_url: e.target.value }))}
                className="bg-background/50"
              />
            </div>
            {formData.icon_url && (
              <div className="flex justify-center">
                <img
                  src={formData.icon_url}
                  alt="Preview"
                  className="w-12 h-12 object-contain rounded border border-border/50"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditSubRank(null)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="neon" disabled={updateSubRank.isPending} className="flex-1">
                {updateSubRank.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Sub-Rank</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteConfirm?.name}"? Membros com este sub-rank ficarão sem sub-rank.
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

export default SubRanksManager;
