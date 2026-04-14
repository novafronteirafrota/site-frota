-- Create sub_ranks table
CREATE TABLE public.sub_ranks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add sub_rank_id to profiles
ALTER TABLE public.profiles ADD COLUMN sub_rank_id uuid REFERENCES public.sub_ranks(id) ON DELETE SET NULL;

-- Enable RLS on sub_ranks
ALTER TABLE public.sub_ranks ENABLE ROW LEVEL SECURITY;

-- Sub-ranks are viewable by all authenticated users
CREATE POLICY "Sub-ranks are viewable by authenticated users"
ON public.sub_ranks
FOR SELECT
USING (true);

-- Only admins and moderators can manage sub-ranks
CREATE POLICY "Admins can manage sub-ranks"
ON public.sub_ranks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can manage sub-ranks"
ON public.sub_ranks
FOR ALL
USING (has_role(auth.uid(), 'moderator'::app_role));