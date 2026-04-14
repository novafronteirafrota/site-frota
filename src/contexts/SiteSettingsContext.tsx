import React, { createContext, useContext, useEffect } from 'react';
import { useSiteSettings, SiteSettings } from '@/hooks/useSiteSettings';

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: null,
  isLoading: true,
});

export const useSiteSettingsContext = () => useContext(SiteSettingsContext);

// Helper to convert hex to HSL
function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: settings, isLoading } = useSiteSettings();

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;

      if (settings.primary_color) {
        root.style.setProperty('--primary', hexToHSL(settings.primary_color));
      }
      if (settings.secondary_color) {
        root.style.setProperty('--secondary', hexToHSL(settings.secondary_color));
      }
      if (settings.accent_color) {
        root.style.setProperty('--accent', hexToHSL(settings.accent_color));
      }
    }
  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={{ settings: settings || null, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
