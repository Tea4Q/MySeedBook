-- Add a seed source column so packets can be tagged as purchased, gifted, gathered, or swapped.
ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS source text;
