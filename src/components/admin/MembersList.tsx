import React, { useState } from 'react';
import { useProfiles, ProfileWithRole } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteMember } from '@/hooks/useDeleteMember';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { User, Shield, ShieldCheck, Pencil, Trash2, Loader2 } from 'lucide-react';
import EditMemberModal from './EditMemberModal';

const roleConfig = {
  admin: {
    label: 'Admin',
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

const MembersList: React.FC = () => {
  const { data: profiles, isLoading, error } = useProfiles();
  const { user, role: callerRole } = useAuth();
  const [editMember, setEditMember] = useState<ProfileWithRole | null>(null);
  const [deleteMember, setDeleteMember] = useState<ProfileWithRole | null>(null);
  const deleteMutation = useDeleteMember();

  const canEditMember = (member: ProfileWithRole) => {
    if (callerRole === 'admin') return true;
    if (user?.id === member.id) return true;
    if (callerRole === 'moderator' && member.role === 'member') return true;
    return false;
  };

  const canDeleteMember = (member: ProfileWithRole) => {
    // Cannot delete yourself
    if (user?.id === member.id) return false;
    // Admins can delete anyone except themselves
    if (callerRole === 'admin') return true;
    // Moderators can only delete members
    if (callerRole === 'moderator' && member.role === 'member') return true;
    return false;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteMember) return;
    await deleteMutation.mutateAsync(deleteMember.id);
    setDeleteMember(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 glass-card rounded-lg"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
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
              className={`flex items-center gap-4 p-4 glass-card rounded-lg hover:border-primary/30 transition-colors ${
                isCurrentUser ? 'border-primary/50' : ''
              }`}
            >
              <Avatar className="h-12 w-12 border-2 border-border/50">
                <AvatarImage src={profile.photo_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-display">
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

              <Badge variant="outline" className={config.className}>
                <RoleIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>

              <div className="flex gap-1">
                {canEditMember(profile) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditMember(profile)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {canDeleteMember(profile) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteMember(profile)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EditMemberModal
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
        member={editMember}
      />

      <AlertDialog open={!!deleteMember} onOpenChange={(open) => !open && setDeleteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteMember?.display_name}</strong> (@{deleteMember?.username})?
              Esta ação é irreversível e também removerá toda a frota do membro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MembersList;
