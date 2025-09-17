# Server Setup Instructions

## Environment Configuration

The server requires several environment variables to be configured in the `.env` file:

### Required for Email Functionality
- **RESEND_API_KEY**: Get your API key from [Resend](https://resend.com/api-keys)
  - Sign up at https://resend.com
  - Go to API Keys section
  - Create a new API key
  - Replace the placeholder in `.env` with your actual key

### Required for File Uploads
- **CLOUDINARY_CLOUD_NAME**: Your Cloudinary cloud name
- **CLOUDINARY_API_KEY**: Your Cloudinary API key  
- **CLOUDINARY_API_SECRET**: Your Cloudinary API secret

To get these values:
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to your Dashboard
3. Copy the Cloud Name, API Key, and API Secret
4. Replace the placeholders in `.env` with your actual values

**Note**: `CLOUDINARY_URL` is not needed when using individual configuration parameters.

### Other Configuration
- **MONGO_URL**: MongoDB connection string
- **JWT_SECRET**: Secret key for JWT tokens (change in production)
- **PORT**: Server port (default: 3000)
- **ORIGIN**: Frontend URL for CORS (default: http://localhost:5173)

## Notes
- The application will still run without proper email configuration, but email functionality will be disabled
- Make sure to keep your `.env` file secure and never commit it to version control