import { supabase, TENANT_ID, notifySyncEvent } from '../lib/supabase';
import {
  Product,
  ProductStatus,
  ProductCategory,
  PriceList,
  MediaAsset,
} from '../types/database.types';
import {
  BUCKET_NAME,
  isValidUuid,
  ACCEPTED_IMAGE_MIME_TYPES,
} from './mediaService';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export interface ProductInput {
  name: string;
  slug: string;
  category_id?: string | null;
  sku?: string | null;
  brand?: string | null;
  short_description?: string | null;
  description?: string | null;
  status?: ProductStatus;
  featured?: boolean;
  price?: number;
  compare_at_price?: number | null;
  volume?: number;
  volume_unit?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  metadata?: Record<string, unknown>;
}

const PRODUCT_SELECT_QUERY = `
  *,
  category:product_categories(*),
  variants:product_variants(*, prices:product_prices(*)),
  media:product_media(*, media_assets(*)),
  claims:product_claims(*)
`;

export interface ProductPublicationValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Shared Publication Validator satisfying HOEOS G1/G2 Publication Gate:
 * Enforces all 8 prerequisite rules against persisted Supabase records:
 * 1. Target product exists and tenant matches expected tenant (TENANT_ID).
 * 2. product_media association exists for exact product with is_primary = true.
 * 3. Associated media_assets record exists and has same tenant as product (TENANT_ID).
 * 4. Media asset bucket is exactly 'cp-public'.
 * 5. Media asset status is exactly 'active'.
 * 6. Media asset media_type is exactly 'image'.
 * 7. MIME type is an accepted image MIME type (image/jpeg, image/png, image/webp, image/gif).
 * 8. Storage path matches expected prefix: products/{productId}/...
 */
