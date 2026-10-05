import { supabase, TENANT_ID, notifySyncEvent } from '../lib/supabase';
import { ProductMediaRelation, MediaAsset } from '../types/database.types';

const BUCKET_NAME = 'cp-public';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const mediaService = {
  /**
   * Upload file to Supabase Storage (cp-public) and link via media_assets & product_media
   */
  async uploadMedia(
    productId: string,
    file: File | Blob,
    mediaType: string = 'image',
    altText = '',
    isPrimary = false
  ): Promise<{ data: ProductMediaRelation | null; error: string | null }> {
    try {
      const fileName = file instanceof File ? file.name : 'upload.jpg';
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `products/${productId}/${Date.now()}_${cleanFileName}`;
      const contentType = file instanceof File && file.type ? file.type : 'image/jpeg';

      // 1. Upload to Supabase Storage bucket 'cp-public'
      const { data: storageData, error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          contentType,
          upsert: true,
        });

      if (uploadErr || !storageData) {
        return { data: null, error: uploadErr ? getErrMsg(uploadErr, 'Storage upload failed') : 'Storage upload failed' };
      }

      // 2. Create record in media_assets
      const assetRecord = {
        tenant_id: TENANT_ID,
        bucket: BUCKET_NAME,
        path: storagePath,
        media_type: mediaType,
        mime_type: contentType,
        filename: cleanFileName,
        size_bytes: file.size || 0,
        alt_text: altText || cleanFileName,
        status: 'active',
      };

      const { data: assetCreated, error: assetErr } = await supabase
        .from('media_assets')
        .insert(assetRecord)
        .select('*')
        .single();

      if (assetErr || !assetCreated) {
        return { data: null, error: assetErr ? getErrMsg(assetErr, 'Failed to create media asset record') : 'Failed to create media asset' };
      }

      const mediaAsset = assetCreated as MediaAsset;

      // 3. Check current max sort order for product
      const { data: existingMedia } = await supabase
        .from('product_media')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false });

      const mediaArr = Array.isArray(existingMedia) ? existingMedia : [];
      const nextOrder = (mediaArr.length > 0)
        ? (Number((mediaArr[0] as { sort_order?: number }).sort_order || 0) + 1)
        : 1;

      // 4. If isPrimary, clear other primary flags
      if (isPrimary) {
        await supabase
          .from('product_media')
          .update({ is_primary: false })
          .eq('product_id', productId);
      }

      // 5. Link in product_media
      const productMediaRecord = {
        product_id: productId,
        media_id: mediaAsset.id,
        sort_order: nextOrder,
        is_primary: isPrimary,
      };

      const { data: linkCreated, error: linkErr } = await supabase
        .from('product_media')
        .insert(productMediaRecord)
        .select('*, media_assets(*)')
        .single();

      if (linkErr || !linkCreated) {
        return { data: null, error: linkErr ? getErrMsg(linkErr, 'Failed to link product media') : 'Failed to link media' };
      }

      notifySyncEvent('product_media', { productId, mediaId: mediaAsset.id }, 'INSERT');
      return { data: linkCreated as ProductMediaRelation, error: null };
    } catch (err: unknown) {
      console.error('Exception in uploadMedia:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Media upload error' };
    }
  },

  /**
   * Delete media link
   */
  async deleteMedia(productId: string, mediaId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('product_media')
        .delete()
        .eq('product_id', productId)
        .eq('media_id', mediaId);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Delete media error') };
      }

      notifySyncEvent('product_media', { productId, mediaId }, 'DELETE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete media error' };
    }
  },

  /**
   * Set primary media for a product
   */
  async setPrimaryMedia(productId: string, mediaId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await supabase
        .from('product_media')
        .update({ is_primary: false })
        .eq('product_id', productId);

      const { error } = await supabase
        .from('product_media')
        .update({ is_primary: true })
        .eq('product_id', productId)
        .eq('media_id', mediaId);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Failed to set primary media') };
      }

      notifySyncEvent('product_media', { productId, mediaId }, 'UPDATE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to set primary' };
    }
  },

  /**
   * Get all media for a product
   */
  async getProductMedia(productId: string): Promise<ProductMediaRelation[]> {
    try {
      const { data, error } = await supabase
        .from('product_media')
        .select('*, media_assets(*)')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      if (error || !data) {
        return [];
      }
      return data as ProductMediaRelation[];
    } catch {
      return [];
    }
  },

  /**
   * Get public URL directly from path
   */
  getPublicUrl(path: string, bucket = BUCKET_NAME): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Get public URL for a media asset
   */
  getMediaAssetUrl(asset?: MediaAsset | null): string {
    if (!asset) return '';
    if (asset.public_url) return asset.public_url;
    if (asset.bucket && asset.path) {
      const { data } = supabase.storage.from(asset.bucket).getPublicUrl(asset.path);
      return data.publicUrl;
    }
    return '';
  }
};
