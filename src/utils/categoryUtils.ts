/**
 * Utility functions for handling category data from the database
 */

// Type definition for category data that can come from database
export type CategoryData = string | { 
  _id?: string; 
  name?: string; 
  slug?: string; 
  fullPath?: string; 
  id?: string; 
} | null | undefined;

/**
 * Safely extracts the category name from category data
 * Handles both string categories and category objects from database
 */
export const getCategoryName = (category: CategoryData): string => {
  if (typeof category === 'string') {
    return category;
  }
  if (category && typeof category === 'object' && 'name' in category && category.name) {
    return category.name;
  }
  return 'Uncategorized';
};

/**
 * Gets the category ID from category data
 */
export const getCategoryId = (category: CategoryData): string | null => {
  if (category && typeof category === 'object') {
    return category.id || category._id || null;
  }
  return null;
};

/**
 * Gets the category slug from category data
 */
export const getCategorySlug = (category: CategoryData): string | null => {
  if (category && typeof category === 'object' && 'slug' in category) {
    return category.slug || null;
  }
  return null;
};
