import React, { useState, useEffect } from 'react';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useSiteSettings';
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
import { Loader2, Save, Palette, Image, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SiteSettingsManager: React.FC = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const [logoUrl, setLogoUrl] = useState('');
  const [logoShape, setLogoShape] = useState<'square' | 'rounded' | 'circle'>('circle');
  const [orgName, setOrgName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#00e7ff');
  const [secondaryColor, setSecondaryColor] = useState('#1a1a2e');
  const [accentColor, setAccentColor] = useState('#16213e');

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logo_url || '');
      setLogoShape(settings.logo_shape);
      setOrgName(settings.org_name);
      setPrimaryColor(settings.primary_color || '#00e7ff');
      setSecondaryColor(settings.secondary_color || '#1a1a2e');
      setAccentColor(settings.accent_color || '#16213e');
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        logo_url: logoUrl.trim() || null,
        logo_shape: logoShape,
        org_name: orgName.trim() || 'Stellar ORG',
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
      });
      toast({ title: 'Configurações salvas com sucesso!' });
    } catch (error) {
      toast({
        title: 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    }
  };

  const getLogoShapeClass = () => {
    switch (logoShape) {
      case 'square':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-lg';
      case 'circle':
        return 'rounded-full';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Brand Section */}
      <div className="glass-card rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg text-foreground">Identidade da Organização</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Logo Preview */}
          <div className="flex flex-col items-center gap-4">
            <Label>Preview da Logo</Label>
            <div
              className={`w-24 h-24 bg-secondary border-2 border-primary/30 overflow-hidden flex items-center justify-center ${getLogoShapeClass()}`}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Logo Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-url">URL da Logo</Label>
              <Input
                id="logo-url"
                placeholder="https://exemplo.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-shape">Formato da Logo</Label>
              <Select value={logoShape} onValueChange={(v) => setLogoShape(v as typeof logoShape)}>
                <SelectTrigger id="logo-shape" className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Quadrada</SelectItem>
                  <SelectItem value="rounded">Arredondada</SelectItem>
                  <SelectItem value="circle">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-name">Nome da Organização</Label>
              <Input
                id="org-name"
                placeholder="Nome da sua ORG"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div className="glass-card rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg text-foreground">Cores do Tema</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-3">
            <Label htmlFor="primary-color">Cor Primária (Destaque)</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primary-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#00e7ff"
                className="flex-1 uppercase"
              />
            </div>
            <div
              className="h-8 rounded-lg border border-border"
              style={{ backgroundColor: primaryColor }}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="secondary-color">Cor Secundária (Fundo)</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="secondary-color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#1a1a2e"
                className="flex-1 uppercase"
              />
            </div>
            <div
              className="h-8 rounded-lg border border-border"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="accent-color">Cor de Acento</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="accent-color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#16213e"
                className="flex-1 uppercase"
              />
            </div>
            <div
              className="h-8 rounded-lg border border-border"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="gap-2"
        >
          {updateSettings.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default SiteSettingsManager;
