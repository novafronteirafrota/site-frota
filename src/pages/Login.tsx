import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Rocket, Lock, User } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
const loginSchema = z.object({
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});
const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    signIn,
    isAuthenticated
  } = useAuth();
  const {
    settings
  } = useSiteSettingsContext();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', {
        replace: true
      });
    }
  }, [isAuthenticated, navigate]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = loginSchema.safeParse({
      username,
      password
    });
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive'
      });
      return;
    }
    setIsLoading(true);
    const {
      error
    } = await signIn(username, password);
    setIsLoading(false);
    if (error) {
      toast({
        title: 'Falha no login',
        description: error.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos' : error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.'
      });
    }
  };
  const logoShapeClass = settings?.logo_shape === 'square' ? 'rounded-none' : settings?.logo_shape === 'rounded' ? 'rounded-xl' : 'rounded-full';
  return <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          {settings?.logo_url ? <img src={settings.logo_url} alt={settings.org_name || 'Logo'} className={cn("w-20 h-20 object-cover mx-auto mb-6 border border-primary/50 shadow-neon animate-float", logoShapeClass)} /> : <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 border border-primary/50 mb-6 shadow-neon animate-float">
              <Rocket className="w-10 h-10 text-primary" />
            </div>}
          <h1 className="font-display text-3xl tracking-wider text-foreground">
            {settings?.org_name || 'STELLAR ORG'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Sejam Bem-Vindos 
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="glass-card rounded-xl p-8 space-y-6 neon-border">
          <div className="text-center mb-4">
            <h2 className="font-display text-xl text-foreground">FAÇA SEU LOGIN</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Apenas membros autorizados
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="pl-10" autoComplete="username" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" autoComplete="current-password" />
            </div>
          </div>

          <Button type="submit" variant="neon" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'ENTRAR'}
          </Button>
        </form>

        {/* Scan Line Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="absolute inset-x-0 h-px bg-primary animate-scan-line" />
        </div>
      </div>
    </div>;
};
export default Login;