/**
 * Custom hooks for fetching and managing category data
 * Provides state management and error handling for category operations
 */

import { useState, useEffect } from 'react';
import { Category } from '../types';
import { categoryService } from '../services/categoryService';

// Hook for fetching all categories
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await categoryService.getCategories();
        setCategories(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error, refetch: () => window.location.reload() };
};

// Hook for fetching category tree (hierarchical structure)
export const useCategoryTree = () => {
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryTree = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await categoryService.getCategoryTree();
        setCategoryTree(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category tree');
        console.error('Error fetching category tree:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryTree();
  }, []);

  return { categoryTree, loading, error, refetch: () => window.location.reload() };
};

// Hook for fetching a single category
export const useCategory = (id: string | null) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setCategory(null);
      setLoading(false);
      return;
    }

    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await categoryService.getCategory(id);
        setCategory(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category');
        console.error('Error fetching category:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  return { category, loading, error, refetch: () => id && window.location.reload() };
};

// Hook for fetching category by slug
export const useCategoryBySlug = (slug: string | null) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setCategory(null);
      setLoading(false);
      return;
    }

    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await categoryService.getCategoryBySlug(slug);
        setCategory(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category');
        console.error('Error fetching category:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  return { category, loading, error, refetch: () => slug && window.location.reload() };
};
