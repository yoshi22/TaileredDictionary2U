-- ==============================================
-- Migration: Create trigger functions
-- Description: Automatic record creation triggers
-- ==============================================

-- Trigger: Create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Create entitlement on profile insert
CREATE OR REPLACE FUNCTION create_user_entitlement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entitlements (user_id, plan_type)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_entitlement
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_entitlement();

-- Trigger: Create default deck on profile insert
CREATE OR REPLACE FUNCTION create_default_deck()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO decks (user_id, name, description)
  VALUES (NEW.id, 'Default', 'デフォルトDeck');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_deck
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_deck();

-- Trigger: Create srs_data on entry insert
CREATE OR REPLACE FUNCTION create_srs_data()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO srs_data (entry_id, due_date)
  VALUES (NEW.id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_entry_created
  AFTER INSERT ON entries
  FOR EACH ROW EXECUTE FUNCTION create_srs_data();

-- Trigger: Update entry_count on entries insert/delete
CREATE OR REPLACE FUNCTION update_deck_entry_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deck_id IS NOT NULL THEN
    UPDATE decks SET entry_count = entry_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' AND OLD.deck_id IS NOT NULL THEN
    UPDATE decks SET entry_count = entry_count - 1 WHERE id = OLD.deck_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deck_id IS DISTINCT FROM NEW.deck_id THEN
      IF OLD.deck_id IS NOT NULL THEN
        UPDATE decks SET entry_count = entry_count - 1 WHERE id = OLD.deck_id;
      END IF;
      IF NEW.deck_id IS NOT NULL THEN
        UPDATE decks SET entry_count = entry_count + 1 WHERE id = NEW.deck_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_entry_deck_change
  AFTER INSERT OR UPDATE OR DELETE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_deck_entry_count();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_srs_data_updated_at
  BEFORE UPDATE ON srs_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
