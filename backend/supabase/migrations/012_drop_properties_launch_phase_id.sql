-- ============================================================
-- 012_drop_properties_launch_phase_id.sql
--
-- GOAL:
--   Remove unused properties.launch_phase_id (FK to
--   lookup_construction_status). Canonical launch membership is
--   properties.is_new_launch; construction status remains
--   properties.status_id → lookup_construction_status.
--
-- CONFIRMED DATA (production audit):
--   * properties total: 1
--   * rows with launch_phase_id populated: 0
--
-- DOES NOT:
--   * Create lookup_launch_phases
--   * Alter status_id, is_new_launch, possession_date, or
--     lookup_construction_status
--
-- Run AFTER 011_drop_floor_plans_configuration_id.sql.
-- ============================================================

-- Inline FK from 006: launch_phase_id UUID REFERENCES lookup_construction_status(id)
-- Postgres names this properties_launch_phase_id_fkey by default.
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_launch_phase_id_fkey;

ALTER TABLE public.properties
  DROP COLUMN IF EXISTS launch_phase_id;