export async function validateProductPublication(
  productId: string
): Promise<ProductPublicationValidationResult> {
  if (!productId || typeof productId !== 'string' || !isValidUuid(productId.trim())) {
    return {
      isValid: false,
      error: `Invalid product ID "${productId}": must be a valid UUID`,
    };
  }

  const cleanProductId = productId.trim();

  try {
    // 1. Establish product existence and tenant match
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, tenant_id, status')
      .eq('id', cleanProductId)
      .single();

    if (prodErr || !product) {
      const isNotFound = prodErr && typeof prodErr === 'object' && (
        ('code' in prodErr && (prodErr as { code?: unknown }).code === 'PGRST116') ||
        ('details' in prodErr && String((prodErr as { details?: unknown }).details).includes('0 rows'))
      );

      return {
        isValid: false,
        error: isNotFound
          ? `Product ${cleanProductId} not found in database`
          : `Database verification error checking product existence: ${prodErr ? getErrMsg(prodErr, 'Query failed') : 'Product not found'}`,
      };
    }

    if (product.tenant_id !== TENANT_ID) {
      return {
        isValid: false,
        error: `Product tenant mismatch: product belongs to tenant "${product.tenant_id}", expected current tenant "${TENANT_ID}"`,
      };
    }

    // 2. Query product_media for primary media association
    const { data: mediaLinks, error: mediaErr } = await supabase
      .from('product_media')
      .select('product_id, media_id, is_primary, media_assets(*)')
      .eq('product_id', cleanProductId)
      .eq('is_primary', true);

    if (mediaErr) {
      return {
        isValid: false,
        error: `Database verification error checking primary media association: ${getErrMsg(mediaErr, 'Query failed')}`,
      };
    }

    if (!mediaLinks || mediaLinks.length === 0) {
      return {
        isValid: false,
        error: `Publication prerequisite failed: Product ${cleanProductId} has no primary media attached in product_media (is_primary = true)`,
      };
    }

    // 3 - 8. Validate primary media candidates
    let candidateFailureReason = '';

    for (const rawLink of (mediaLinks as unknown as any[])) {
      const link = rawLink as {
        product_id: string;
        media_id: string;
        is_primary: boolean;
        media_assets?: MediaAsset | MediaAsset[] | null;
      };

      if (link.product_id !== cleanProductId) {
        candidateFailureReason = `Media link product ID mismatch: expected ${cleanProductId}, found ${link.product_id}`;
        continue;
      }

      if (!link.is_primary) {
        candidateFailureReason = `Media link is not marked as primary (is_primary = false)`;
        continue;
      }

      let asset: MediaAsset | null = Array.isArray(link.media_assets)
        ? (link.media_assets[0] || null)
        : (link.media_assets || null);

      // Fallback: If media_assets was not embedded via relation query, fetch directly
      if (!asset && link.media_id) {
        const { data: directAsset, error: assetErr } = await supabase
          .from('media_assets')
          .select('*')
          .eq('id', link.media_id)
          .single();

        if (assetErr) {
          return {
            isValid: false,
            error: `Database verification error fetching media asset ${link.media_id}: ${getErrMsg(assetErr, 'Query failed')}`,
          };
        }
        asset = directAsset as MediaAsset | null;
      }

      if (!asset) {
        candidateFailureReason = `Associated media asset record "${link.media_id}" does not exist in media_assets`;
        continue;
      }

      // 3. Asset tenant must match expected tenant & product tenant
      if (asset.tenant_id !== TENANT_ID || asset.tenant_id !== product.tenant_id) {
        candidateFailureReason = `Media asset tenant mismatch: asset tenant "${asset.tenant_id}" does not match tenant "${TENANT_ID}"`;
        continue;
      }

      // 4. Bucket must be exactly cp-public
      if (asset.bucket !== BUCKET_NAME) {
        candidateFailureReason = `Media asset bucket mismatch: asset bucket is "${asset.bucket}", expected "${BUCKET_NAME}"`;
        continue;
      }

      // 5. Persisted status must be exactly active
      if (asset.status !== 'active') {
        candidateFailureReason = `Media asset status is "${asset.status}"; publication requires an "active" primary media asset`;
        continue;
      }

      // 6. Persisted media_type must be image
      if (asset.media_type !== 'image') {
        candidateFailureReason = `Primary media asset must have media_type "image", but found "${asset.media_type}"`;
        continue;
      }

      // 7. MIME type must be an accepted image MIME type (JPEG, PNG, WebP, GIF)
      const mime = (asset.mime_type || '').toLowerCase().trim();
      if (!mime || !ACCEPTED_IMAGE_MIME_TYPES.has(mime)) {
        candidateFailureReason = `Invalid primary image MIME type "${asset.mime_type}". Accepted image MIME types: ${Array.from(ACCEPTED_IMAGE_MIME_TYPES).join(', ')}`;
        continue;
      }

      // 8. Storage path must belong to expected product path: products/{productId}/...
      const expectedPrefix = `products/${cleanProductId}/`;
      if (!asset.path || !asset.path.startsWith(expectedPrefix) || asset.path.length <= expectedPrefix.length) {
        candidateFailureReason = `Media asset storage path "${asset.path}" does not belong to expected product storage path "${expectedPrefix}*"`;
        continue;
      }

      // All 8 checks passed!
      return {
        isValid: true,
        error: null,
      };
    }

    return {
      isValid: false,
      error: `Publication prerequisite failed: ${candidateFailureReason || 'No qualifying primary image found meeting publication requirements'}`,
    };
  } catch (err: unknown) {
    return {
      isValid: false,
      error: `Unexpected error during publication validation: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export const productsService = {
  validateProductPublication,
  /**
   * Helper to ensure an authoritative default price list exists for the tenant
   */
  async ensureDefaultPriceList(): Promise<string> {
    const { data: existing, error: findErr } = await supabase
      .from('price_lists')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('price_type', 'retail')
      .limit(1);

    if (!findErr && existing && existing.length > 0) {
      return (existing[0] as { id: string }).id;
    }

    const { data: created, error: createErr } = await supabase
      .from('price_lists')
      .insert({
        tenant_id: TENANT_ID,
        name: 'Default Retail',
        currency: 'NGN',
        price_type: 'retail',
        status: 'active',
      })
      .select('id')
      .single();

    if (createErr || !created) {
      throw new Error(`Failed to initialize price list: ${createErr?.message || 'Unknown error'}`);
    }

    return (created as { id: string }).id;
  },

  /**
   * Public Product Catalog query
   * Only returns published products with verified claims and active media
   */
  async getPublishedProducts(): Promise<{ data: Product[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_QUERY)
        .eq('tenant_id', TENANT_ID)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching published products:', error);
        return { data: [], error: getErrMsg(error, 'Failed to fetch products') };
      }

      // Filter claims to verified only for public storefront
      const sanitized = ((data as unknown as Product[]) || []).map(p => ({
        ...p,
        claims: (p.claims || []).filter(c => c.verification_status === 'verified'),
      }));

      return { data: sanitized, error: null };
    } catch (err: unknown) {
      console.error('Exception fetching published products:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown product error' };
    }
  },

  /**
   * Admin Product Catalog query
   * Returns all products (draft, published, archived) for CP Fruit Splash tenant
   */
  async getAllProducts(): Promise<{ data: Product[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_QUERY)
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin products:', error);
        return { data: [], error: getErrMsg(error, 'Failed to fetch products') };
      }

      return { data: (data as unknown as Product[]) || [], error: null };
    } catch (err: unknown) {
      console.error('Exception fetching admin products:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown admin product error' };
    }
  },

  /**
   * Resolve single product by slug (Authoritative flow: /products/:slug -> Supabase -> product record)
   */
  async getProductBySlug(slug: string, publicOnly = true): Promise<{ data: Product | null; error: string | null }> {
    try {
      let query = supabase
        .from('products')
        .select(PRODUCT_SELECT_QUERY)
        .eq('tenant_id', TENANT_ID)
        .eq('slug', slug);

      if (publicOnly) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query.single();
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Product not found') : 'Product not found' };
      }

      const prod = data as unknown as Product;
      if (publicOnly && prod.claims) {
        prod.claims = prod.claims.filter(c => c.verification_status === 'verified');
      }

      return { data: prod, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Unknown slug query error' };
    }
  },

  /**
   * Resolve single product by ID
   */
  async getProductById(id: string): Promise<{ data: Product | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_QUERY)
        .eq('tenant_id', TENANT_ID)
        .eq('id', id)
        .single();

      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Product not found') : 'Product not found' };
      }

      return { data: data as unknown as Product, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error resolving product by id' };
    }
  },

  /**
   * Create Product in Supabase adhering to the authoritative live schema:
   * 1. Insert into products (identity & core metadata)
   * 2. Insert into product_variants (physical unit: volume, weight)
   * 3. Insert into product_prices (price record linked to price_lists and product_variants)
   */
  async createProduct(productData: ProductInput): Promise<{ data: Product | null; error: string | null }> {
    try {
      if (!productData.name || !productData.slug) {
        return { data: null, error: 'Product name and slug are required' };
      }

      if (productData.status === 'published') {
        return {
          data: null,
          error: 'Publication prerequisite failed: products cannot be created directly with status "published". Products must be created as draft, have an active primary image in cp-public uploaded and linked, and then published.',
        };
      }

      const cleanSlug = productData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // 1. Insert into products table
      const productRecord = {
        tenant_id: TENANT_ID,
        category_id: productData.category_id || null,
        name: productData.name.trim(),
        slug: cleanSlug,
        sku: productData.sku || `CP-${Date.now().toString().slice(-6)}`,
        brand: productData.brand || 'CP Fruit Splash',
        product_type: 'physical',
        short_description: productData.short_description || null,
        description: productData.description || null,
        status: productData.status || 'draft',
        featured: !!productData.featured,
        seo_title: productData.seo_title || productData.name,
        seo_description: productData.seo_description || productData.short_description || null,
        metadata: productData.metadata || {},
      };

      const { data: createdProduct, error: prodErr } = await supabase
        .from('products')
        .insert(productRecord)
        .select('id')
        .single();

      if (prodErr || !createdProduct) {
        return { data: null, error: prodErr ? getErrMsg(prodErr, 'Failed to create product in Supabase') : 'Failed to create product' };
      }

      const productId = (createdProduct as { id: string }).id;

      // 2. Insert default variant in product_variants
      const volumeMl = productData.volume !== undefined ? Number(productData.volume) : 500;
      const volumeUnit = productData.volume_unit || 'ml';

      const variantRecord = {
        tenant_id: TENANT_ID,
        product_id: productId,
        name: `Standard ${volumeMl}${volumeUnit}`,
        sku: productData.sku ? `${productData.sku}-STD` : `CP-${Date.now().toString().slice(-6)}-STD`,
        volume: volumeMl,
        volume_unit: volumeUnit,
        status: 'active',
        metadata: {},
      };

      const { data: createdVariant, error: varErr } = await supabase
        .from('product_variants')
        .insert(variantRecord)
        .select('id')
        .single();

      if (varErr || !createdVariant) {
        console.error('Failed to create default variant:', varErr);
      } else {
        const variantId = (createdVariant as { id: string }).id;

        // 3. Ensure price list and create price record
        const priceListId = await this.ensureDefaultPriceList();
        const priceAmount = Number(productData.price) || 0;
        const compareAtAmount = productData.compare_at_price ? Number(productData.compare_at_price) : null;

        const priceRecord = {
          tenant_id: TENANT_ID,
          price_list_id: priceListId,
          variant_id: variantId,
          amount: priceAmount,
          compare_at_amount: compareAtAmount,
          status: 'active',
          change_reason: 'Initial creation via CMS',
        };

        const { error: priceErr } = await supabase.from('product_prices').insert(priceRecord);
        if (priceErr) {
          console.error('Failed to create initial price record:', priceErr);
        }
      }

      notifySyncEvent('products', { id: productId }, 'INSERT');

      // Fetch complete enriched product record
      return await this.getProductById(productId);
    } catch (err: unknown) {
      console.error('Exception creating product:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Error creating product' };
    }
  },

  /**
   * Update Product in Supabase
   */
  async updateProduct(id: string, updates: Partial<ProductInput>): Promise<{ data: Product | null; error: string | null }> {
    try {
      if (updates.status === 'published') {
        const validation = await validateProductPublication(id);
        if (!validation.isValid) {
          return {
            data: null,
            error: validation.error || 'Product publication prerequisite failed: primary media image is required',
          };
        }
      }

      const sanitized: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) sanitized.name = updates.name;
      if (updates.slug !== undefined) sanitized.slug = updates.slug;
      if (updates.category_id !== undefined) sanitized.category_id = updates.category_id;
      if (updates.sku !== undefined) sanitized.sku = updates.sku;
      if (updates.brand !== undefined) sanitized.brand = updates.brand;
      if (updates.short_description !== undefined) sanitized.short_description = updates.short_description;
      if (updates.description !== undefined) sanitized.description = updates.description;
      if (updates.status !== undefined) sanitized.status = updates.status;
      if (updates.featured !== undefined) sanitized.featured = updates.featured;
      if (updates.seo_title !== undefined) sanitized.seo_title = updates.seo_title;
      if (updates.seo_description !== undefined) sanitized.seo_description = updates.seo_description;
      if (updates.metadata !== undefined) sanitized.metadata = updates.metadata;

      const { error: updateErr } = await supabase
        .from('products')
        .update(sanitized)
        .eq('id', id)
        .eq('tenant_id', TENANT_ID);

      if (updateErr) {
        return { data: null, error: getErrMsg(updateErr, 'Failed to update product') };
      }

      // If price or volume is provided, update variant and price
      if (updates.price !== undefined || updates.compare_at_price !== undefined) {
        await this.updateProductPrice(
          id,
          updates.price !== undefined ? Number(updates.price) : 0,
          updates.compare_at_price !== undefined ? updates.compare_at_price : null,
          'Price update via CMS'
        );
      }

      if (updates.volume !== undefined) {
        await supabase
          .from('product_variants')
          .update({
            volume: Number(updates.volume),
            volume_unit: updates.volume_unit || 'ml',
            updated_at: new Date().toISOString(),
          })
          .eq('product_id', id)
          .eq('tenant_id', TENANT_ID);
      }

      notifySyncEvent('products', { id }, 'UPDATE');
      return await this.getProductById(id);
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error updating product' };
    }
  },

  /**
   * Dedicated Price Engine mutation (Price is never stored in products)
   * Updates product price through price_lists and product_variants
   */
  async updateProductPrice(
    productId: string,
    amount: number,
    compareAtAmount?: number | null,
    reason?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Find variant for product
      const { data: variants, error: varErr } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productId)
        .eq('tenant_id', TENANT_ID)
        .limit(1);

      if (varErr) {
        return { success: false, error: getErrMsg(varErr, 'Variant lookup failed') };
      }

      let variantId = variants && variants.length > 0 ? (variants[0] as { id: string }).id : null;

      // If no variant exists, create default
      if (!variantId) {
        const { data: newVar, error: newVarErr } = await supabase
          .from('product_variants')
          .insert({
            tenant_id: TENANT_ID,
            product_id: productId,
            name: 'Standard 500ml',
            volume: 500,
            volume_unit: 'ml',
            status: 'active',
            metadata: {},
          })
          .select('id')
          .single();

        if (newVarErr || !newVar) {
          return { success: false, error: getErrMsg(newVarErr, 'Failed to create variant for price') };
        }
        variantId = (newVar as { id: string }).id;
      }

      const priceListId = await this.ensureDefaultPriceList();

      // Check existing price record
      const { data: existingPrices } = await supabase
        .from('product_prices')
        .select('id')
        .eq('variant_id', variantId)
        .eq('price_list_id', priceListId)
        .eq('tenant_id', TENANT_ID)
        .limit(1);

      if (existingPrices && existingPrices.length > 0) {
        const priceId = (existingPrices[0] as { id: string }).id;
        const { error: updateErr } = await supabase
          .from('product_prices')
          .update({
            amount: Number(amount),
            compare_at_amount: compareAtAmount !== undefined ? compareAtAmount : null,
            status: 'active',
            change_reason: reason || 'Price update via CMS Price Engine',
          })
          .eq('id', priceId);

        if (updateErr) {
          return { success: false, error: getErrMsg(updateErr, 'Failed to update price') };
        }
      } else {
        const { error: insertErr } = await supabase
          .from('product_prices')
          .insert({
            tenant_id: TENANT_ID,
            price_list_id: priceListId,
            variant_id: variantId,
            amount: Number(amount),
            compare_at_amount: compareAtAmount !== undefined ? compareAtAmount : null,
            status: 'active',
            change_reason: reason || 'Price creation via CMS Price Engine',
          });

        if (insertErr) {
          return { success: false, error: getErrMsg(insertErr, 'Failed to insert price') };
        }
      }

      notifySyncEvent('product_prices', { productId, amount }, 'UPDATE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Price update failed' };
    }
  },

  /**
   * Change Publish Status (draft -> published -> archived)
   */
  async setProductStatus(id: string, status: ProductStatus): Promise<{ success: boolean; error: string | null }> {
    try {
      if (status === 'published') {
        const validation = await validateProductPublication(id);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error || 'Product publication prerequisite failed: primary media image is required',
          };
        }
      }

      const { error } = await supabase
        .from('products')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', TENANT_ID);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Failed to set status') };
      }

      notifySyncEvent('products', { id, status }, 'UPDATE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Status update failed' };
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1. Delete relations
      await supabase.from('product_media').delete().eq('product_id', id);
      await supabase.from('product_claims').delete().eq('product_id', id).eq('tenant_id', TENANT_ID);

      const { data: variants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', id)
        .eq('tenant_id', TENANT_ID);

      if (variants) {
        for (const v of variants as { id: string }[]) {
          await supabase.from('product_prices').delete().eq('variant_id', v.id);
        }
      }

      await supabase.from('product_variants').delete().eq('product_id', id).eq('tenant_id', TENANT_ID);

      // 2. Delete product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', TENANT_ID);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Failed to delete product') };
      }

      notifySyncEvent('products', { id }, 'DELETE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
    }
  },

  /**
   * Categories
   */
  async getCategories(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('sort_order', { ascending: true });

      if (error || !data) {
        return [];
      }
      return data as ProductCategory[];
    } catch {
      return [];
    }
  },

  async createCategory(category: { name: string; slug: string; description?: string }): Promise<ProductCategory | null> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert({
          tenant_id: TENANT_ID,
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          sort_order: 0,
          status: 'published',
        })
        .select()
        .single();

      if (error || !data) {
        return null;
      }
      notifySyncEvent('product_categories', data, 'INSERT');
      return data as ProductCategory;
    } catch {
      return null;
    }
  },
};
