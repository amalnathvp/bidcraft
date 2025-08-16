# BidCraft Backend API

A comprehensive Node.js backend for the BidCraft handicraft auction platform.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Seller, Buyer)
  - Email verification
  - Password reset functionality

- **Auction Management**
  - Create, update, delete auctions
  - Real-time bidding with Socket.io
  - Automatic auction status updates
  - Featured auctions and categories
  - Search and filtering capabilities

- **Bidding System**
  - Manual and automatic bidding
  - Buy-now options
  - Bid validation and fraud prevention
  - Real-time bid updates

- **File Upload**
  - Cloudinary integration for image storage
  - Image optimization and transformation
  - Multiple file upload support

- **Email Notifications**
  - Welcome emails
  - Auction updates
  - Bidding notifications
  - Password reset emails

- **Real-time Features**
  - Socket.io for live auction updates
  - Real-time bid notifications
  - Auction ending alerts

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Express-validator

## Project Structure

```
backend/
├── src/
│   ├── models/          # Database models
│   │   ├── User.js
│   │   ├── Auction.js
│   │   ├── Bid.js
│   │   └── Category.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── auctions.js
│   │   ├── bids.js
│   │   ├── users.js
│   │   ├── categories.js
│   │   └── upload.js
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── auctionController.js
│   │   ├── bidController.js
│   │   ├── userController.js
│   │   └── categoryController.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   └── utils/           # Utility functions
│       ├── sendEmail.js
│       ├── scheduler.js
│       └── seeder.js
├── server.js            # Main server file
├── package.json
├── .env.example
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   cd bidcraft/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/bidcraft
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:3000
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Email configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Database Setup**
   Make sure MongoDB is running, then seed the database:
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email

### Auctions
- `GET /api/auctions` - Get all auctions with filtering
- `GET /api/auctions/:id` - Get single auction
- `POST /api/auctions` - Create new auction (Seller)
- `PUT /api/auctions/:id` - Update auction (Seller)
- `DELETE /api/auctions/:id` - Delete auction (Seller)
- `GET /api/auctions/featured` - Get featured auctions
- `GET /api/auctions/ending-soon` - Get ending soon auctions
- `GET /api/auctions/search` - Search auctions

### Bidding
- `POST /api/bids/:auctionId` - Place a bid
- `GET /api/bids/auction/:auctionId` - Get auction bids
- `GET /api/bids/user/my-bids` - Get user's bids
- `PATCH /api/bids/:id/retract` - Retract a bid

### Users
- `GET /api/users/sellers` - Get top sellers
- `GET /api/users/:id/profile` - Get user profile
- `GET /api/users/me/dashboard` - Get dashboard data
- `GET /api/users/me/watchlist` - Get user's watchlist

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/tree` - Get category tree
- `GET /api/categories/:id` - Get single category

### File Upload
- `POST /api/upload/images` - Upload auction images
- `POST /api/upload/avatar` - Upload user avatar
- `DELETE /api/upload/images/:publicId` - Delete image

## Database Models

### User Model
- Authentication fields (name, email, password)
- Role-based permissions (buyer, seller, admin)
- Profile information (avatar, address, phone)
- Seller-specific fields (shop details, ratings)
- Buyer-specific fields (watchlist, saved searches)

### Auction Model
- Basic info (title, description, category)
- Pricing (starting price, current price, reserve)
- Timing (start time, end time, duration)
- Media (images, videos)
- Status tracking (draft, active, ended, sold)
- Engagement metrics (views, watchers, questions)

### Bid Model
- Bidding information (amount, bidder, auction)
- Bid types (manual, automatic, buy-now)
- Status tracking (active, outbid, winning, won)
- Validation and fraud prevention

### Category Model
- Hierarchical structure with subcategories
- SEO-friendly slugs and metadata
- Custom attributes for different crafts
- Usage statistics

## Real-time Features

The application uses Socket.io for real-time updates:

- **Auction Updates**: Live bid updates, price changes
- **Notifications**: Instant notifications for important events
- **Auction Status**: Real-time status changes (ending, sold)

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Input Validation**: Express-validator for request validation

## Scheduled Jobs

The backend includes automated jobs:

- **Auction Status Updates**: Every minute - activates scheduled auctions and ends expired ones
- **Ending Soon Notifications**: Every 15 minutes - notifies watchers of ending auctions
- **Data Cleanup**: Daily at 2 AM - removes old invalid bids

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

1. **Environment Variables**: Ensure all production environment variables are set
2. **Database**: Set up MongoDB Atlas or your preferred MongoDB hosting
3. **Cloudinary**: Configure Cloudinary account for image storage
4. **Email Service**: Set up email service (Gmail, SendGrid, etc.)
5. **Domain**: Update FRONTEND_URL to your production domain

## Default Test Accounts

After running the seeder, you can use these test accounts:

**Admin Account:**
- Email: admin@bidcraft.com
- Password: admin123

**Seller Accounts:**
- Email: maria@pottery.com, Password: seller123 (Maria's Pottery Studio)
- Email: david@woodcraft.com, Password: seller123 (Chen Woodworking)
- Email: sarah@textiles.com, Password: seller123 (Woven Dreams)

**Buyer Accounts:**
- Email: john@example.com, Password: buyer123
- Email: emma@example.com, Password: buyer123

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
