import { supabase, TENANT_ID, notifySyncEvent } from '../lib/supabase';

import { ProductMediaRelation, MediaAsset } from '../types/database.types';

export const BUCKET_NAME = 'cp-public';

export const MAX_FILE_SIZE_BYTES = 31457280; // 30 MB (cp-public bucket limit)

export const CANONICAL_MIME_BY_EXT: Record<string, string> = {

  jpg: 'image/jpeg',

  jpeg: 'image/jpeg',

  png: 'image/png',

  webp: 'image/webp',

  gif: 'image/gif',

  mp4: 'video/mp4',

  webm: 'video/webm',

};

export const EXT_BY_MIME: Record<string, string> = {

  'image/jpeg': 'jpg',

  'image/png': 'png',

  'image/webp': 'webp',

  'image/gif': 'gif',

  'video/mp4': 'mp4',

  'video/webm': 'webm',

};

export const ALLOWED_MIMES = new Set([

  'image/jpeg',

  'image/png',

  'image/webp',

  'image/gif',

  'video/mp4',

  'video/webm',

]);

export const ACCEPTED_IMAGE_MIME_TYPES = new Set([

  'image/jpeg',

  'image/png',

  'image/webp',

  'image/gif',

]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {

  return typeof id === 'string' && UUID_REGEX.test(id.trim());

}

export interface MediaValidationResult {

  isValid: boolean;

  error?: string;

  mimeType?: string;

  mediaType?: 'image' | 'video'; // Persisted in media_assets

  editorCategory?: 'image' | 'video' | 'animation';

  extension?: string;

  cleanFileName?: string;

  sizeBytes?: number;

}

/**

 * Pure validation and classification helper satisfying HOEOS Canonical Media Contract

 */

export function validateAndClassifyMedia(

  file: File | Blob,

  _declaredCategory?: string

): MediaValidationResult {

  if (!file || typeof file !== 'object') {

    return { isValid: false, error: 'No file provided' };

  }

  const size = typeof file.size === 'number' ? file.size : 0;

  if (size <= 0) {

    return { isValid: false, error: 'File is empty (0 bytes)' };

  }

  if (size > MAX_FILE_SIZE_BYTES) {

    return { isValid: false, error: `File size exceeds bucket limit of 30 MB (${size} bytes)` };

  }

  const rawFileName = (file instanceof File || ('name' in file && typeof (file as { name?: unknown }).name === 'string'))

    ? (file as { name: string }).name.trim()

    : '';

  const declaredMime = typeof file.type === 'string' ? file.type.trim().toLowerCase() : '';

  let finalMime = '';

  let finalExt = '';

  if (rawFileName) {

    const parts = rawFileName.split('.');

    const ext = parts.length > 1 ? parts.pop()!.toLowerCase().trim() : '';

    if (!ext) {

      if (!declaredMime) {

        return { isValid: false, error: 'File has no extension and no MIME type' };

      }

      if (!ALLOWED_MIMES.has(declaredMime)) {

        return { isValid: false, error: `Unsupported MIME type: ${declaredMime}` };

      }

      finalMime = declaredMime;

      finalExt = EXT_BY_MIME[declaredMime];

    } else {

      const canonicalMime = CANONICAL_MIME_BY_EXT[ext];

      if (!canonicalMime) {

        return {

          isValid: false,

          error: `Unsupported file extension .${ext}. Allowed: .jpg, .jpeg, .png, .webp, .gif, .mp4, .webm`,

        };

      }

      if (declaredMime && declaredMime !== canonicalMime) {

        // Handle jpg/jpeg alias equivalence

        const isJpegMatch = (ext === 'jpg' || ext === 'jpeg') && declaredMime === 'image/jpeg';

        if (!isJpegMatch) {

          return {

            isValid: false,

            error: `Contradictory file extension (.${ext}) and declared MIME type (${declaredMime})`,

          };

        }

      }

      finalMime = canonicalMime;

      finalExt = ext;

    }

  } else {

    // Blob without filename

    if (!declaredMime) {

      return { isValid: false, error: 'MIME type is required for Blob uploads without a filename' };

    }

    if (!ALLOWED_MIMES.has(declaredMime)) {

      return { isValid: false, error: `Unsupported MIME type: ${declaredMime}` };

    }

    finalMime = declaredMime;

    finalExt = EXT_BY_MIME[declaredMime];

  }

  const cleanFileName = rawFileName

    ? rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_')

    : `upload.${finalExt}`;

  let mediaType: 'image' | 'video' = 'image';

  let editorCategory: 'image' | 'video' | 'animation' = 'image';

  if (finalMime.startsWith('video/')) {

    mediaType = 'video';

    editorCategory = 'video';

  } else if (finalMime === 'image/gif') {

    mediaType = 'image'; // Persisted as 'image' so HTML <img> renders animation deterministically

    editorCategory = 'animation';

  } else {

    mediaType = 'image';

    editorCategory = 'image';

  }

  return {

    isValid: true,

    mimeType: finalMime,

    mediaType,

    editorCategory,

    extension: finalExt,

    cleanFileName,

    sizeBytes: size,

  };

}

const getErrMsg = (err: unknown, fallback: string): string => {

  if (err && typeof err === 'object' && 'message' in err) {

    return String((err as { message: unknown }).message);

  }

  return err ? String(err) : fallback;

};

/**

 * Safely compensates for partial upload failure by deleting the created asset

 * and storage object only when no other product_media relations reference it.

 */

async function safeCleanupUnreferencedAsset(
  assetId: string,
  storagePath: string
): Promise<boolean> {
  try {
    // Gate 1: reference status must be established before deleting anything.
    const { data: refs, error: refErr } = await supabase
      .from('product_media')
      .select('product_id')
      .eq('media_id', assetId);

    if (refErr || !Array.isArray(refs)) {
      console.error(
        '[HOEOS RECOVERY] Reference status unknown; preserving asset and Storage object.',
        refErr ?? 'Invalid reference query result'
      );
      return false;
    }

    if (refs.length > 0) {
      console.warn(
        '[HOEOS RECOVERY] Asset is referenced; preserving asset and Storage object.',
        { assetId, referenceCount: refs.length }
      );
      return false;
    }

    // Gate 2: require confirmation that exactly this asset row was deleted.
    const { data: deletedRows, error: deleteErr } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', assetId)
      .select('id');

    if (deleteErr) {
      console.error(
        '[HOEOS RECOVERY] Asset-row deletion failed; preserving Storage object.',
        deleteErr
      );
      return false;
    }

    if (
      !Array.isArray(deletedRows) ||
      deletedRows.length !== 1 ||
      deletedRows[0]?.id !== assetId
    ) {
      console.error(
        '[HOEOS RECOVERY] Asset-row deletion was not confirmed; preserving Storage object.',
        { assetId, deletedRows }
      );
      return false;
    }

    // Gate 3: only remove Storage after confirmed row deletion.
    const { data: removedObjects, error: storageErr } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (storageErr || !Array.isArray(removedObjects) || removedObjects.length !== 1) {
      console.error(
        '[HOEOS RECOVERY] Asset row deleted, but Storage removal was not confirmed.',
        { assetId, storagePath, storageErr, removedObjects }
      );
      return false;
    }

    return true;
  } catch (cleanupErr) {
    console.error(
      '[HOEOS RECOVERY] Cleanup state is uncertain; stopping further destructive actions.',
      cleanupErr
    );
    return false;
  }
}

/**
 * Pure file signature inspection helper detecting magic bytes where feasible.
 */
export async function inspectFileSignature(
  file: File | Blob
): Promise<{ detectedMime?: string; isValid: boolean; error?: string }> {
  try {
    if (!file || typeof (file as { slice?: unknown }).slice !== 'function') {
      return { isValid: false, error: 'File signature inspection is unavailable' };
    }
    const slice = file.slice(0, 32);
    if (!slice || typeof (slice as { arrayBuffer?: unknown }).arrayBuffer !== 'function') {
      return { isValid: false, error: 'File signature data could not be read' };
    }
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 3) {
      return { isValid: false, error: 'File signature is too short to validate' };
    }

    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { detectedMime: 'image/jpeg', isValid: true };
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
      bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A
    ) {
      return { detectedMime: 'image/png', isValid: true };
    }
    // GIF: GIF87a (47 49 46 38 37 61) or GIF89a (47 49 46 38 39 61)
    if (
      bytes.length >= 6 &&
      bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61
    ) {
      return { detectedMime: 'image/gif', isValid: true };
    }
    // WebP: RIFF (bytes 0-3: 52 49 46 46) and WEBP (bytes 8-11: 57 45 42 50)
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return { detectedMime: 'image/webp', isValid: true };
    }
    // MP4: bytes 4-7: ftyp (66 74 79 70)
    if (
      bytes.length >= 8 &&
      bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
    ) {
      return { detectedMime: 'video/mp4', isValid: true };
    }
    // WebM: 1A 45 DF A3
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3
    ) {
      return { detectedMime: 'video/webm', isValid: true };
    }

    return { isValid: false, error: 'Unrecognized file signature for the declared media format' };
  } catch {
    return { isValid: false, error: 'Unable to inspect file signature' };
  }
}

