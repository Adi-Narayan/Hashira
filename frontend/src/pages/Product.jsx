import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
// Drop your size chart image into src/assets/ as size_chart.png
// When the chart is updated, just replace that file — no code changes needed
import sizeChartImg from '../assets/size_chart.jpeg';
import axios from 'axios';
import cldImg from '../utils/cldImg';

// Size chart link only appears for Topwear — add 'Bottomwear' here when that chart is ready
const SIZE_CHART_SUBCATEGORIES = new Set(['Topwear']);

// ─── Stars Component ─────────────────────────────────────────────────────────

const Stars = ({ value, interactive = false, onSelect }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onSelect && onSelect(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center text-xl leading-none transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default pointer-events-none'}`}
          disabled={!interactive}
          aria-label={`${star} star`}
        >
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
};

// ─── Reviews Section ──────────────────────────────────────────────────────────

const ReviewsSection = ({ productId }) => {
  const { backendUrl, token } = useContext(ShopContext);

  const [reviews, setReviews]       = useState([]);
  const [myReview, setMyReview]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editMode, setEditMode]     = useState(false);
  const [rating, setRating]         = useState(5);
  const [comment, setComment]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const getMyUserId = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).id;
    } catch {
      return null;
    }
  };

  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/review/product/${productId}`);
      if (res.data.success) {
        setReviews(res.data.reviews);
      }
    } catch {
      // non-critical — silently fail
    } finally {
      setLoading(false);
    }
  }, [backendUrl, productId]);

  useEffect(() => {
    setLoading(true);
    setMyReview(null);
    setEditMode(false);
    setError('');
    fetchReviews();
  }, [productId, fetchReviews]);

  useEffect(() => {
    if (reviews.length === 0) return;
    const myId = getMyUserId();
    if (!myId) return;
    const found = reviews.find(r =>
      (r.userId?._id && r.userId._id === myId) || r.userId === myId
    );
    setMyReview(found || null);
  }, [reviews, token]);

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { setError('Please write a comment.'); return; }
    setSubmitting(true);
    setError('');
    try {
      if (editMode && myReview) {
        const res = await axios.put(
          `${backendUrl}/api/review/edit`,
          { reviewId: myReview._id, rating, comment },
          { headers: { token } }
        );
        if (!res.data.success) { setError(res.data.message); return; }
      } else {
        const res = await axios.post(
          `${backendUrl}/api/review/add`,
          { productId, rating, comment },
          { headers: { token } }
        );
        if (!res.data.success) { setError(res.data.message); return; }
      }
      setComment('');
      setRating(5);
      setEditMode(false);
      await fetchReviews();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    try {
      const res = await axios.delete(
        `${backendUrl}/api/review/remove`,
        { data: { reviewId: myReview._id }, headers: { token } }
      );
      if (res.data.success) {
        setMyReview(null);
        setEditMode(false);
        await fetchReviews();
      }
    } catch {
      // ignore
    }
  };

  const startEdit = () => {
    if (!myReview) return;
    setRating(myReview.rating);
    setComment(myReview.comment);
    setEditMode(true);
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const isEdited = (review) =>
    review.updatedAt && review.createdAt &&
    new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 5000;

  return (
    <div className="mt-16 pb-10">
      <hr className="mb-8" />

      {/* Header + average */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {averageRating && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{averageRating}</span>
            <Stars value={Math.round(Number(averageRating))} />
            <span className="text-sm text-gray-400">
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
      </div>

      {/* Write/Edit form — only show if logged in and no review yet (or in edit mode) */}
      {token && (!myReview || editMode) && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 sm:p-5 border border-gray-200 rounded-xl bg-gray-50">
          <p className="text-sm font-medium mb-3">
            {editMode ? 'Edit your review' : 'Write a review'}
          </p>
          <Stars value={rating} interactive onSelect={setRating} />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Share your thoughts about this product..."
            className="mt-3 w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-gray-400 bg-white"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
            <span className="text-xs text-gray-400">{comment.length}/1000</span>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white text-sm px-6 py-2.5 rounded-md hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editMode ? 'Save Changes' : 'Submit Review'}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={() => { setEditMode(false); setError(''); }}
                className="text-sm px-6 py-2.5 rounded-md border border-gray-300 hover:bg-gray-100 active:scale-95 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Not logged in */}
      {!token && (
        <p className="text-sm text-gray-400 mb-6">
          <a href="/login" className="underline text-gray-700 hover:text-black transition-colors">
            Login
          </a>{' '}
          to leave a review.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Be the first.</p>
      ) : (
        <div className="flex flex-col gap-0">
          {reviews.map((review) => {
            const isOwn = myReview?._id === review._id;
            return (
              <div
                key={review._id}
                className={`py-5 border-b border-gray-100 last:border-0 ${isOwn ? 'relative' : ''}`}
              >
                {isOwn && (
                  <span className="absolute top-5 right-0 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                    Your review
                  </span>
                )}
                <div className="flex items-start gap-3 pr-24 sm:pr-0">
                  {/* Avatar circle */}
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs font-semibold text-gray-600 uppercase">
                    {(review.userId?.name || 'U')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                      <span className="text-sm font-medium truncate">
                        {review.userId?.name || 'User'}
                      </span>
                      <Stars value={review.rating} />
                      <span className="text-xs text-gray-400">
                        {formatDate(review.createdAt)}
                        {isEdited(review) && ' · edited'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed break-words">
                      {review.comment}
                    </p>
                    {isOwn && !editMode && (
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={startEdit}
                          className="text-xs text-gray-500 hover:text-black underline underline-offset-2 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleDelete}
                          className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Size Chart Modal ─────────────────────────────────────────────────────────

const SizeChartModal = ({ onClose }) => {

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={handleBackdrop}
      className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4'
    >
      <div className='bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden'>

        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
          <h2 className='text-sm font-semibold text-gray-900 tracking-tight'>Size Chart</h2>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500'
            aria-label='Close'
          >
            <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
              <line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>
            </svg>
          </button>
        </div>

        {/* Chart image */}
        <div className='p-4'>
          <img
            src={sizeChartImg}
            alt='Size Chart'
            className='w-full h-auto object-contain rounded-lg'
          />
        </div>

        {/* Footer */}
        <div className='px-5 py-3 bg-gray-50 border-t border-gray-100'>
          <p className='text-xs text-gray-400'>
            Measurements are garment measurements. When in doubt, size up.
          </p>
        </div>

      </div>
    </div>
  );
};

// ─── Product Page ─────────────────────────────────────────────────────────────

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);

  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        setImage(item.image[0]);
        return null;
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  useEffect(() => {
    setQuantity(1);
    setSize('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  const handleAddToCart = () => {
    if (!size) return;
    setIsAdding(true);
    for (let i = 0; i < quantity; i++) {
      addToCart(productData._id, size);
    }
    setTimeout(() => {
      setIsAdding(false);
      setShowToast(true);
    }, 400);
    setTimeout(() => {
      setShowToast(false);
    }, 2900);
  };

  const hasSizeChart = SIZE_CHART_SUBCATEGORIES.has(productData?.subCategory);

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">

      {/* ── Added to Cart Toast ── */}
      <div className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-40
        flex items-center gap-3 px-5 py-3.5
        bg-black text-white text-sm font-medium rounded-full shadow-2xl
        transition-all duration-300
        ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        <span className='w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-3 h-3 text-black' viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </span>
        {quantity} × {productData.name} added to cart
      </div>

      {/* ── Size Chart Modal ── */}
      {showSizeChart && (
        <SizeChartModal onClose={() => setShowSizeChart(false)} />
      )}

      {/* ----- Product Layout ----- */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">

        {/* ----- Images ----- */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                key={index}
                src={cldImg(item)}
                onClick={() => setImage(item)}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer rounded-lg border-2"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img src={cldImg(image)} alt="" className="w-full h-auto rounded-xl border-2" />
          </div>
        </div>

        {/* ----- Info ----- */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>

          <p className="mt-5 text-3xl font-medium">
            {currency}{productData.price}
          </p>
          {productData.originalPrice && productData.originalPrice > productData.price && (
            <p className="mt-1 text-base text-red-400 line-through">
              {currency}{productData.originalPrice}
            </p>
          )}

          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>

          {/* Size selector */}
          <div className="flex flex-col gap-4 my-8">
            <div className='flex items-center justify-between md:w-4/5'>
              <p>Select Size</p>
              {hasSizeChart && (
                <button
                  onClick={() => setShowSizeChart(true)}
                  className='flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M21 3H3v6l9 12 9-12V3z'/><line x1='3' y1='9' x2='21' y2='9'/>
                    <line x1='9' y1='3' x2='9' y2='9'/><line x1='15' y1='3' x2='15' y2='9'/>
                  </svg>
                  Size Chart
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {productData.sizes.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSize(item)}
                  className={`
                    border py-2 px-4 rounded-md
                    transition-all duration-200
                    ${item === size
                      ? 'border-orange-500 bg-orange-50 scale-105 shadow-sm'
                      : 'border-gray-300 bg-gray-100 hover:border-gray-400 hover:bg-gray-200'
                    }
                  `}
                  style={{ transform: item === size ? 'translateY(-1px)' : 'translateY(0)' }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex flex-col gap-2 mb-8">
            <p>Quantity</p>
            <div className="flex items-center gap-0 w-fit border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
              <span className="w-10 h-9 flex items-center justify-center text-sm font-medium border-x border-gray-300 select-none">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(99, q + 1))}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
                disabled={quantity >= 99}
                aria-label="Increase quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !size}
            className={`
              bg-black text-white px-8 py-3 text-sm rounded-md
              transition-all duration-300
              ${isAdding
                ? 'scale-95 opacity-80'
                : !size
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-105 hover:shadow-lg hover:bg-gray-800'
              }
            `}
          >
            {isAdding ? 'ADDING...' : 'ADD TO CART'}
          </button>

          {!size && (
            <p className="mt-2 text-xs text-gray-400">Please select a size first</p>
          )}

          <hr className="mt-8 sm:w-4/5" />
        </div>
      </div>

      {/* ----- Related Products ----- */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.subCategory}
      />

      {/* ----- Reviews ----- */}
      <ReviewsSection productId={productId} />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;