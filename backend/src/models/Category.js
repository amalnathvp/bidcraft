const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    trim: true
  },
  image: {
    url: String,
    publicId: String,
    alt: String
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  path: {
    type: String,
    default: ''
  },
  subcategories: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true
    },
    description: String,
    icon: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // SEO fields
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  
  // Statistics
  totalAuctions: {
    type: Number,
    default: 0
  },
  activeAuctions: {
    type: Number,
    default: 0
  },
  
  // Custom attributes for this category
  attributes: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'multiselect'],
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [String], // For select/multiselect types
    unit: String, // For number types (e.g., 'cm', 'kg')
    description: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full path
categorySchema.virtual('fullPath').get(function() {
  return this.path ? `${this.path}/${this.slug}` : this.slug;
});

// Virtual for children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

// Virtual for auctions in this category
categorySchema.virtual('auctions', {
  ref: 'Auction',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

// Pre-save middleware to generate slug and path
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    // Generate slug from name
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Ensure slug uniqueness
    const existingCategory = await this.constructor.findOne({ 
      slug: this.slug, 
      _id: { $ne: this._id } 
    });
    
    if (existingCategory) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  
  // Set level and path based on parent
  if (this.parent) {
    const parent = await this.constructor.findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
      this.path = parent.fullPath;
    }
  } else {
    this.level = 0;
    this.path = '';
  }
  
  next();
});

// Pre-save middleware for subcategories
categorySchema.pre('save', function(next) {
  if (this.subcategories && this.subcategories.length > 0) {
    this.subcategories.forEach(sub => {
      if (sub.name && !sub.slug) {
        sub.slug = sub.name
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
      }
    });
  }
  next();
});

// Method to get category hierarchy
categorySchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let current = this;
  
  while (current) {
    hierarchy.unshift({
      _id: current._id,
      name: current.name,
      slug: current.slug
    });
    
    if (current.parent) {
      current = await this.constructor.findById(current.parent);
    } else {
      current = null;
    }
  }
  
  return hierarchy;
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .populate('children');
  
  const tree = [];
  const categoryMap = {};
  
  // Create a map of all categories
  categories.forEach(cat => {
    categoryMap[cat._id] = {
      ...cat.toObject(),
      children: []
    };
  });
  
  // Build the tree structure
  categories.forEach(cat => {
    if (cat.parent) {
      if (categoryMap[cat.parent]) {
        categoryMap[cat.parent].children.push(categoryMap[cat._id]);
      }
    } else {
      tree.push(categoryMap[cat._id]);
    }
  });
  
  return tree;
};

// Indexes for better performance
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ level: 1, sortOrder: 1 });
categorySchema.index({ featured: 1, isActive: 1 });
categorySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Category', categorySchema);
