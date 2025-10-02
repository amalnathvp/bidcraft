import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
dotenv.config();
import { connectDB } from './connection.js'
import auctionRouter from './routes/auction.js';
import { authenticateSeller, authenticateAdmin } from './middleware/roleAuth.js';
import userAuthRouter from './routes/userAuth.js';
import userRouter from './routes/user.js';
import contactRouter from "./routes/contact.js";
import adminRouter from './routes/admin.js';
import buyerAuthRouter from './routes/buyerAuth.js';
import buyerAuctionRouter from './routes/buyerAuction.js';
import notificationRouter from './routes/notification.js';
import buyerNotificationRouter from './routes/buyerNotification.js';
import bidRouter from './routes/bid.js';
import orderRouter from './routes/orders.js';
import AuctionEndService from './services/auctionEndService.js';

const port = process.env.PORT || 3000;

connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: process.env.ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));


app.get('/', async (req, res) => {
    res.json({ msg: 'Welcome to Online Auction System API' });
});
app.use('/auth', userAuthRouter)
app.use('/buyer', buyerAuthRouter)
app.use('/buyer/auction', buyerAuctionRouter)
app.use('/buyer/notifications', buyerNotificationRouter)
app.use('/bids', bidRouter)
app.use('/orders', orderRouter)
app.use('/user', authenticateSeller, userRouter)
// Remove authentication for auction routes - handle in individual route handlers
app.use('/auction', auctionRouter);
app.use('/notifications', notificationRouter);
app.use('/contact', contactRouter);
app.use('/admin', authenticateAdmin, adminRouter)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    
    // Start auction monitoring services
    console.log('Starting auction monitoring services...');
    
    // Check for ended auctions every 5 minutes
    setInterval(async () => {
        try {
            await AuctionEndService.processEndedAuctions();
        } catch (error) {
            console.error('Error in auction end check:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Send ending soon reminders every hour
    setInterval(async () => {
        try {
            await AuctionEndService.sendEndingSoonReminders();
        } catch (error) {
            console.error('Error in ending soon reminders:', error);
        }
    }, 60 * 60 * 1000); // 1 hour
    
    console.log('Auction monitoring services started successfully');
});