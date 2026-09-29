import { supabase } from '../lib/supabase';
import { ProductMedia, MediaType } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const mediaService = {
  /**
   * Upload file to Supabase Storage and link to product_media table
   */
  async uploadMedia(
    productId: string,
    file: File | Blob | string,
    type: MediaType,
    altText = '',
    isPrimary = false
  ): Promise<{ data: ProductMedia | null; error: string | null }> {
    try {
      let finalUrl = '';

      if (typeof file === 'string' && (file.startsWith('http') || file.startsWith('data:'))) {
        // Direct URL or Data URL
        finalUrl = file;
      } else {
        // Storage upload
        const extension = file instanceof File ? file.name.split('.').pop() : 'jpg';
        const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${extension}`;

        const { data: storageData, error: uploadErr } = await supabase.storage
          .from('product-media')
          .upload(fileName, file, {
            contentType: file instanceof File ? file.type : 'image/jpeg',
            upsert: true,
          });

        if (uploadErr || !storageData) {
          return { data: null, error: uploadErr ? getErrMsg(uploadErr, 'Storage upload failed') : 'Storage upload failed' };
        }

        const { data: pubData } = supabase.storage.from('product-media').getPublicUrl(storageData.path);
        finalUrl = pubData.publicUrl;
      }

      // Check current max sort order
      const { data: existingMedia } = await supabase
        .from('product_media')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false });

      const mediaArr = Array.isArray(existingMedia) ? existingMedia : [];
      const nextOrder = (mediaArr.length > 0)
        ? (Number((mediaArr[0] as { sort_order?: number }).sort_order || 0) + 1)
        : 1;

      // If isPrimary, clear other primary flags
      if (isPrimary) {
        await supabase
          .from('product_media')
          .update({ is_primary: false })
          .eq('product_id', productId);
      }

      const mediaRecord = {
        product_id: productId,
        type,
        url: finalUrl,
        thumbnail_url: finalUrl,
        alt_text: altText,
        sort_order: nextOrder,
        is_primary: isPrimary,
        metadata: {
          uploaded_at: new Date().toISOString(),
        }
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('product_media')
        .insert(mediaRecord);

      if (insertErr || !inserted) {
        return { data: null, error: insertErr ? getErrMsg(insertErr, 'Failed to register product media') : 'Failed to register product media' };
      }

      const created = Array.isArray(inserted) ? (inserted[0] as ProductMedia) : (inserted as ProductMedia);

      if (isPrimary) {
        await supabase.from('products').update({ hero_media_id: created.id }).eq('id', productId);
      }

      return { data: created, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Media upload error' };
    }
  },

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('product_media').delete().eq('id', mediaId);
      if (error) {
        return { success: false, error: getErrMsg(error, 'Delete media error') };
      }
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete media error' };
    }
  },

  /**
   * Set hero / primary media
   */
  async setPrimaryMedia(productId: string, mediaId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await supabase.from('product_media').update({ is_primary: false }).eq('product_id', productId);
      await supabase.from('product_media').update({ is_primary: true }).eq('id', mediaId);
      await supabase.from('products').update({ hero_media_id: mediaId }).eq('id', productId);
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to set primary' };
    }
  }
};
