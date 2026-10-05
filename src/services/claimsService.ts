import { supabase, TENANT_ID, notifySyncEvent } from '../lib/supabase';
import { ProductClaim, ClaimType, VerificationStatus } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const claimsService = {
  /**
   * Get all claims for a product
   */
  async getClaimsByProduct(productId: string, verifiedOnly = false): Promise<ProductClaim[]> {
    let query = supabase
      .from('product_claims')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('product_id', productId);

    if (verifiedOnly) {
      query = query.eq('verification_status', 'verified');
    }

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }
    return data as ProductClaim[];
  },

  /**
   * Get all claims across all products (for Admin Claims Audit)
   */
  async getAllClaims(): Promise<ProductClaim[]> {
    const { data, error } = await supabase
      .from('product_claims')
      .select('*, product:products(name, slug)')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }
    return data as ProductClaim[];
  },

  /**
   * Add a new claim (defaults to pending verification)
   */
  async addClaim(
    productId: string,
    claim: string,
    evidenceSource: string,
    claimType: ClaimType = 'health',
    verificationStatus: VerificationStatus = 'pending'
  ): Promise<{ data: ProductClaim | null; error: string | null }> {
    try {
      if (!claim || !evidenceSource) {
        return { data: null, error: 'Claim text and substantiating evidence source are required' };
      }

      const record = {
        tenant_id: TENANT_ID,
        product_id: productId,
        claim: claim.trim(),
        claim_type: claimType,
        evidence_source: evidenceSource.trim(),
        verification_status: verificationStatus,
        verified_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('product_claims')
        .insert(record)
        .select('*')
        .single();

      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to add claim') : 'Failed to add claim' };
      }

      notifySyncEvent('product_claims', { productId, claimId: (data as ProductClaim).id }, 'INSERT');
      return { data: data as ProductClaim, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error adding claim' };
    }
  },

  /**
   * Change Claim Verification Status
   * Public users ONLY see verified claims
   */
  async updateClaimStatus(
    claimId: string,
    verificationStatus: VerificationStatus,
    rejectionReason?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const updates: Record<string, unknown> = {
        verification_status: verificationStatus,
        verified_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
        rejection_reason: verificationStatus === 'rejected' ? (rejectionReason || 'Rejected by Admin') : null,
      };

      const { error } = await supabase
        .from('product_claims')
        .update(updates)
        .eq('id', claimId)
        .eq('tenant_id', TENANT_ID);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Error updating claim status') };
      }

      notifySyncEvent('product_claims', { claimId, verificationStatus }, 'UPDATE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error updating claim status' };
    }
  },

  /**
   * Delete claim
   */
  async deleteClaim(claimId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('product_claims')
        .delete()
        .eq('id', claimId)
        .eq('tenant_id', TENANT_ID);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Delete failed') };
      }

      notifySyncEvent('product_claims', { claimId }, 'DELETE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
    }
  }
};
