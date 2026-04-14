import React, { useState, useEffect } from 'react';
import { useUpdateProfile, useUpdateUserRole, ProfileWithRole } from '@/hooks/useProfiles';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCog, Loader2, Key } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ProfileWithRole | null;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
  open,
  onOpenChange,
  member,
}) => {
  const { role: callerRole, user } = useAuth();
  const updateProfile = useUpdateProfile();
  const updateRole = useUpdateUserRole();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    photo_url: '',
    role: 'member' as AppRole,
  });

  useEffect(() => {
    if (member) {
      setFormData({
        display_name: member.display_name,
        photo_url: member.photo_url || '',
        role: member.role,
      });
    }
  }, [member]);

  if (!member) return null;

  const isOwnProfile = user?.id === member.id;
  const canEditRole = callerRole === 'admin' && !isOwnProfile;
  const canEditProfile = 
    callerRole === 'admin' || 
    isOwnProfile || 
    (callerRole === 'moderator' && member.role === 'member');
  const canChangePassword = 
    isOwnProfile ||
    callerRole === 'admin' || 
    (callerRole === 'moderator' && member.role === 'member');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEditProfile) {
      toast({
        title: 'Sem permissão',
        description: 'Você não pode editar este perfil',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update profile
      await updateProfile.mutateAsync({
        userId: member.id,
        updates: {
          display_name: formData.display_name,
          photo_url: formData.photo_url || null,
        },
      });

      // Update role if admin and not own profile
      if (canEditRole && formData.role !== member.role) {
        await updateRole.mutateAsync({
          userId: member.id,
          role: formData.role,
        });
      }

      toast({
        title: 'Membro atualizado!',
        description: `${formData.display_name} foi atualizado com sucesso.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Erro ao atualizar membro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            Editar Membro
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Editando: @{member.username}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-foreground">
              Nome de Exibição
            </Label>
            <Input
              id="display_name"
              required
              value={formData.display_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, display_name: e.target.value }))
              }
              placeholder="Nome Completo"
              className="bg-background/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_url" className="text-foreground">
              URL da Foto
            </Label>
            <Input
              id="photo_url"
              type="url"
              value={formData.photo_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, photo_url: e.target.value }))
              }
              placeholder="https://exemplo.com/foto.jpg"
              className="bg-background/50 border-border/50"
            />
          </div>

          {canEditRole && (
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">
                Cargo
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: AppRole) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {canChangePassword && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordModalOpen(true)}
              className="w-full gap-2"
            >
              <Key className="w-4 h-4" />
              Alterar Senha
            </Button>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="neon"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>

        <ChangePasswordModal
          open={passwordModalOpen}
          onOpenChange={setPasswordModalOpen}
          targetUserId={member.id}
          targetUsername={member.username}
          isOwnPassword={isOwnProfile}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberModal;
