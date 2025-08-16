const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files per upload
  }
});

// @desc    Upload images
// @route   POST /api/upload/images
// @access  Private
const uploadImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded', 400));
  }

  const uploadPromises = req.files.map(file => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bidcraft/auctions',
          transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  });

  try {
    const uploadResults = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploadResults
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return next(new AppError('Error uploading images to cloud storage', 500));
  }
});

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bidcraft/avatars',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return next(new AppError('Error uploading avatar', 500));
  }
});

// @desc    Delete image
// @route   DELETE /api/upload/images/:publicId
// @access  Private
const deleteImage = asyncHandler(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new AppError('Public ID is required', 400));
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      return next(new AppError('Failed to delete image', 400));
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    return next(new AppError('Error deleting image', 500));
  }
});

// Routes
router.post('/images', protect, upload.array('images', 10), uploadImages);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/images/:publicId', protect, deleteImage);

module.exports = router;
