-- ============================================================
-- 011_drop_floor_plans_configuration_id.sql
--
-- GOAL:
--   Remove the legacy floor_plans.configuration_id column and its
--   FK to configurations(id). Master Layout / Floor Plan rows are
--   property-level only (plan_type master_plan / floor_plan).
--   Individual Configuration Layouts live on
--   property_configurations.image_path — not via this FK.
--
-- DOES NOT:
--   * Retarget the FK to property_configurations
--   * Alter configurations, price_breakdowns, or inventory_units
--   * Change floor_plans.plan_type / media columns / RLS
--
-- Run AFTER 010_publication_status_rls.sql.
-- ============================================================

-- Inline FK from 001: configuration_id UUID REFERENCES configurations(id)
-- Postgres names this floor_plans_configuration_id_fkey by default.
ALTER TABLE public.floor_plans
  DROP CONSTRAINT IF EXISTS floor_plans_configuration_id_fkey;

ALTER TABLE public.floor_plans
  DROP COLUMN IF EXISTS configuration_id;
