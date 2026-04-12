import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'user',    required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    comment:   { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1 });

const reviewModel = mongoose.models.review || mongoose.model('review', reviewSchema);
export default reviewModel;
