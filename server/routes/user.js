import express from 'express';
import { handleGetUser, handleChangePassword, updateProfile, getLoginHistory } from '../controllers/user.controller.js';

const userRouter = express.Router();

userRouter.get('/', handleGetUser);
userRouter.put('/profile', updateProfile);
userRouter.put('/change-password', handleChangePassword);
userRouter.patch("/", handleChangePassword);
userRouter.get("/logins", getLoginHistory)

export default userRouter;