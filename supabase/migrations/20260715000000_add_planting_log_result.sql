-- Add a structured outcome field to planting logs so planting history can store results.

ALTER TABLE public.planting_logs
ADD COLUMN IF NOT EXISTS result text;
