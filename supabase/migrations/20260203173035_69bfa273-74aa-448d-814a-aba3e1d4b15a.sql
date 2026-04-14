-- Add acquisition type columns to ships table
ALTER TABLE public.ships 
ADD COLUMN available_ingame boolean NOT NULL DEFAULT true,
ADD COLUMN available_hangar boolean NOT NULL DEFAULT true;

-- Create enum for acquisition type
CREATE TYPE public.acquisition_type AS ENUM ('ingame', 'hangar');

-- Add acquisition_type column to user_fleet table
ALTER TABLE public.user_fleet 
ADD COLUMN acquisition_type public.acquisition_type NOT NULL DEFAULT 'hangar';