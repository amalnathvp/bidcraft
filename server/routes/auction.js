import express from 'express';
import { createAuction, showAuction, auctionById, placeBid, dashboardData, myAuction, updateAuction, deleteAuction } from '../controllers/auction.controller.js';
import upload from '../middleware/multer.js';

const auctionRouter = express.Router();

auctionRouter
    .get('/stats', dashboardData)

auctionRouter
    .get('/', showAuction)
    .post('/', upload.array('itemPhotos', 5), createAuction);

auctionRouter
.get("/myauction", myAuction)

auctionRouter
    .get('/:id', auctionById)
    .post('/:id', placeBid)
    .put('/:id', updateAuction)
    .delete('/:id', deleteAuction)


export default auctionRouter;