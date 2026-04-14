import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { Rocket, Users, User, Settings, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const { user, profile, role, signOut } = useAuth();
  const { settings } = useSiteSettingsContext();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Frota', icon: Rocket },
    { to: '/members', label: 'Membros', icon: Users },
    { to: `/profile/${user?.id}`, label: 'Perfil', icon: User },
  ];

  if (role === 'admin' || role === 'moderator') {
    navLinks.push({ to: '/admin', label: 'Admin', icon: Settings });
  }

  const isActive = (path: string) => location.pathname === path;

  const getLogoShapeClass = () => {
    switch (settings?.logo_shape) {
      case 'square':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-lg';
      case 'circle':
      default:
        return 'rounded-full';
    }
  };

  const orgName = settings?.org_name || 'STELLAR ORG';
  const nameParts = orgName.split(' ');
  const firstPart = nameParts.slice(0, -1).join(' ');
  const lastPart = nameParts[nameParts.length - 1];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div
              className={cn(
                'w-10 h-10 bg-primary/20 flex items-center justify-center border border-primary/50 group-hover:shadow-neon transition-all duration-300 overflow-hidden',
                getLogoShapeClass()
              )}
            >
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={orgName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Rocket className="w-5 h-5 text-primary" />
              )}
            </div>
            <span className="font-display text-xl tracking-wider text-foreground hidden sm:block">
              {nameParts.length > 1 ? (
                <>
                  {firstPart} <span className="text-primary">{lastPart}</span>
                </>
              ) : (
                <span className="text-primary">{orgName}</span>
              )}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive(link.to) ? 'default' : 'ghost'}
                  size="sm"
                  className={cn('gap-2', isActive(link.to) && 'shadow-neon')}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {profile?.photo_url && (
                <img
                  src={profile.photo_url}
                  alt={profile.display_name}
                  className="w-8 h-8 rounded-full border border-primary/50"
                />
              )}
              <span className="text-sm text-muted-foreground">
                {profile?.display_name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive(link.to) ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;