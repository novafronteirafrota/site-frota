-- Allow moderators to manage ships (INSERT, UPDATE, DELETE)
CREATE POLICY "Moderators can manage ships"
ON public.ships
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));