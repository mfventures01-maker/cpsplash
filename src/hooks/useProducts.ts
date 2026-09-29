import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types/database.types';
import { productsService } from '../services/productsService';
import { subscribeToSync } from '../lib/supabase';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await productsService.getPublishedProducts();
    if (err) {
      setError(err);
    } else {
      setProducts(data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    // Real-time synchronization subscription
    const unsubscribe = subscribeToSync((event) => {
      if (['products', 'product_media', 'product_claims', 'product_prices', '*'].includes(event.table)) {
        fetchProducts();
      }
    });
    return unsubscribe;
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useProduct(slug: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await productsService.getProductBySlug(slug, true);
    if (err) {
      setError(err);
      setProduct(null);
    } else {
      setProduct(data);
      setError(null);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchProduct();
    const unsubscribe = subscribeToSync((event) => {
      if (['products', 'product_media', 'product_claims', 'product_prices', '*'].includes(event.table)) {
        fetchProduct();
      }
    });
    return unsubscribe;
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}
