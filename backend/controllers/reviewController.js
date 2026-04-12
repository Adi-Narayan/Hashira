import reviewModel from '../models/reviewModel.js';

/* ---- helpers ---- */
const validateRatingAndComment = (rating, comment) => {
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return 'Rating must be a whole number between 1 and 5';
    }
    if (!comment || comment.trim().length === 0) {
        return 'Comment cannot be empty';
    }
    if (comment.length > 1000) {
        return 'Comment must be 1000 characters or fewer';
    }
    return null;
};

/* ---- POST /api/review/add ---- */
const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'productId is required' });
        }

        const validationError = validateRatingAndComment(rating, comment);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const existing = await reviewModel.findOne({ userId: req.userId, productId });
        if (existing) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
        }

        const review = await reviewModel.create({
            userId: req.userId,
            productId,
            rating: Number(rating),
            comment: comment.trim(),
        });

        res.json({ success: true, review });
    } catch (error) {
        console.error('addReview error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ---- PUT /api/review/edit ---- */
const editReview = async (req, res) => {
    try {
        const { reviewId, rating, comment } = req.body;

        if (!reviewId) {
            return res.status(400).json({ success: false, message: 'reviewId is required' });
        }

        const validationError = validateRatingAndComment(rating, comment);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.userId.toString() !== req.userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorised to edit this review' });
        }

        review.rating = Number(rating);
        review.comment = comment.trim();
        await review.save();

        res.json({ success: true, review });
    } catch (error) {
        console.error('editReview error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ---- DELETE /api/review/remove ---- */
const removeReview = async (req, res) => {
    try {
        const { reviewId } = req.body;

        if (!reviewId) {
            return res.status(400).json({ success: false, message: 'reviewId is required' });
        }

        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.userId.toString() !== req.userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorised to delete this review' });
        }

        await reviewModel.findByIdAndDelete(reviewId);
        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('removeReview error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ---- GET /api/review/product/:productId ---- */
const listProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await reviewModel
            .find({ productId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        console.error('listProductReviews error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ---- GET /api/review/all (admin) ---- */
const listAllReviews = async (req, res) => {
    try {
        const reviews = await reviewModel
            .find({})
            .populate('userId', 'name')
            .populate('productId', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        console.error('listAllReviews error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ---- DELETE /api/review/admin-remove (admin) ---- */
const adminRemoveReview = async (req, res) => {
    try {
        const { reviewId } = req.body;

        if (!reviewId) {
            return res.status(400).json({ success: false, message: 'reviewId is required' });
        }

        const review = await reviewModel.findByIdAndDelete(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('adminRemoveReview error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addReview, editReview, removeReview, listProductReviews, listAllReviews, adminRemoveReview };
