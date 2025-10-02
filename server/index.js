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
app.use('/user', authenticateSeller, userRouter)
// Remove authentication for auction routes - handle in individual route handlers
app.use('/auction', auctionRouter);
app.use('/notifications', notificationRouter);
app.use('/contact', contactRouter);
app.use('/admin', authenticateAdmin, adminRouter)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});