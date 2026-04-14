import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Users,
  Rocket,
  Upload,
  Shield,
  Database,
  UserPlus,
  Award,
  Palette,
} from 'lucide-react';
import CreateMemberModal from '@/components/admin/CreateMemberModal';
import MembersList from '@/components/admin/MembersList';
import ShipsCatalog from '@/components/admin/ShipsCatalog';
import FleetManager from '@/components/admin/FleetManager';
import JSONImporter from '@/components/admin/JSONImporter';
import RolesManager from '@/components/admin/RolesManager';
import SubRanksManager from '@/components/admin/SubRanksManager';
import SiteSettingsManager from '@/components/admin/SiteSettingsManager';

const AdminCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  onClick?: () => void;
  active?: boolean;
}> = ({ icon: Icon, title, description, onClick, active }) => (
  <button
    onClick={onClick}
    className={`glass-card-hover rounded-xl p-6 text-left w-full group transition-all ${
      active ? 'border-primary/50 shadow-neon' : ''
    }`}
  >
    <div className="flex items-start gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          active
            ? 'bg-primary/30 shadow-neon'
            : 'bg-primary/20 group-hover:shadow-neon'
        }`}
      >
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  </button>
);

type AdminSection = 'members' | 'ships' | 'fleets' | 'import' | 'roles' | 'subranks' | 'settings';

const Admin: React.FC = () => {
  const { role } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('members');
  const [createMemberOpen, setCreateMemberOpen] = useState(false);

  if (role !== 'admin' && role !== 'moderator') {
    return <Navigate to="/dashboard" replace />;
  }

  const isAdmin = role === 'admin';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Settings className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-display tracking-wider">
            PAINEL ADMIN
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-wide">
          Administração
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Gerencie membros, naves e configurações da organização
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-3">
          <AdminCard
            icon={Users}
            title="Gerenciar Membros"
            description="Adicionar, editar ou remover membros"
            onClick={() => setActiveSection('members')}
            active={activeSection === 'members'}
          />
          <AdminCard
            icon={Rocket}
            title="Catálogo de Naves"
            description="Gerenciar o catálogo global de naves"
            onClick={() => setActiveSection('ships')}
            active={activeSection === 'ships'}
          />
          <AdminCard
            icon={Database}
            title="Frotas"
            description="Editar frotas de membros"
            onClick={() => setActiveSection('fleets')}
            active={activeSection === 'fleets'}
          />
          <AdminCard
            icon={Upload}
            title="Importar JSON"
            description="Importar naves via hagar.link JSON"
            onClick={() => setActiveSection('import')}
            active={activeSection === 'import'}
          />
          <AdminCard
            icon={Award}
            title="Sub-Ranks"
            description="Gerenciar especialidades e funções"
            onClick={() => setActiveSection('subranks')}
            active={activeSection === 'subranks'}
          />
          {isAdmin && (
            <>
              <AdminCard
                icon={Shield}
                title="Ranks e Permissões"
                description="Configurar níveis de acesso"
                onClick={() => setActiveSection('roles')}
                active={activeSection === 'roles'}
              />
              <AdminCard
                icon={Palette}
                title="Personalização"
                description="Logo, nome e cores do site"
                onClick={() => setActiveSection('settings')}
                active={activeSection === 'settings'}
              />
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeSection === 'members' && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-foreground">Membros</h2>
                <Button
                  variant="neon"
                  size="sm"
                  onClick={() => setCreateMemberOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Membro
                </Button>
              </div>
              <MembersList />
            </div>
          )}

          {activeSection === 'ships' && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="font-display text-xl text-foreground">Catálogo de Naves</h2>
              <ShipsCatalog />
            </div>
          )}

          {activeSection === 'fleets' && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="font-display text-xl text-foreground">Gestão de Frotas</h2>
              <FleetManager />
            </div>
          )}

          {activeSection === 'import' && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="font-display text-xl text-foreground">Importar JSON</h2>
              <JSONImporter />
            </div>
          )}

          {activeSection === 'subranks' && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="font-display text-xl text-foreground">Sub-Ranks</h2>
              <SubRanksManager />
            </div>
          )}

          {activeSection === 'roles' && isAdmin && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="font-display text-xl text-foreground">Ranks e Permissões</h2>
              <RolesManager />
            </div>
          )}

          {activeSection === 'settings' && isAdmin && (
            <div className="space-y-6">
              <h2 className="font-display text-xl text-foreground">Personalização do Site</h2>
              <SiteSettingsManager />
            </div>
          )}
        </div>
      </div>

      {/* Create Member Modal */}
      <CreateMemberModal
        open={createMemberOpen}
        onOpenChange={setCreateMemberOpen}
      />
    </div>
  );
};

export default Admin;
