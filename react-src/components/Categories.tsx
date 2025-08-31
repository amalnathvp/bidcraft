import React from 'react';
import { useCategories } from '../hooks';
import { transformCategoryForDisplay } from '../utils/auctionUtils';

const Categories: React.FC = () => {
  const { categories, loading, error } = useCategories();

  // Debug logging
  console.log('Categories Debug:', { categories, loading, error });

  if (loading) {
    return (
      <section id="categories" className="categories">
        <div className="container">
          <div className="section-header">
            <h2>Browse by Category</h2>
            <p>Explore our diverse collection of handicrafts</p>
          </div>
          <div className="categories-grid">
            {/* Loading skeleton */}
            {[...Array(6)].map((_, index) => (
              <div key={index} className="category-card loading">
                <div className="category-icon skeleton"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="categories" className="categories">
        <div className="container">
          <div className="section-header">
            <h2>Browse by Category</h2>
            <p>Explore our diverse collection of handicrafts</p>
          </div>
          <div className="error-message">
            <p>Failed to load categories: {error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="categories">
      <div className="container">
        <div className="section-header">
          <h2>Browse by Category</h2>
          <p>Explore our diverse collection of handicrafts</p>
        </div>
        <div className="categories-grid">
          {categories
            .filter(category => category.featured && category.isActive)
            .slice(0, 6) // Limit to 6 featured categories for the homepage
            .map((category) => {
              const displayCategory = transformCategoryForDisplay(category);
              return (
                <div key={category._id} className="category-card">
                  <div className="category-icon">
                    <i className={category.icon || 'fas fa-tag'}></i>
                  </div>
                  <h3>{category.name}</h3>
                  <p>{category.description || 'Explore beautiful handcrafted items'}</p>
                  <span className="item-count">{displayCategory.itemCount}+ items</span>
                </div>
              );
            })}
          
          {/* Show message if no featured categories */}
          {categories.filter(cat => cat.featured && cat.isActive).length === 0 && (
            <div className="no-categories">
              <p>No featured categories available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;
