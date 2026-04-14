import React, { useState } from 'react';
import { useProfiles, useUpdateUserRole, ProfileWithRole } from '@/hooks/useProfiles';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { User, Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const roleConfig = {
  admin: {
    label: 'Administrador',
    icon: ShieldCheck,
    className: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  moderator: {
    label: 'Moderador',
    icon: Shield,
    className: 'bg-warning/20 text-warning border-warning/30',
  },
  member: {
    label: 'Membro',
    icon: User,
    className: 'bg-primary/20 text-primary border-primary/30',
  },
};

const RolesManager: React.FC = () => {
  const { user } = useAuth();
  const { data: profiles, isLoading, error } = useProfiles();
  const updateRole = useUpdateUserRole();
  const [confirmChange, setConfirmChange] = useState<{
    member: ProfileWithRole;
    newRole: AppRole;
  } | null>(null);

  const handleRoleChange = (member: ProfileWithRole, newRole: AppRole) => {
    if (newRole === member.role) return;
    setConfirmChange({ member, newRole });
  };

  const confirmRoleChange = async () => {
    if (!confirmChange) return;

    try {
      await updateRole.mutateAsync({
        userId: confirmChange.member.id,
        role: confirmChange.newRole,
      });
      toast({
        title: 'Cargo atualizado!',
        description: `${confirmChange.member.display_name} agora é ${roleConfig[confirmChange.newRole].label}.`,
      });
      setConfirmChange(null);
    } catch (error) {
      toast({
        title: 'Erro ao atualizar cargo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Erro ao carregar membros: {error.message}
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum membro encontrado
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {profiles.map((profile) => {
          const config = roleConfig[profile.role];
          const RoleIcon = config.icon;
          const isCurrentUser = profile.id === user?.id;

          return (
            <div
              key={profile.id}
              className="flex items-center gap-4 p-4 glass-card rounded-lg"
            >
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarImage src={profile.photo_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-display text-sm">
                  {profile.display_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-foreground truncate">
                    {profile.display_name}
                  </h4>
                  {isCurrentUser && (
                    <span className="text-xs text-primary">(você)</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  @{profile.username}
                </p>
              </div>

              {isCurrentUser ? (
                <Badge variant="outline" className={config.className}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              ) : (
                <Select
                  value={profile.role}
                  onValueChange={(value: AppRole) => handleRoleChange(profile, value)}
                >
                  <SelectTrigger className={`w-40 ${config.className} border`}>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <RoleIcon className="w-3 h-3" />
                        {config.label}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        Membro
                      </div>
                    </SelectItem>
                    <SelectItem value="moderator">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Moderador
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        Administrador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!confirmChange} onOpenChange={(open) => !open && setConfirmChange(null)}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Cargo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o cargo de{' '}
              <strong>{confirmChange?.member.display_name}</strong> para{' '}
              <strong>{confirmChange && roleConfig[confirmChange.newRole].label}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              disabled={updateRole.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateRole.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RolesManager;
