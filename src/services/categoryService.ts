/**
 * API service functions for category-related operations
 * Handles category retrieval and management functionality
 */

import { apiService } from './api';

export const categoryService = {
  /**
   * Get all categories
   */
  getCategories: async () => {
    return apiService.get('/categories');
  },

  /**
   * Get a single category by ID
   */
  getCategory: async (id: string) => {
    return apiService.get(`/categories/${id}`);
  },

  /**
   * Create a new category (admin only)
   */
  createCategory: async (categoryData: any) => {
    return apiService.post('/categories', categoryData);
  },

  /**
   * Update an existing category (admin only)
   */
  updateCategory: async (id: string, categoryData: any) => {
    return apiService.put(`/categories/${id}`, categoryData);
  },

  /**
   * Delete a category (admin only)
   */
  deleteCategory: async (id: string) => {
    return apiService.delete(`/categories/${id}`);
  }
};
