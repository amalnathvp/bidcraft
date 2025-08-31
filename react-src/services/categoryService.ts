/**
 * API service functions for category-related operations
 * Handles category retrieval and management functionality
 */

import { api } from './api';
import { Category } from '../types';

// Response interfaces for category API endpoints
interface CategoryResponse {
  success: boolean;
  data: Category;
  message?: string;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
  message?: string;
}

interface CategoryTreeResponse {
  success: boolean;
  data: Category[];
  message?: string;
}

export const categoryService = {
  /**
   * Get all categories
   */
  getCategories: async (): Promise<CategoriesResponse> => {
    return api.get<CategoriesResponse>('/categories');
  },

  /**
   * Get category tree structure (hierarchical categories)
   */
  getCategoryTree: async (): Promise<CategoryTreeResponse> => {
    return api.get<CategoryTreeResponse>('/categories/tree');
  },

  /**
   * Get a single category by ID
   */
  getCategory: async (id: string): Promise<CategoryResponse> => {
    return api.get<CategoryResponse>(`/categories/${id}`);
  },

  /**
   * Get a category by slug
   */
  getCategoryBySlug: async (slug: string): Promise<CategoryResponse> => {
    return api.get<CategoryResponse>(`/categories/${slug}/by-slug`);
  },

  /**
   * Create a new category (admin only)
   */
  createCategory: async (categoryData: Partial<Category>): Promise<CategoryResponse> => {
    return api.post<CategoryResponse>('/categories', categoryData, true);
  },

  /**
   * Update an existing category (admin only)
   */
  updateCategory: async (id: string, categoryData: Partial<Category>): Promise<CategoryResponse> => {
    return api.put<CategoryResponse>(`/categories/${id}`, categoryData, true);
  },

  /**
   * Delete a category (admin only)
   */
  deleteCategory: async (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete<{ success: boolean; message: string }>(`/categories/${id}`, true);
  }
};