export interface UploadAssetOptions {
  altText?: string;
  caption?: string;
  targetPathPrefix?: string;
  scopeType?: string;
  scopeId?: string | null;
  allowOversizedAnimation?: boolean;
}

export interface UploadAssetResult {
  data: MediaAsset | null;
  error: string | null;
  warning?: string;
}

export const mediaService = {

  /**

   * Upload file to Supabase Storage (cp-public) and link via media_assets & product_media

   */

  async uploadMedia(

    productId: string,

    file: File | Blob,

    mediaType = 'image',

    altText = '',

    isPrimary = false

  ): Promise<{ data: ProductMediaRelation | null; error: string | null }> {

    try {

      // 0. Validate product ID syntax

      if (!isValidUuid(productId)) {

        return { data: null, error: 'Invalid product ID: must be a valid UUID' };

      }

      // 1. Validate and classify media file/blob

      const validation = validateAndClassifyMedia(file, mediaType);

      if (!validation.isValid || !validation.mimeType || !validation.mediaType || !validation.cleanFileName) {

        return { data: null, error: validation.error || 'Invalid media file' };

      }

      // 1b. Reject a readable file signature that contradicts the declared format.
      const signatureCheck = await inspectFileSignature(file);
      if (!signatureCheck.isValid) {
        return { data: null, error: signatureCheck.error || 'File signature validation failed' };
      }
      if (signatureCheck.detectedMime && signatureCheck.detectedMime !== validation.mimeType) {
        return {
          data: null,
          error: `File signature mismatch: detected ${signatureCheck.detectedMime}, expected ${validation.mimeType}`,
        };
      }

      // 2. Authoritative product existence and tenant authorization check

      const { data: product, error: productErr } = await supabase

        .from('products')

        .select('id, tenant_id')

        .eq('id', productId)

        .single();

      if (productErr || !product) {

        return {

          data: null,

          error: productErr ? getErrMsg(productErr, 'Product lookup failed or access denied') : 'Product not found',

        };

      }

      if (product.tenant_id !== TENANT_ID) {

        return {

          data: null,

          error: `Product belongs to tenant ${product.tenant_id}, not current tenant ${TENANT_ID}`,

        };

      }

      const cleanFileName = validation.cleanFileName;

      const timestamp = Date.now();

      const nonce = Math.random().toString(36).substring(2, 8);

      const storagePath = `products/${productId}/${timestamp}_${nonce}_${cleanFileName}`;

      const contentType = validation.mimeType;

      // 3. Upload to Supabase Storage bucket 'cp-public'

      const { data: storageData, error: uploadErr } = await supabase.storage

        .from(BUCKET_NAME)

        .upload(storagePath, file, {

          contentType,

          upsert: true,

        });

      if (uploadErr || !storageData) {

        return { data: null, error: uploadErr ? getErrMsg(uploadErr, 'Storage upload failed') : 'Storage upload failed' };

      }

      // 4. Create record in media_assets

      const assetRecord = {

        tenant_id: TENANT_ID,

        bucket: BUCKET_NAME,

        path: storagePath,

        media_type: validation.mediaType,

        mime_type: contentType,

        filename: cleanFileName,

        size_bytes: validation.sizeBytes || file.size || 0,

        alt_text: altText || cleanFileName,

        status: 'active',

      };

      const { data: assetCreated, error: assetErr } = await supabase

        .from('media_assets')

        .insert(assetRecord)

        .select('*')

        .single();

      if (assetErr || !assetCreated) {
        // The insert response may be ambiguous. Preserve Storage because the
        // asset-row state cannot yet be proven and safely reconciled.
        console.error(
          '[HOEOS RECOVERY] Asset insert was not confirmed; preserving Storage object for reconciliation.',
          { storagePath, assetErr: assetErr ?? null }
        );
        return {
          data: null,
          error: assetErr
            ? getErrMsg(assetErr, 'Failed to create media asset record; uploaded object preserved for reconciliation')
            : 'Failed to create media asset; uploaded object preserved for reconciliation',
        };
      }

      const mediaAsset = assetCreated as MediaAsset;

      // 5. Query current max sort order for product

      const { data: existingMedia, error: sortErr } = await supabase

        .from('product_media')

        .select('sort_order')

        .eq('product_id', productId)

        .order('sort_order', { ascending: false });

      if (sortErr) {

        await safeCleanupUnreferencedAsset(mediaAsset.id, storagePath);

        return {

          data: null,

          error: getErrMsg(sortErr, 'Failed to query existing product media sort order'),

        };

      }

      const mediaArr = Array.isArray(existingMedia) ? existingMedia : [];

      const nextOrder = (mediaArr.length > 0)

        ? (Number((mediaArr[0] as { sort_order?: number }).sort_order || 0) + 1)

        : 1;

      // 6. Link the media. Primary assignment and relation creation share one
      // database transaction through the RPC, so a failed insert cannot clear
      // the product's existing primary media.
      const productMediaRecord = {
        product_id: productId,
        media_id: mediaAsset.id,
        sort_order: nextOrder,
        is_primary: isPrimary,
      };

      const { data: linkCreated, error: linkErr } = isPrimary
        ? await supabase.rpc('set_product_primary_media', {
            p_product_id: productId,
            p_media_id: mediaAsset.id,
            p_create_link: true,
            p_sort_order: nextOrder,
          })
        : await supabase
            .from('product_media')
            .insert(productMediaRecord)
            .select('*, media_assets(*)')
            .single();

      const linkedRow = Array.isArray(linkCreated) ? linkCreated[0] : linkCreated;

      if (linkErr || !linkedRow) {

        await safeCleanupUnreferencedAsset(mediaAsset.id, storagePath);

        return {

          data: null,

          error: linkErr ? getErrMsg(linkErr, 'Failed to link product media') : 'Failed to link media',

        };

      }

      // 8. Deterministic sync notification after confirmed persistence

      notifySyncEvent('product_media', { productId, mediaId: mediaAsset.id }, 'INSERT');

      return { data: linkedRow as ProductMediaRelation, error: null };

    } catch (err: unknown) {

      console.error('Exception in uploadMedia:', err);

      return { data: null, error: err instanceof Error ? err.message : 'Media upload error' };

    }

  },

  /**

   * Reorder media assets for a product

   */

  async reorderMedia(productId: string, orderedMediaIds: string[]): Promise<{ success: boolean; error: string | null }> {

    try {

      if (!isValidUuid(productId)) {

        return { success: false, error: 'Invalid product ID: must be a valid UUID' };

      }

      for (let i = 0; i < orderedMediaIds.length; i++) {

        const { error } = await supabase

          .from('product_media')

          .update({ sort_order: i + 1 })

          .eq('product_id', productId)

          .eq('media_id', orderedMediaIds[i]);

        if (error) {

          return { success: false, error: getErrMsg(error, 'Reorder media error') };

        }

      }

      notifySyncEvent('product_media', { productId }, 'UPDATE');

      return { success: true, error: null };

    } catch (err: unknown) {

      return { success: false, error: err instanceof Error ? err.message : 'Reorder media error' };

    }

  },

  /**

   * Delete media link

   */

  async deleteMedia(productId: string, mediaId: string): Promise<{ success: boolean; error: string | null }> {

    try {

      if (!isValidUuid(productId)) {

        return { success: false, error: 'Invalid product ID: must be a valid UUID' };

      }

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

      if (!isValidUuid(productId)) {

        return { success: false, error: 'Invalid product ID: must be a valid UUID' };

      }

      const { data, error } = await supabase.rpc('set_product_primary_media', {
        p_product_id: productId,
        p_media_id: mediaId,
        p_create_link: false,
        p_sort_order: null,
      });

      const confirmed = Array.isArray(data) ? data.length === 1 : Boolean(data);
      if (error || !confirmed) {
        return {
          success: false,
          error: error
            ? getErrMsg(error, 'Failed to set primary media')
            : 'Primary media update was not confirmed; existing primary state was preserved',
        };
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

      if (!isValidUuid(productId)) {

        return [];

      }

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

  },

  /**
   * Upload standalone media asset to Supabase Storage and register in media_assets
   * Independent of product creation, fulfilling HOEOS general media upload pipeline.
   */
  async uploadAsset(
    file: File | Blob,
    options: UploadAssetOptions = {}
  ): Promise<UploadAssetResult> {
    try {
      // 1. Pure validation and classification
      const validation = validateAndClassifyMedia(file);
      if (!validation.isValid || !validation.mimeType || !validation.mediaType || !validation.cleanFileName) {
        return { data: null, error: validation.error || 'Invalid media file' };
      }

      // 2. File signature validation where feasible
      const signatureCheck = await inspectFileSignature(file);
      if (!signatureCheck.isValid) {
        return { data: null, error: signatureCheck.error || 'File signature validation failed' };
      }
      if (signatureCheck.detectedMime && signatureCheck.detectedMime !== validation.mimeType) {
        const isJpegAlias =
          (signatureCheck.detectedMime === 'image/jpeg' && validation.mimeType === 'image/jpeg') ||
          (signatureCheck.detectedMime === 'image/jpeg' && validation.extension === 'jpg') ||
          (signatureCheck.detectedMime === 'image/jpeg' && validation.extension === 'jpeg');
        if (!isJpegAlias) {
          return {
            data: null,
            error: `File signature mismatch: detected ${signatureCheck.detectedMime}, expected ${validation.mimeType}`,
          };
        }
      }

      // 3. Animation policy enforcement (<100 KB target)
      if (validation.editorCategory === 'animation' && (validation.sizeBytes || 0) > 102400) {
        if (!options.allowOversizedAnimation) {
          return {
            data: null,
            error: `Animated asset exceeds 100 KB optimization target (${Math.round((validation.sizeBytes || 0) / 1024)} KB). Optimize animation or enable linked-media option.`,
          };
        }
      }

      // 4. Duplicate prevention: check if an identical asset already exists for tenant
      const cleanFileName = validation.cleanFileName;
      const { data: existingAsset } = await supabase
        .from('media_assets')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('filename', cleanFileName)
        .eq('size_bytes', validation.sizeBytes || 0)
        .eq('status', 'active')
        .limit(1);

      if (Array.isArray(existingAsset) && existingAsset.length > 0) {
        return {
          data: existingAsset[0] as MediaAsset,
          error: null,
          warning: 'Existing identical asset record reused',
        };
      }

      // 5. Deterministic storage path reconciled with Phase 2 storage policy (media/{tenant_id}/...)
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(2, 8);
      let prefix = options.targetPathPrefix ? options.targetPathPrefix.replace(/\/+$/, '') : '';
      if (!prefix) {
        prefix = `media/${TENANT_ID}`;
      } else {
        // Under Phase 2 Storage RLS, standalone media MUST strictly reside in media/${TENANT_ID}
        if (prefix !== `media/${TENANT_ID}`) {
          return {
            data: null,
            error: `Invalid storage path prefix "${prefix}": Phase 2 Storage policy strictly requires media/${TENANT_ID}`,
          };
        }
      }
      const storagePath = `${prefix}/${timestamp}_${nonce}_${cleanFileName}`;

      // 6. Storage upload to 'cp-public'
      const { data: storageData, error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          contentType: validation.mimeType,
          upsert: true,
        });

      if (uploadErr || !storageData) {
        return {
          data: null,
          error: uploadErr ? getErrMsg(uploadErr, 'Storage upload failed') : 'Storage upload failed',
        };
      }

      // 7. Insert record in media_assets
      const assetRecord = {
        tenant_id: TENANT_ID,
        bucket: BUCKET_NAME,
        path: storagePath,
        media_type: validation.mediaType, // 'image' or 'video' (never 'animation')
        mime_type: validation.mimeType,
        filename: cleanFileName,
        size_bytes: validation.sizeBytes || (file.size ?? 0),
        alt_text: options.altText || cleanFileName,
        caption: options.caption || null,
        status: 'active',
      };

      const { data: assetCreated, error: assetErr } = await supabase
        .from('media_assets')
        .insert(assetRecord)
        .select('*')
        .single();

      if (assetErr || !assetCreated) {
        // The insert outcome may be ambiguous: the database can commit the row
        // while the response is lost or the client receives an error. Deleting
        // Storage here could create a dangling media_assets record. Preserve the
        // object and require reconciliation before any destructive cleanup.
        console.error(
          '[HOEOS RECOVERY] Asset insert was not confirmed; preserving Storage object for reconciliation.',
          { storagePath, assetErr: assetErr ?? null }
        );
        return {
          data: null,
          error: assetErr
            ? `${getErrMsg(assetErr, 'Failed to create media asset record')}; uploaded object preserved for reconciliation`
            : 'Failed to create media asset; uploaded object preserved for reconciliation',
        };
      }

      notifySyncEvent('media_assets', { id: assetCreated.id }, 'INSERT');
      return { data: assetCreated as MediaAsset, error: null };
    } catch (err: unknown) {
      console.error('Exception in uploadAsset:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Media upload error' };
    }
  },

  /**
   * Fetch all media assets for current tenant
   */
  async getAllMediaAssets(options?: {
    mediaType?: string;
    status?: string;
    limit?: number;
  }): Promise<MediaAsset[]> {
    try {
      let query = supabase
        .from('media_assets')
        .select('*')
        .eq('tenant_id', TENANT_ID);

      if (options?.mediaType) {
        query = query.eq('media_type', options.mediaType);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      } else {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(options?.limit || 200);

      if (error || !data) {
        return [];
      }
      return data as MediaAsset[];
    } catch {
      return [];
    }
  },

  /**
   * Link an existing media_asset to a product
   */
  async linkAssetToProduct(
    productId: string,
    mediaId: string,
    isPrimary = false
  ): Promise<{ data: ProductMediaRelation | null; error: string | null }> {
    try {
      if (!isValidUuid(productId) || !isValidUuid(mediaId)) {
        return { data: null, error: 'Invalid productId or mediaId UUID' };
      }

      // Check product belongs to tenant
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('id, tenant_id')
        .eq('id', productId)
        .single();
      if (prodErr || !product || product.tenant_id !== TENANT_ID) {
        return { data: null, error: 'Product lookup failed or tenant mismatch' };
      }

      // Check asset belongs to tenant and is active
      const { data: asset, error: assetErr } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', mediaId)
        .eq('tenant_id', TENANT_ID)
        .single();
      if (assetErr || !asset || asset.status !== 'active') {
        return { data: null, error: 'Media asset not found or not active' };
      }

      // Calculate next sort order
      const { data: existingMedia } = await supabase
        .from('product_media')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false });

      const mediaArr = Array.isArray(existingMedia) ? existingMedia : [];
      const nextOrder = mediaArr.length > 0 ? (Number((mediaArr[0] as { sort_order?: number }).sort_order || 0) + 1) : 1;

      if (isPrimary) {
        const { data, error } = await supabase.rpc('set_product_primary_media', {
          p_product_id: productId,
          p_media_id: mediaId,
          p_create_link: true,
          p_sort_order: nextOrder,
        });
        const link = Array.isArray(data) ? data[0] : data;
        if (error || !link) {
          return {
            data: null,
            error: error
              ? getErrMsg(error, 'Failed to atomically link primary product media')
              : 'Primary media link was not confirmed; existing primary state was preserved',
          };
        }
        notifySyncEvent('product_media', { productId, mediaId }, 'INSERT');
        return { data: link as ProductMediaRelation, error: null };
      }

      const { data: link, error: linkErr } = await supabase
        .from('product_media')
        .insert({
          product_id: productId,
          media_id: mediaId,
          sort_order: nextOrder,
          is_primary: false,
        })
        .select('*, media_assets(*)')
        .single();

      if (linkErr || !link) {
        return { data: null, error: linkErr ? getErrMsg(linkErr, 'Failed to link product media') : 'Failed to link media' };
      }

      notifySyncEvent('product_media', { productId, mediaId }, 'INSERT');
      return { data: link as ProductMediaRelation, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error linking asset to product' };
    }
  }

};
