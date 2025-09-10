import React from 'react';
import { Category } from '../types';

interface CategoriesProps {
  onNavigate?: (page: string, data?: any) => void;
}

const Categories: React.FC<CategoriesProps> = ({ onNavigate }) => {
  const categories: Category[] = [
    {
      id: 'pottery',
      name: 'Pottery & Ceramics',
      description: 'Handcrafted bowls, vases, and decorative pieces',
      itemCount: 450,
      icon: 'fas fa-palette'
    },
    {
      id: 'textiles',
      name: 'Textiles & Fabrics',
      description: 'Traditional weaving, embroidery, and tapestries',
      itemCount: 320,
      icon: 'fas fa-cut'
    },
    {
      id: 'woodwork',
      name: 'Wood Crafts',
      description: 'Carved sculptures, furniture, and decorative items',
      itemCount: 280,
      icon: 'fas fa-tree'
    },
    {
      id: 'jewelry',
      name: 'Jewelry & Accessories',
      description: 'Handmade jewelry and personal accessories',
      itemCount: 190,
      icon: 'fas fa-gem'
    },
    {
      id: 'metalwork',
      name: 'Metal Works',
      description: 'Forged items, sculptures, and decorative pieces',
      itemCount: 150,
      icon: 'fas fa-hammer'
    },
    {
      id: 'paintings',
      name: 'Art & Paintings',
      description: 'Original artworks and traditional paintings',
      itemCount: 220,
      icon: 'fas fa-brush'
    }
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (onNavigate) {
      console.log('🏷️ Category clicked:', categoryId);
      onNavigate('live-auctions', { selectedCategory: categoryId });
    }
  };

  return (
    <section id="categories" className="categories">
      <div className="container">
        <div className="section-header">
          <h2>Browse by Category</h2>
          <p>Explore our diverse collection of handicrafts</p>
        </div>
        <div className="categories-grid">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="category-card"
              onClick={() => handleCategoryClick(category.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="category-icon">
                <i className={category.icon}></i>
              </div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span className="item-count">{category.itemCount}+ items</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
