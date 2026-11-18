import { supabase, TENANT_ID, notifySyncEvent } from '../lib/supabase';
import { MediaPlacement, PlacementScopeType } from '../types/database.types';

function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const placementService = {
  /**
   * Fetch active media placements for a given scope type
   * Reads from Supabase media_placements table as single source of truth.
   * If migration is pending or table is inaccessible, returns empty array with diagnostic logging.
   * Never fabricates unpersisted in-memory placements.
   */
  async getPlacements(
    scopeType: PlacementScopeType,
    scopeId?: string,
    activeOnly = true
  ): Promise<MediaPlacement[]> {
    try {
      let query = supabase
        .from('media_placements')
        .select('*, media_assets(*)')
        .eq('tenant_id', TENANT_ID)
        .eq('scope_type', scopeType);

      if (scopeId) {
        query = query.eq('scope_id', scopeId);
      }

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });

      if (error) {
        console.warn('[HOEOS PLACEMENT] Database query error (migration may be pending):', error.message);
        return [];
      }

      const list = (data as unknown as MediaPlacement[]) || [];
      // Filter to ensure referenced asset is active and in approved bucket
      if (activeOnly) {
        return list.filter(p => {
          const asset = p.media_assets || p.asset;
          return !asset || (asset.status === 'active' && asset.bucket === 'cp-public');
        });
      }

      return list;
    } catch (err: unknown) {
      console.warn('[HOEOS PLACEMENT] Exception reading placements:', err);
      return [];
    }
  },

  /**
   * Fetch all placements for CMS admin management
   */
  async getAllPlacements(): Promise<MediaPlacement[]> {
    try {
      const { data, error } = await supabase
        .from('media_placements')
        .select('*, media_assets(*)')
        .eq('tenant_id', TENANT_ID)
        .order('scope_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('[HOEOS PLACEMENT] Database query error in getAllPlacements:', error.message);
        return [];
      }

      return (data as unknown as MediaPlacement[]) || [];
    } catch (err: unknown) {
      console.warn('[HOEOS PLACEMENT] Exception in getAllPlacements:', err);
      return [];
    }
  },

  /**
   * Create a new persistent media placement.
   * Enforces:
   * 1. Media asset tenant consistency (rejects cross-tenant media).
   * 2. Campaign / Sales journey tenant consistency when referenced.
   * 3. Concrete Supabase persistence (fails closed if migration missing or write fails).
   * 4. Reload-based publication verification (must re-query from database before reporting success).
   */
  async createPlacement(
    placement: {
      media_id: string;
      placement_key: string;
      scope_type: PlacementScopeType;
      scope_id?: string | null;
      sort_order?: number;
      active?: boolean;
      alt_text_override?: string | null;
    }
  ): Promise<{ data: MediaPlacement | null; error: string | null }> {
    try {
      // 1. UUID syntax validation
      if (!isValidUuid(placement.media_id)) {
        return { data: null, error: `Invalid media_id: must be a valid UUID (${placement.media_id})` };
      }

      // 2. Cross-tenant consistency check for media asset
      const { data: asset, error: assetErr } = await supabase
        .from('media_assets')
        .select('id, tenant_id, status, bucket')
        .eq('id', placement.media_id)
        .single();

      if (assetErr || !asset) {
        return { data: null, error: `Referenced media asset not found: ${placement.media_id}` };
      }

      if (asset.tenant_id !== TENANT_ID) {
        return {
          data: null,
          error: `Cross-tenant assignment denied: media asset ${placement.media_id} belongs to tenant ${asset.tenant_id}, not current tenant ${TENANT_ID}`,
        };
      }

      // 3. Cross-tenant consistency check for campaign scope
      if (placement.scope_type === 'campaign' && placement.scope_id) {
        if (isValidUuid(placement.scope_id)) {
          const { data: campaign, error: campErr } = await supabase
            .from('campaigns')
            .select('id, tenant_id')
            .eq('id', placement.scope_id)
            .single();

          if (campErr || !campaign) {
            return { data: null, error: `Referenced campaign not found: ${placement.scope_id}` };
          }

          if (campaign.tenant_id !== TENANT_ID) {
            return {
              data: null,
              error: `Cross-tenant assignment denied: campaign belongs to tenant ${campaign.tenant_id}, not current tenant ${TENANT_ID}`,
            };
          }
        }
      }

      // 4. Cross-tenant consistency check for sales_journey scope
      if (placement.scope_type === 'sales_journey' && placement.scope_id) {
        if (isValidUuid(placement.scope_id)) {
          const { data: journey, error: jErr } = await supabase
            .from('sales_journeys')
            .select('id, tenant_id')
            .eq('id', placement.scope_id)
            .single();

          if (jErr || !journey) {
            return { data: null, error: `Referenced sales journey not found: ${placement.scope_id}` };
          }

          if (journey.tenant_id !== TENANT_ID) {
            return {
              data: null,
              error: `Cross-tenant assignment denied: sales journey belongs to tenant ${journey.tenant_id}, not current tenant ${TENANT_ID}`,
            };
          }
        }
      }

      const payload = {
        tenant_id: TENANT_ID,
        media_id: placement.media_id,
        placement_key: placement.placement_key,
        scope_type: placement.scope_type,
        scope_id: placement.scope_id || null,
        sort_order: placement.sort_order ?? 0,
        active: placement.active ?? true,
        alt_text_override: placement.alt_text_override || null,
      };

      // 5. Database write to media_placements
      const { data: inserted, error: insertErr } = await supabase
        .from('media_placements')
        .insert(payload)
        .select('id')
        .single();

      if (insertErr || !inserted) {
        return {
          data: null,
          error: insertErr
            ? getErrMsg(insertErr, 'Database write failed: media placement was not persisted')
            : 'Database write failed: no row returned from media_placements',
        };
      }

      // 6. Acceptance verification: re-query persisted row from Supabase
      const { data: verifiedRow, error: verifyErr } = await supabase
        .from('media_placements')
        .select('*, media_assets(*)')
        .eq('id', inserted.id)
        .eq('tenant_id', TENANT_ID)
        .single();

      if (verifyErr || !verifiedRow) {
        return {
          data: null,
          error: `Publication verification failed: placement written with ID ${inserted.id} could not be re-queried from database (${verifyErr ? verifyErr.message : 'Record not found after write'})`,
        };
      }

      notifySyncEvent('media_placements', { id: (verifiedRow as MediaPlacement).id }, 'INSERT');
      return { data: verifiedRow as unknown as MediaPlacement, error: null };
    } catch (err: unknown) {
      return { data: null, error: getErrMsg(err, 'Failed to create placement') };
    }
  },

  /**
   * Replace the active image for one funnel slot.
   *
   * Compensated replacement: persist and reload-verify the new placement first,
   * then deactivate previous active placements. If deactivation fails, restore
   * prior rows and deactivate the new row. A database RPC is still required for
   * strict transaction-level atomicity across concurrent writers.
   */
  async replaceFunnelPlacement(input: {
    media_id: string;
    scope_id: string;
    slot: 'hero' | 'card';
    alt_text_override?: string | null;
  }): Promise<{ data: MediaPlacement | null; error: string | null }> {
    const scopeType: PlacementScopeType = input.slot === 'hero' ? 'funnel_hero' : 'funnel_card';
    const scopeId = input.scope_id.trim();
    if (!['sports', 'parties-events', 'hotels-hospitality', 'schools', 'individuals'].includes(scopeId)) {
      return { data: null, error: `Unsupported funnel scope: ${scopeId}` };
    }
    if (!isValidUuid(input.media_id)) {
      return { data: null, error: 'A valid media asset must be selected.' };
    }

    const existing = await this.getPlacements(scopeType, scopeId, false);
    const activeExisting = existing.filter(row => row.active);
    const sameAsset = activeExisting.find(row => row.media_id === input.media_id);
    if (sameAsset && activeExisting.length === 1) {
      return { data: sameAsset, error: null };
    }

    const created = await this.createPlacement({
      media_id: input.media_id,
      placement_key: `funnel_${scopeId}_${input.slot}`,
      scope_type: scopeType,
      scope_id: scopeId,
      sort_order: 0,
      active: true,
      alt_text_override: input.alt_text_override || null,
    });
    if (created.error || !created.data) {
      return { data: null, error: created.error || 'New funnel placement could not be verified.' };
    }

    const deactivated: MediaPlacement[] = [];
    for (const previous of activeExisting) {
      const result = await this.updatePlacement(previous.id, { active: false });
      if (result.error || !result.data || result.data.active) {
        const rollbackErrors: string[] = [];
        for (const row of deactivated) {
          const restored = await this.updatePlacement(row.id, { active: true });
          if (restored.error || !restored.data?.active) rollbackErrors.push(row.id);
        }
        const removedNew = await this.updatePlacement(created.data.id, { active: false });
        const suffix = [
          rollbackErrors.length ? ` Previous placements could not all be restored: ${rollbackErrors.join(', ')}.` : '',
          removedNew.error ? ` New placement rollback failed: ${removedNew.error}` : '',
        ].join('');
        return {
          data: null,
          error: `Replacement was not completed: ${result.error || 'previous placement deactivation was not verified'}.${suffix}`,
        };
      }
      deactivated.push(previous);
    }

    const finalRows = await this.getPlacements(scopeType, scopeId, true);
    const verified = finalRows.find(row => row.id === created.data!.id);
    if (!verified || finalRows.length !== 1) {
      return {
        data: null,
        error: `Replacement read-back failed: expected exactly one active ${input.slot} placement for ${scopeId}, found ${finalRows.length}.`,
      };
    }
    return { data: verified, error: null };
  },

  /**
   * Update an existing media placement with cross-tenant check and reload verification
   */
  async updatePlacement(
    id: string,
    updates: Partial<{
      placement_key: string;
      scope_type: PlacementScopeType;
      scope_id: string | null;
      sort_order: number;
      active: boolean;
      alt_text_override: string | null;
    }>
  ): Promise<{ data: MediaPlacement | null; error: string | null }> {
    try {
      if (!isValidUuid(id)) {
        return { data: null, error: `Invalid placement ID: must be a valid UUID (${id})` };
      }

      // Cross-tenant check for campaign updates
      if (updates.scope_type === 'campaign' && updates.scope_id && isValidUuid(updates.scope_id)) {
        const { data: campaign, error: campErr } = await supabase
          .from('campaigns')
          .select('id, tenant_id')
          .eq('id', updates.scope_id)
          .single();

        if (campErr || !campaign) {
          return { data: null, error: `Referenced campaign not found: ${updates.scope_id}` };
        }
        if (campaign.tenant_id !== TENANT_ID) {
          return {
            data: null,
            error: `Cross-tenant assignment denied: campaign belongs to tenant ${campaign.tenant_id}, not current tenant ${TENANT_ID}`,
          };
        }
      }

      // Cross-tenant check for sales_journey updates
      if (updates.scope_type === 'sales_journey' && updates.scope_id && isValidUuid(updates.scope_id)) {
        const { data: journey, error: jErr } = await supabase
          .from('sales_journeys')
          .select('id, tenant_id')
          .eq('id', updates.scope_id)
          .single();

        if (jErr || !journey) {
          return { data: null, error: `Referenced sales journey not found: ${updates.scope_id}` };
        }
        if (journey.tenant_id !== TENANT_ID) {
          return {
            data: null,
            error: `Cross-tenant assignment denied: sales journey belongs to tenant ${journey.tenant_id}, not current tenant ${TENANT_ID}`,
          };
        }
      }

      const { data, error } = await supabase
        .from('media_placements')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', TENANT_ID)
        .select('id')
        .single();

      if (error || !data) {
        return {
          data: null,
          error: error ? getErrMsg(error, 'Update failed') : 'Placement not found or update returned no data',
        };
      }

      // Reload-based verification
      const { data: verifiedRow, error: verifyErr } = await supabase
        .from('media_placements')
        .select('*, media_assets(*)')
        .eq('id', id)
        .eq('tenant_id', TENANT_ID)
        .single();

      if (verifyErr || !verifiedRow) {
        return {
          data: null,
          error: `Publication verification failed: updated placement ${id} could not be verified on database reload`,
        };
      }

      notifySyncEvent('media_placements', { id }, 'UPDATE');
      return { data: verifiedRow as unknown as MediaPlacement, error: null };
    } catch (err: unknown) {
      return { data: null, error: getErrMsg(err, 'Failed to update placement') };
    }
  },

  /**
   * Delete a media placement without deleting the underlying shared media asset
   */
  async deletePlacement(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (!isValidUuid(id)) {
        return { success: false, error: `Invalid placement ID: must be a valid UUID (${id})` };
      }

      const { error } = await supabase
        .from('media_placements')
        .delete()
        .eq('id', id)
        .eq('tenant_id', TENANT_ID);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Database delete failed') };
      }

      notifySyncEvent('media_placements', { id }, 'DELETE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: getErrMsg(err, 'Failed to delete placement') };
    }
  },

  /**
   * Reorder placements deterministically in database
   */
  async reorderPlacements(orderedIds: string[]): Promise<{ success: boolean; error: string | null }> {
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        if (!isValidUuid(id)) continue;

        const { error } = await supabase
          .from('media_placements')
          .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('tenant_id', TENANT_ID);

        if (error) {
          return { success: false, error: getErrMsg(error, `Failed to reorder placement ${id}`) };
        }
      }

      notifySyncEvent('media_placements', {}, 'UPDATE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: getErrMsg(err, 'Failed to reorder placements') };
    }
  },
};
