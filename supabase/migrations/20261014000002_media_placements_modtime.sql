-- =============================================================================
-- media_placements: updated_at trigger
-- Split from 20261014000000_media_placements.sql per Law 5.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_media_placements_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_placements_modtime ON public.media_placements;
CREATE TRIGGER trigger_media_placements_modtime
    BEFORE UPDATE ON public.media_placements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_media_placements_modtime();