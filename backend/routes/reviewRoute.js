import express from 'express';
import {
    addReview,
    editReview,
    removeReview,
    listProductReviews,
    listAllReviews,
    adminRemoveReview,
} from '../controllers/reviewController.js';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const reviewRouter = express.Router();

// Public
reviewRouter.get('/product/:productId', listProductReviews);

// Logged-in users
reviewRouter.post('/add', authUser, addReview);
reviewRouter.put('/edit', authUser, editReview);
reviewRouter.delete('/remove', authUser, removeReview);

// Admin only
reviewRouter.get('/all', adminAuth, listAllReviews);
reviewRouter.delete('/admin-remove', adminAuth, adminRemoveReview);

export default reviewRouter;
