import { supabase } from '../lib/supabase';
import { Product, ProductMedia, ProductClaim, ProductPrice, ProductStatus } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const productsService = {
  /**
   * Public Product Catalog query
   * Only returns published products with verified claims and active media
   */
  async getPublishedProducts(): Promise<{ data: Product[]; error: string | null }> {
    try {
      const { data: rawProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (prodErr || !rawProducts) {
        return { data: [], error: prodErr ? getErrMsg(prodErr, 'Failed to fetch products') : 'Failed to fetch products' };
      }

      const products = await Promise.all(
        (rawProducts as Product[]).map(async (prod) => {
          return await this.enrichProductRelations(prod, true);
        })
      );

      return { data: products, error: null };
    } catch (err: unknown) {
      return { data: [], error: err instanceof Error ? err.message : 'Unknown product error' };
    }
  },

  /**
   * Admin Product Catalog query
   * Returns all products (draft, published, archived)
   */
  async getAllProducts(): Promise<{ data: Product[]; error: string | null }> {
    try {
      const { data: rawProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodErr || !rawProducts) {
        return { data: [], error: prodErr ? getErrMsg(prodErr, 'Failed to fetch admin products') : 'Failed to fetch admin products' };
      }

      const products = await Promise.all(
        (rawProducts as Product[]).map(async (prod) => {
          return await this.enrichProductRelations(prod, false);
        })
      );

      return { data: products, error: null };
    } catch (err: unknown) {
      return { data: [], error: err instanceof Error ? err.message : 'Unknown admin product error' };
    }
  },

  /**
   * Resolve single product by slug (Authoritative flow: /products/:slug -> Supabase -> product record)
   */
  async getProductBySlug(slug: string, publicOnly = true): Promise<{ data: Product | null; error: string | null }> {
    try {
      let query = supabase.from('products').select('*').eq('slug', slug);
      if (publicOnly) {
        query = query.eq('status', 'published');
      }

      const { data: rawProduct, error } = await query.single();
      if (error || !rawProduct) {
        return { data: null, error: error ? getErrMsg(error, 'Product not found') : 'Product not found' };
      }

      const enriched = await this.enrichProductRelations(rawProduct as Product, publicOnly);
      return { data: enriched, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Unknown slug query error' };
    }
  },

  /**
   * Resolve single product by ID
   */
  async getProductById(id: string): Promise<{ data: Product | null; error: string | null }> {
    try {
      const { data: rawProduct, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error || !rawProduct) {
        return { data: null, error: error ? getErrMsg(error, 'Product not found') : 'Product not found' };
      }
      const enriched = await this.enrichProductRelations(rawProduct as Product, false);
      return { data: enriched, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error resolving product by id' };
    }
  },

  /**
   * Create Product in Supabase
   */
  async createProduct(productData: Partial<Product>): Promise<{ data: Product | null; error: string | null }> {
    try {
      if (!productData.name || !productData.slug || productData.base_price === undefined) {
        return { data: null, error: 'Product name, slug, and base price are required' };
      }

      const record: Partial<Product> = {
        name: productData.name,
        slug: productData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sku: productData.sku || `CP-${Date.now().toString().slice(-6)}`,
        short_description: productData.short_description || '',
        description: productData.description || '',
        status: productData.status || 'draft',
        featured: !!productData.featured,
        currency: productData.currency || 'NGN',
        base_price: Number(productData.base_price),
        sale_price: productData.sale_price ? Number(productData.sale_price) : null,
        sale_start: productData.sale_start || null,
        sale_end: productData.sale_end || null,
        availability_status: productData.availability_status || 'in_stock',
        volume_ml: productData.volume_ml || 500,
        seo_title: productData.seo_title || productData.name,
        seo_description: productData.seo_description || productData.short_description,
        og_image: productData.og_image || null,
        whatsapp_order_number: productData.whatsapp_order_number || '2348127700724',
      };

      const { data, error } = await supabase.from('products').insert(record);
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to create product in Supabase') : 'Failed to create product in Supabase' };
      }

      const created = Array.isArray(data) ? (data[0] as Product) : (data as Product);

      // Record initial price history
      await supabase.from('product_prices').insert({
        product_id: created.id,
        base_price: created.base_price,
        sale_price: created.sale_price,
        currency: created.currency,
        reason: 'Initial creation',
      });

      return { data: created, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error creating product' };
    }
  },

  /**
   * Update Product in Supabase
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<{ data: Product | null; error: string | null }> {
    try {
      const sanitized: Record<string, unknown> = { ...updates };
      // Remove joined properties before writing
      delete sanitized.media;
      delete sanitized.claims;
      delete sanitized.price_history;

      const { data, error } = await supabase
        .from('products')
        .update(sanitized)
        .eq('id', id);

      if (error) {
        return { data: null, error: getErrMsg(error, 'Failed to update product') };
      }

      const updated = Array.isArray(data) ? (data[0] as Product) : (data as Product);
      return { data: updated, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error updating product' };
    }
  },

  /**
   * Dedicated Price Engine mutation (Price is never hardcoded)
   * Updates product price and logs to product_prices audit table
   */
  async updateProductPrice(
    productId: string,
    basePrice: number,
    salePrice?: number | null,
    reason?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error: prodErr } = await supabase
        .from('products')
        .update({
          base_price: basePrice,
          sale_price: salePrice !== undefined ? salePrice : null,
        })
        .eq('id', productId);

      if (prodErr) {
        return { success: false, error: getErrMsg(prodErr, 'Failed to update price') };
      }

      // Log to price history table
      await supabase.from('product_prices').insert({
        product_id: productId,
        base_price: basePrice,
        sale_price: salePrice !== undefined ? salePrice : null,
        reason: reason || 'Price update via CMS Price Engine',
      });

      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Price update failed' };
    }
  },

  /**
   * Change Publish Status (draft -> published -> archived)
   */
  async setProductStatus(id: string, status: ProductStatus): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('products').update({ status }).eq('id', id);
    if (error) {
      return { success: false, error: getErrMsg(error, 'Failed to set status') };
    }
    return { success: true, error: null };
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      return { success: false, error: getErrMsg(error, 'Failed to delete product') };
    }
    return { success: true, error: null };
  },

  /**
   * Helper: Enrich product with relations (Media, Claims, Prices)
   */
  async enrichProductRelations(product: Product, publicOnly = false): Promise<Product> {
    try {
      // 1. Fetch Media
      const { data: media } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', product.id)
        .order('sort_order', { ascending: true });

      // 2. Fetch Claims (HOEOS Rule: public users ONLY see verified claims)
      let claimsQuery = supabase.from('product_claims').select('*').eq('product_id', product.id);
      if (publicOnly) {
        claimsQuery = claimsQuery.eq('status', 'verified');
      }
      const { data: claims } = await claimsQuery;

      // 3. Fetch Price History
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      return {
        ...product,
        media: (media as ProductMedia[]) || [],
        claims: (claims as ProductClaim[]) || [],
        price_history: (prices as ProductPrice[]) || [],
      };
    } catch {
      return product;
    }
  }
};
