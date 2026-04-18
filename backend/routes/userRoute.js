import express from 'express';
import { loginUser, registerUser, adminLogin, sendOtp, forgotPassword, getProfile, updateProfile } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminLogin)
userRouter.post('/send-otp', sendOtp)
userRouter.post('/forgot-password', forgotPassword)

userRouter.get('/profile', authMiddleware, getProfile);
userRouter.put('/profile', authMiddleware, updateProfile);

export default userRouter;