import { supabase } from '../lib/supabase';
import { ProductClaim, ClaimStatus } from '../types/database.types';

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
    let query = supabase.from('product_claims').select('*').eq('product_id', productId);
    if (verifiedOnly) {
      query = query.eq('status', 'verified');
    }
    const { data } = await query;
    return (data as ProductClaim[]) || [];
  },

  /**
   * Get all claims across all products (for Admin Claims Audit)
   */
  async getAllClaims(): Promise<ProductClaim[]> {
    const { data } = await supabase.from('product_claims').select('*').order('created_at', { ascending: false });
    return (data as ProductClaim[]) || [];
  },

  /**
   * Add a new claim (defaults to pending unless pre-approved)
   */
  async addClaim(
    productId: string,
    claim: string,
    source: string,
    badgeIcon = 'leaf',
    status: ClaimStatus = 'pending'
  ): Promise<{ data: ProductClaim | null; error: string | null }> {
    try {
      if (!claim || !source) {
        return { data: null, error: 'Claim text and substantiating source are required' };
      }

      const record: Partial<ProductClaim> = {
        product_id: productId,
        claim,
        source,
        status,
        badge_icon: badgeIcon,
        approved_by: status === 'verified' ? 'CP Quality Assurance Lead' : null,
        approved_at: status === 'verified' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase.from('product_claims').insert(record);
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to add claim') : 'Failed to add claim' };
      }

      return { data: Array.isArray(data) ? (data[0] as ProductClaim) : (data as ProductClaim), error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error adding claim' };
    }
  },

  /**
   * Change Claim Status (HOEOS Rule: Only verified claims show publicly)
   */
  async updateClaimStatus(
    claimId: string,
    status: ClaimStatus,
    approvedBy: string = 'CP Quality Assurance'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('product_claims')
        .update({
          status,
          approved_by: status === 'verified' ? approvedBy : null,
          approved_at: status === 'verified' ? new Date().toISOString() : null,
        })
        .eq('id', claimId);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Error updating claim status') };
      }
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error updating claim status' };
    }
  },

  /**
   * Delete claim
   */
  async deleteClaim(claimId: string): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('product_claims').delete().eq('id', claimId);
    return { success: !error, error: error ? getErrMsg(error, 'Delete failed') : null };
  }
};
