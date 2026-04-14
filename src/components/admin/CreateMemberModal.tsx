import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { UserPlus, Loader2 } from 'lucide-react';

interface CreateMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { session, role: callerRole } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    display_name: '',
    role: 'member' as AppRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.access_token) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado',
        variant: 'destructive',
      });
      return;
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(formData.username)) {
      toast({
        title: 'Username inválido',
        description: 'Use 3-30 caracteres: letras, números ou underscore',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter no mínimo 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('create-user', {
        body: formData,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar usuário');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Membro criado!',
        description: `${formData.display_name} foi adicionado com sucesso.`,
      });

      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      setFormData({
        username: '',
        password: '',
        display_name: '',
        role: 'member',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar membro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canAssignRole = (role: AppRole) => {
    if (callerRole === 'admin') return true;
    if (callerRole === 'moderator' && role === 'member') return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Novo Membro
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Adicione um novo membro à organização
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground">
              Username
            </Label>
            <Input
              id="username"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="nome_usuario"
              className="bg-background/50 border-border/50"
            />
            <p className="text-xs text-muted-foreground">
              3-30 caracteres: letras, números ou underscore
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Mínimo 6 caracteres"
              className="bg-background/50 border-border/50"
            />
          </div>

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
                <SelectItem value="member" disabled={!canAssignRole('member')}>
                  Membro
                </SelectItem>
                <SelectItem value="moderator" disabled={!canAssignRole('moderator')}>
                  Moderador
                </SelectItem>
                <SelectItem value="admin" disabled={!canAssignRole('admin')}>
                  Administrador
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Membro
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMemberModal;
