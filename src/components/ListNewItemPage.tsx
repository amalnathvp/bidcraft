import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auctionService } from '../services/auctionService';
import { categoryService } from '../services/categoryService';

interface ListNewItemPageProps {
  onNavigate: (page: string) => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  startingPrice: number;
  reservePrice: number;
  buyNowPrice: number;
  condition: string;
  materials: string[];
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
    unit: string;
  };
  origin: {
    country: string;
    region: string;
    artisan: string;
  };
  tags: string[];
  startTime: string;
  duration: number;
  shipping: {
    method: string;
    cost: number;
    freeShipping: boolean;
    international: boolean;
    handlingTime: number;
  };
  paymentMethods: string[];
  autoExtend: {
    enabled: boolean;
    timeThreshold: number;
    extensionTime: number;
  };
}

const ListNewItemPage: React.FC<ListNewItemPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    startingPrice: 0,
    reservePrice: 0,
    buyNowPrice: 0,
    condition: 'good',
    materials: [],
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      unit: 'cm'
    },
    origin: {
      country: '',
      region: '',
      artisan: ''
    },
    tags: [],
    startTime: '',
    duration: 7, // 7 days default
    shipping: {
      method: 'standard',
      cost: 0,
      freeShipping: false,
      international: false,
      handlingTime: 1
    },
    paymentMethods: ['credit_card'],
    autoExtend: {
      enabled: false,
      timeThreshold: 5,
      extensionTime: 10
    }
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentMaterial, setCurrentMaterial] = useState('');
  const [currentTag, setCurrentTag] = useState('');

  // Redirect if not authenticated or not a seller
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    // Allow users with seller role or accountType
    if (user && user.role !== 'seller' && user.role !== 'admin') {
      onNavigate('sellers');
      return;
    }
  }, [isAuthenticated, user, onNavigate]);

  // Load categories from the backend API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories from API...');
        const response = await categoryService.getCategories();
        console.log('Categories response:', response);
        
        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          console.error('Failed to load categories:', response.message);
          // Fallback to default categories if API fails
          const defaultCategories = [
            { _id: '1', name: 'Textiles & Fabrics' },
            { _id: '2', name: 'Pottery & Ceramics' },
            { _id: '3', name: 'Jewelry & Accessories' },
            { _id: '4', name: 'Woodwork & Carving' },
            { _id: '5', name: 'Basketry & Weaving' },
            { _id: '6', name: 'Metalwork' },
            { _id: '7', name: 'Paper & Books' },
            { _id: '8', name: 'Glass & Crystal' }
          ];
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to default categories if API fails
        const defaultCategories = [
          { _id: '1', name: 'Textiles & Fabrics' },
          { _id: '2', name: 'Pottery & Ceramics' },
          { _id: '3', name: 'Jewelry & Accessories' },
          { _id: '4', name: 'Woodwork & Carving' },
          { _id: '5', name: 'Basketry & Weaving' },
          { _id: '6', name: 'Metalwork' },
          { _id: '7', name: 'Paper & Books' },
          { _id: '8', name: 'Glass & Crystal' }
        ];
        setCategories(defaultCategories);
      }
    };
    
    fetchCategories();
  }, []);

  // Set default start time to current time + 1 hour
  useEffect(() => {
    const defaultStartTime = new Date();
    defaultStartTime.setHours(defaultStartTime.getHours() + 1);
    setFormData(prev => ({
      ...prev,
      startTime: defaultStartTime.toISOString().slice(0, 16) // Format for datetime-local input
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;

    if (name.includes('.')) {
      // Handle nested objects
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      setErrors(prev => ({ ...prev, images: 'Maximum 10 images allowed' }));
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        setErrors(prev => ({ ...prev, images: 'Only JPEG, PNG, and WebP images are allowed' }));
        return false;
      }
      if (!isValidSize) {
        setErrors(prev => ({ ...prev, images: 'Each image must be under 5MB' }));
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setImages(prev => [...prev, ...validFiles]);
      
      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    if (currentMaterial.trim() && !formData.materials.includes(currentMaterial.trim())) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, currentMaterial.trim()]
      }));
      setCurrentMaterial('');
    }
  };

  const removeMaterial = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m !== material)
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim().toLowerCase()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: checked 
        ? [...prev.paymentMethods, method]
        : prev.paymentMethods.filter(m => m !== method)
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.startingPrice <= 0) newErrors.startingPrice = 'Starting price must be greater than 0';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (images.length === 0) newErrors.images = 'At least one image is required';
    if (formData.paymentMethods.length === 0) newErrors.paymentMethods = 'At least one payment method is required';

    const startTime = new Date(formData.startTime);
    if (startTime <= new Date()) {
      newErrors.startTime = 'Start time must be in the future';
    }

    if (formData.reservePrice > 0 && formData.reservePrice < formData.startingPrice) {
      newErrors.reservePrice = 'Reserve price must be greater than or equal to starting price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      console.log('Creating auction with data:', formData);
      
      // Create FormData for API submission
      const auctionFormData = new FormData();
      
      // Add basic auction data
      auctionFormData.append('title', formData.title);
      auctionFormData.append('description', formData.description);
      auctionFormData.append('category', formData.category);
      auctionFormData.append('subcategory', formData.subcategory);
      auctionFormData.append('startingPrice', formData.startingPrice.toString());
      auctionFormData.append('condition', formData.condition);
      
      // Add optional fields if they have values
      if (formData.reservePrice > 0) {
        auctionFormData.append('reservePrice', formData.reservePrice.toString());
      }
      if (formData.buyNowPrice > 0) {
        auctionFormData.append('buyNowPrice', formData.buyNowPrice.toString());
      }
      
      // Add timing information
      auctionFormData.append('startTime', formData.startTime);
      auctionFormData.append('duration', formData.duration.toString());
      
      // Add materials as comma-separated string
      if (formData.materials.length > 0) {
        auctionFormData.append('materials', formData.materials.join(','));
      }
      
      // Add tags as comma-separated string
      if (formData.tags.length > 0) {
        auctionFormData.append('tags', formData.tags.join(','));
      }
      
      // Add payment methods
      auctionFormData.append('paymentMethods', JSON.stringify(formData.paymentMethods));
      
      // Add shipping information
      auctionFormData.append('shippingMethod', formData.shipping.method);
      auctionFormData.append('shippingCost', formData.shipping.cost.toString());
      auctionFormData.append('freeShipping', formData.shipping.freeShipping.toString());
      
      // Add origin information
      if (formData.origin.country) {
        auctionFormData.append('originCountry', formData.origin.country);
      }
      if (formData.origin.region) {
        auctionFormData.append('originRegion', formData.origin.region);
      }
      if (formData.origin.artisan) {
        auctionFormData.append('artisan', formData.origin.artisan);
      }
      
      // Add images
      images.forEach((image, index) => {
        auctionFormData.append('images', image);
      });
      
      console.log('FormData prepared, calling API...');
      
      // Call the auction service to create the auction
      const response = await auctionService.createAuction(auctionFormData);
      
      console.log('Auction created successfully:', response);
      
      if (response.success) {
        alert(`Auction "${formData.title}" created successfully! Your auction is now live.`);
        onNavigate('seller-dashboard');
      } else {
        throw new Error(response.message || 'Failed to create auction');
      }
      
    } catch (error: any) {
      console.error('Error creating auction:', error);
      setErrors({ submit: error.message || 'An error occurred while creating the auction' });
    } finally {
      setLoading(false);
    }
  };

  const conditionOptions = [
    { value: 'new', label: 'New - Never used, in perfect condition' },
    { value: 'like-new', label: 'Like New - Barely used, excellent condition' },
    { value: 'good', label: 'Good - Used with minor signs of wear' },
    { value: 'fair', label: 'Fair - Used with noticeable wear' },
    { value: 'poor', label: 'Poor - Heavily used or damaged' }
  ];

  const shippingMethods = [
    { value: 'standard', label: 'Standard Shipping' },
    { value: 'express', label: 'Express Shipping' },
    { value: 'overnight', label: 'Overnight Shipping' },
    { value: 'pickup', label: 'Local Pickup Only' }
  ];

  const paymentMethodOptions = [
    { value: 'credit_card', label: 'Credit/Debit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'crypto', label: 'Cryptocurrency' }
  ];

  if (!isAuthenticated || !user) {
    return <div>Please log in to list an item.</div>;
  }

  return (
    <div className="list-item-page">
      <div className="container">
        <div className="page-header">
          <h1>List New Handicraft Item</h1>
          <p>Create a detailed listing for your handcrafted item</p>
        </div>

        <form onSubmit={handleSubmit} className="auction-form">
          {errors.submit && (
            <div className="error-message general-error">
              {errors.submit}
            </div>
          )}

          {/* Basic Information */}
          <section className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={errors.title ? 'error' : ''}
                placeholder="Enter a descriptive title for your item"
                maxLength={200}
                required
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
              <small>{formData.title.length}/200 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={errors.description ? 'error' : ''}
                placeholder="Provide a detailed description of your item, including its history, craftsmanship, and unique features"
                maxLength={2000}
                rows={6}
                required
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
              <small>{formData.description.length}/2000 characters</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={errors.category ? 'error' : ''}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="subcategory">Subcategory</label>
                <input
                  type="text"
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  placeholder="e.g., Pottery, Jewelry, Textiles"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={errors.condition ? 'error' : ''}
                required
              >
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.condition && <span className="error-message">{errors.condition}</span>}
            </div>
          </section>

          {/* Images */}
          <section className="form-section">
            <h2>Images *</h2>
            <p>Upload high-quality images of your item (Maximum 10 images, 5MB each)</p>
            
            <div className="form-group">
              <input
                type="file"
                id="images"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className={errors.images ? 'error' : ''}
              />
              {errors.images && <span className="error-message">{errors.images}</span>}
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pricing */}
          <section className="form-section">
            <h2>Pricing</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startingPrice">Starting Price * ($)</label>
                <input
                  type="number"
                  id="startingPrice"
                  name="startingPrice"
                  value={formData.startingPrice}
                  onChange={handleInputChange}
                  className={errors.startingPrice ? 'error' : ''}
                  min="0.01"
                  step="0.01"
                  required
                />
                {errors.startingPrice && <span className="error-message">{errors.startingPrice}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="reservePrice">Reserve Price ($)</label>
                <input
                  type="number"
                  id="reservePrice"
                  name="reservePrice"
                  value={formData.reservePrice}
                  onChange={handleInputChange}
                  className={errors.reservePrice ? 'error' : ''}
                  min="0"
                  step="0.01"
                  placeholder="Minimum price to sell (optional)"
                />
                {errors.reservePrice && <span className="error-message">{errors.reservePrice}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="buyNowPrice">Buy Now Price ($)</label>
                <input
                  type="number"
                  id="buyNowPrice"
                  name="buyNowPrice"
                  value={formData.buyNowPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="Instant purchase price (optional)"
                />
              </div>
            </div>
          </section>

          {/* Materials and Tags */}
          <section className="form-section">
            <h2>Item Details</h2>
            
            <div className="form-group">
              <label>Materials Used</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={currentMaterial}
                  onChange={(e) => setCurrentMaterial(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                  placeholder="Add material and press Enter"
                />
                <button type="button" onClick={addMaterial} className="btn-add">
                  Add
                </button>
              </div>
              <div className="tags-display">
                {formData.materials.map(material => (
                  <span key={material} className="tag">
                    {material}
                    <button type="button" onClick={() => removeMaterial(material)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add search tags and press Enter"
                />
                <button type="button" onClick={addTag} className="btn-add">
                  Add
                </button>
              </div>
              <div className="tags-display">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Auction Timing */}
          <section className="form-section">
            <h2>Auction Timing</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={errors.startTime ? 'error' : ''}
                  required
                />
                {errors.startTime && <span className="error-message">{errors.startTime}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (days)</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                  <option value={10}>10 days</option>
                  <option value={14}>14 days</option>
                </select>
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="form-section">
            <h2>Payment Methods *</h2>
            
            <div className="payment-methods">
              {paymentMethodOptions.map(method => (
                <label key={method.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.includes(method.value)}
                    onChange={(e) => handlePaymentMethodChange(method.value, e.target.checked)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
            {errors.paymentMethods && <span className="error-message">{errors.paymentMethods}</span>}
          </section>

          {/* Submit */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => onNavigate('seller-dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating Auction...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListNewItemPage;