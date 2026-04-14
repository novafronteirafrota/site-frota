-- Create site_settings table for customization
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url text,
  logo_shape text NOT NULL DEFAULT 'circle' CHECK (logo_shape IN ('square', 'rounded', 'circle')),
  org_name text NOT NULL DEFAULT 'Stellar ORG',
  primary_color text DEFAULT '#00e7ff',
  secondary_color text DEFAULT '#1a1a2e',
  accent_color text DEFAULT '#16213e',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Site settings are viewable by everyone"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.site_settings (org_name, logo_shape, primary_color, secondary_color, accent_color)
VALUES ('Stellar ORG', 'circle', '#00e7ff', '#1a1a2e', '#16213e');