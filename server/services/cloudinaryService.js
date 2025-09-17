import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    return CLOUDINARY_CLOUD_NAME && 
           CLOUDINARY_API_KEY && 
           CLOUDINARY_API_SECRET &&
           CLOUDINARY_CLOUD_NAME !== 'your-cloudinary-cloud-name' &&
           CLOUDINARY_API_KEY !== 'your-cloudinary-api-key' &&
           CLOUDINARY_API_SECRET !== 'your-cloudinary-api-secret';
};

if (isCloudinaryConfigured()) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('Cloudinary configured successfully');
} else {
    console.warn('Warning: Cloudinary is not properly configured. Image upload functionality will be disabled.');
}

const uploadImage = async (file) => {
    try {
        // Check if Cloudinary is configured before attempting upload
        if (!isCloudinaryConfigured()) {
            throw new Error('Cloudinary is not properly configured. Please set up your Cloudinary credentials in the .env file.');
        }
        
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'auctions',
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error.message);
        throw new Error('Error uploading image to Cloudinary: ' + error.message);
    }
};

export default uploadImage;   