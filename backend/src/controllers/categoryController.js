const Category = require('../models/Category');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true })
    .select('name slug description icon image featured sortOrder subcategories')
    .sort({ featured: -1, sortOrder: 1, name: 1 });
  
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get category tree structure
// @route   GET /api/categories/tree
// @access  Public
const getCategoryTree = asyncHandler(async (req, res, next) => {
  const categoryTree = await Category.getCategoryTree();
  
  res.status(200).json({
    success: true,
    data: categoryTree
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('children')
    .populate('parent', 'name slug');
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  // Get category hierarchy
  const hierarchy = await category.getHierarchy();
  
  res.status(200).json({
    success: true,
    data: {
      ...category.toObject(),
      hierarchy
    }
  });
});

// @desc    Get category by slug
// @route   GET /api/categories/:slug/by-slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate('children')
    .populate('parent', 'name slug');
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  // Get category hierarchy
  const hierarchy = await category.getHierarchy();
  
  res.status(200).json({
    success: true,
    data: {
      ...category.toObject(),
      hierarchy
    }
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin only)
const createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);
  
  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  // Check if category has children
  const hasChildren = await Category.findOne({ parent: category._id });
  if (hasChildren) {
    return next(new AppError('Cannot delete category with subcategories', 400));
  }
  
  // Check if category has active auctions
  const Auction = require('../models/Auction');
  const hasActiveAuctions = await Auction.findOne({ 
    category: category._id, 
    status: { $in: ['active', 'scheduled'] } 
  });
  
  if (hasActiveAuctions) {
    return next(new AppError('Cannot delete category with active auctions', 400));
  }
  
  await category.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

module.exports = {
  getCategories,
  getCategoryTree,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};
