-- ==============================================
-- Migration: Fix srs_data trigger
-- Description: Add SET search_path to srs_data trigger and add INSERT policy
-- ==============================================

-- Drop and recreate the srs_data trigger with proper search_path
DROP TRIGGER IF EXISTS on_entry_created ON entries;

CREATE OR REPLACE FUNCTION public.create_srs_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.srs_data (entry_id, due_date)
  VALUES (NEW.id, NOW());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_entry_created
  AFTER INSERT ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.create_srs_data();

-- Also fix the deck entry count trigger
DROP TRIGGER IF EXISTS on_entry_deck_change ON entries;

CREATE OR REPLACE FUNCTION public.update_deck_entry_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deck_id IS NOT NULL THEN
    UPDATE public.decks SET entry_count = entry_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' AND OLD.deck_id IS NOT NULL THEN
    UPDATE public.decks SET entry_count = entry_count - 1 WHERE id = OLD.deck_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deck_id IS DISTINCT FROM NEW.deck_id THEN
      IF OLD.deck_id IS NOT NULL THEN
        UPDATE public.decks SET entry_count = entry_count - 1 WHERE id = OLD.deck_id;
      END IF;
      IF NEW.deck_id IS NOT NULL THEN
        UPDATE public.decks SET entry_count = entry_count + 1 WHERE id = NEW.deck_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_entry_deck_change
  AFTER INSERT OR UPDATE OR DELETE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.update_deck_entry_count();

-- Add INSERT policy for srs_data (for trigger fallback)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System can insert srs_data'
  ) THEN
    CREATE POLICY "System can insert srs_data"
      ON srs_data FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;

-- Grant permissions on srs_data
GRANT ALL ON srs_data TO authenticated;
