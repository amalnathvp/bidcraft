import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { categoryService } from '../services/categoryService';

interface AdminCategoryManagementProps {
  onNavigate: (page: string, data?: any) => void;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  featured: boolean;
  itemCount: number;
  createdAt: string;
}

const AdminCategoryManagement: React.FC<AdminCategoryManagementProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    featured: false
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Loading categories for admin...');
        const response = await categoryService.getCategories();
        console.log('Admin categories response:', response);
        
        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          console.error('Failed to load categories:', response.message);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Mock data fallback
        const mockCategories: Category[] = [
          {
            _id: '1',
            name: 'Pottery & Ceramics',
            slug: 'pottery-ceramics',
            description: 'Handcrafted pottery and ceramic items',
            featured: true,
            itemCount: 145,
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            _id: '2',
            name: 'Textiles & Fabrics',
            slug: 'textiles-fabrics',
            description: 'Traditional textiles and fabric crafts',
            featured: true,
            itemCount: 98,
            createdAt: '2024-01-15T10:00:00Z'
          }
        ];
        setCategories(mockCategories);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      loadCategories();
    }
  }, [user]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        const response = await categoryService.updateCategory(editingCategory._id, formData);
        if (response.success) {
          setCategories(categories.map(cat => 
            cat._id === editingCategory._id 
              ? { ...cat, ...formData, slug: formData.name.toLowerCase().replace(/\s+/g, '-') }
              : cat
          ));
          alert('Category updated successfully!');
        }
      } else {
        // Create new category
        const response = await categoryService.createCategory(formData);
        if (response.success) {
          const newCategory = {
            ...response.data,
            itemCount: 0,
            createdAt: new Date().toISOString()
          };
          setCategories([...categories, newCategory]);
          alert('Category created successfully!');
        }
      }
      
      // Reset form
      setFormData({ name: '', description: '', featured: false });
      setShowCreateModal(false);
      setEditingCategory(null);
      
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(error.message || 'Failed to save category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      featured: category.featured
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await categoryService.deleteCategory(categoryId);
      setCategories(categories.filter(cat => cat._id !== categoryId));
      alert('Category deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.message || 'Failed to delete category. Please try again.');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', featured: false });
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return (
      <div className="admin-categories loading">
        <div className="container">
          <h1>Loading Categories...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <button 
            className="back-button"
            onClick={() => onNavigate('admin-dashboard')}
          >
            ← Back to Dashboard
          </button>
          <div className="header-content">
            <div>
              <h1>Category Management</h1>
              <p>Organize and manage all categories on the platform</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Add New Category
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="categories-grid">
          {categories.map(category => (
            <div key={category._id} className="category-card">
              <div className="category-header">
                <h3>
                  {category.name}
                  {category.featured && <span className="featured-badge">⭐</span>}
                </h3>
                <div className="category-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(category._id, category.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className="category-description">{category.description}</p>
              
              <div className="category-stats">
                <div className="stat">
                  <span className="count">{category.itemCount}</span>
                  <span className="label">Items</span>
                </div>
                <div className="stat">
                  <span className="date">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="no-results">
            <h3>No categories found</h3>
            <p>Start by creating your first category.</p>
          </div>
        )}

        {/* Create/Edit Category Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
                <button className="close-button" onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Category Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Pottery & Ceramics"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Describe what types of items belong to this category"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    Feature this category on homepage
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategoryManagement;
