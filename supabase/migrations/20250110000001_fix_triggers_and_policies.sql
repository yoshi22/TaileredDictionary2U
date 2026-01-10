-- ==============================================
-- Migration: Fix triggers and add missing policies
-- Description: Fix SECURITY DEFINER functions and add INSERT policies
-- ==============================================

-- ==================
-- Fix trigger functions with proper search_path
-- ==================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_entitlement ON profiles;
DROP TRIGGER IF EXISTS on_profile_created_deck ON profiles;

-- Recreate handle_new_user with proper settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recreate create_user_entitlement with proper settings
CREATE OR REPLACE FUNCTION public.create_user_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.entitlements (user_id, plan_type)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_profile_created_entitlement
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_user_entitlement();

-- Recreate create_default_deck with proper settings
CREATE OR REPLACE FUNCTION public.create_default_deck()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.decks (user_id, name, description)
  VALUES (NEW.id, 'Default', 'デフォルトDeck');
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_profile_created_deck
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_deck();

-- ==================
-- Add missing INSERT policies
-- ==================

-- Allow profiles INSERT for the user's own profile
-- This is needed as a fallback for the trigger
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow entitlements INSERT via trigger (service-level)
-- The trigger runs as SECURITY DEFINER so this is a fallback
CREATE POLICY "System can insert entitlements"
  ON entitlements FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
