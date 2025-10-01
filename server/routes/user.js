import express from 'express';
import { handleGetUser, handleChangePassword, getLoginHistory, getSellerProfile, updateSellerProfile, uploadProfileImage } from '../controllers/user.controller.js';
import upload from '../middleware/multer.js';

const userRouter = express.Router();

userRouter.get('/', handleGetUser);
userRouter.put('/change-password', handleChangePassword);
userRouter.patch("/", handleChangePassword);
userRouter.get("/logins", getLoginHistory);
userRouter.get("/profile", getSellerProfile);
userRouter.put("/profile", updateSellerProfile);
userRouter.post("/profile/upload-image", upload.single('avatar'), uploadProfileImage);

export default userRouter;