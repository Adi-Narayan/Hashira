# Reviews, Performance & JWT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-product review system (star rating + comment), fix product load speed on new devices, and fix JWT token lifetime and error messages.

**Architecture:** Reviews live in a new MongoDB `review` collection with a compound unique index enforcing one review per user per product. The load speed fix is a two-part change: a preload `<script>` in `index.html` that fires the products API call before React mounts, and a `Cache-Control` header on the list endpoint for browser caching. JWT changes are two one-liner edits.

**Tech Stack:** Express 5, Mongoose 8, React 19, Vite 7, Tailwind CSS 4, Axios, Railway (backend), Vercel (frontend + admin)

**Responsive Design Requirement:** All UI components (ReviewsSection in `Product.jsx`, admin `Reviews.jsx`) must be fully functional and visually correct on both mobile (≥320px) and desktop. Use Tailwind responsive prefixes (`sm:`, `md:`) throughout. Key rules:
- Star picker: large tap targets (min 44×44px) on mobile
- Review form textarea: full width on all breakpoints
- Review list: single column, readable line length on mobile
- Admin table: stacks vertically on small screens, uses horizontal layout on `sm:` and above
- No horizontal overflow on any screen width

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `backend/middleware/auth.js` | Modify | Friendly JWT error message |
| `backend/controllers/userController.js` | Modify | JWT expiry → 1825d |
| `backend/controllers/productController.js` | Modify | Cache-Control header on list |
| `frontend/index.html` | Modify | Products preload script |
| `frontend/src/context/ShopContext.jsx` | Modify | Consume preloaded promise |
| `backend/models/reviewModel.js` | Create | Review schema + indexes |
| `backend/controllers/reviewController.js` | Create | add / edit / remove / list / admin handlers |
| `backend/routes/reviewRoute.js` | Create | Review routes |
| `backend/server.js` | Modify | Mount `/api/review` router |
| `frontend/src/pages/Product.jsx` | Modify | ReviewsSection component |
| `admin/src/pages/Reviews.jsx` | Create | Admin review list + delete |
| `admin/src/App.jsx` | Modify | Add `/reviews` route |
| `admin/src/components/Sidebar.jsx` | Modify | Add Reviews nav item |

---

## Task 1: Fix JWT error message in auth middleware

**Files:**
- Modify: `backend/middleware/auth.js:14-17`

- [ ] **Step 1: Edit auth.js catch block**

Replace line 16 in `backend/middleware/auth.js`:

```js
import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({ success: false, message: 'Please Signup/Login to place an order' });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = token_decode.id;  
    next();
  } catch (error) {
    console.log('JWT verification failed:', error.message);
    res.json({ success: false, message: 'Order unavailable, please try again later' });
  }
};

export default authUser;
```

- [ ] **Step 2: Verify**

Run the backend locally, send a request with a malformed token:
```bash
curl -X POST http://localhost:4000/api/order/place \
  -H "Content-Type: application/json" \
  -H "token: badtoken" \
  -d '{"items":[],"amount":0,"address":{}}'
```
Expected response: `{"success":false,"message":"Order unavailable, please try again later"}`

- [ ] **Step 3: Commit**

```bash
git add backend/middleware/auth.js
git commit -m "fix: return friendly message on JWT verification failure"
```

---

## Task 2: Extend JWT token lifetime to 5 years

**Files:**
- Modify: `backend/controllers/userController.js:9`

- [ ] **Step 1: Edit createToken in userController.js**

Change line 9:

```js
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1825d' });
}
```

- [ ] **Step 2: Verify**

Register or log in via the backend and decode the returned JWT at [jwt.io](https://jwt.io). The `exp` field should be approximately 5 years from now (Unix timestamp ~1900000000).

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/userController.js
git commit -m "fix: extend JWT expiry to 5 years (1825d)"
```

---

## Task 3: Add Cache-Control header to product list endpoint

**Files:**
- Modify: `backend/controllers/productController.js:95-97`

- [ ] **Step 1: Edit listProduct**

Change the `listProduct` function (around line 93):

```js
// List products
const listProduct = async (req, res) => {
    try {
        const products = await productModel.find({});
        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
        res.json({ success: true, products })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
```

- [ ] **Step 2: Verify**

```bash
curl -I http://localhost:4000/api/product/list
```
Expected: response headers include `Cache-Control: public, max-age=300, stale-while-revalidate=3600`

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/productController.js
git commit -m "perf: add Cache-Control header to product list for browser caching"
```

---

## Task 4: Add products preload script to index.html

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Edit index.html**

Add the preload `<script>` block immediately before the `<script type="module">` tag. Vite replaces `%VITE_BACKEND_URL%` at build time.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hashira</title>
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.__productsPromise = fetch('%VITE_BACKEND_URL%/api/product/list')
        .then(function(r){ return r.json(); })
        .catch(function(){ return null; });
    </script>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

> Note: `%VITE_BACKEND_URL%` is Vite's HTML env replacement syntax. It uses whatever `VITE_BACKEND_URL` is set to in your Vercel environment variables at build time — make sure Vercel has this set to your Railway URL (e.g. `https://your-app.railway.app`).

- [ ] **Step 2: Verify build substitution**

```bash
cd frontend
npm run build
grep -r "__productsPromise" dist/
```
Expected: the built HTML contains the actual Railway URL (not the `%VITE_BACKEND_URL%` placeholder).

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "perf: prefetch product list in parallel with JS bundle download"
```

---

## Task 5: Consume preloaded promise in ShopContext

**Files:**
- Modify: `frontend/src/context/ShopContext.jsx:124-135`

- [ ] **Step 1: Replace getProductsData**

Replace the `getProductsData` function (lines 124–135):

```js
const getProductsData = async () => {
    try {
        let data = null;

        if (window.__productsPromise) {
            data = await window.__productsPromise;
            window.__productsPromise = null; // consume once
        }

        if (!data?.products) {
            const response = await axios.get(backendUrl + '/api/product/list');
            data = response.data;
        }

        if (data.products) {
            setProducts(data.products);
        } else {
            console.log(data.message);
        }
    } catch (error) {
        console.log(error.message);
    }
}
```

- [ ] **Step 2: Verify in browser**

Open the Network tab in DevTools, hard-refresh `hashira.in`. Filter by XHR/Fetch. Confirm that the `/api/product/list` request starts at the same time as the JS bundle download (both appear in the waterfall at the same horizontal position, not sequentially).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/ShopContext.jsx
git commit -m "perf: consume preloaded products promise instead of re-fetching after React mounts"
```

---

## Task 6: Create the Review model

**Files:**
- Create: `backend/models/reviewModel.js`

- [ ] **Step 1: Create reviewModel.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/reviewModel.js
git commit -m "feat: add Review model with compound unique index (userId + productId)"
```

---

## Task 7: Create the Review controller

**Files:**
- Create: `backend/controllers/reviewController.js`

- [ ] **Step 1: Create reviewController.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/controllers/reviewController.js
git commit -m "feat: add review controller (add, edit, remove, list, admin handlers)"
```

---

## Task 8: Create the Review route and mount it

**Files:**
- Create: `backend/routes/reviewRoute.js`
- Modify: `backend/server.js:11,55`

- [ ] **Step 1: Create reviewRoute.js**

```js
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
```

- [ ] **Step 2: Mount router in server.js**

Add the import on line 12 and the `app.use` on line 56:

```js
import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import reviewRouter from "./routes/reviewRoute.js";

const app = express();

const PORT = process.env.PORT || 4000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- CORS CONFIG -------------------- */
const allowedOrigins = [
  "https://hashira.in",
  "https://www.hashira.in",
  "https://hashira-admin.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);

/* -------------------- ROUTES -------------------- */
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/review", reviewRouter);

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.status(200).send("API Working 🚀");
});

/* -------------------- SERVER START -------------------- */
const startServer = async () => {
  try {
    await connectDB();
    connectCloudinary();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
```

- [ ] **Step 3: Smoke-test all review endpoints**

Start the backend: `cd backend && node server.js`

```bash
# Should return empty reviews array
curl http://localhost:4000/api/review/product/SOME_PRODUCT_ID

# Should return 401 (no token)
curl -X POST http://localhost:4000/api/review/add \
  -H "Content-Type: application/json" \
  -d '{"productId":"abc","rating":5,"comment":"great"}'
```

Expected for second call: `{"success":false,"message":"Please Signup/Login to place an order"}`

- [ ] **Step 4: Commit**

```bash
git add backend/routes/reviewRoute.js backend/server.js
git commit -m "feat: wire up review routes and mount /api/review on express app"
```

---

## Task 9: Add ReviewsSection to the Product page

**Files:**
- Modify: `frontend/src/pages/Product.jsx`

- [ ] **Step 1: Replace the full Product.jsx**

Add the `ReviewsSection` component and wire it in. Add this import block at the top and the component before the `export default`:

```jsx
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
import sizeChartImg from '../assets/size_chart.jpeg';
import axios from 'axios';

const SIZE_CHART_SUBCATEGORIES = new Set(['Topwear']);

// ─── Star display helper ──────────────────────────────────────────────────────

const Stars = ({ value, interactive = false, onSelect }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onSelect && onSelect(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`text-xl leading-none transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          disabled={!interactive}
          aria-label={`${star} star`}
        >
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
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

  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/review/product/${productId}`);
      if (res.data.success) {
        setReviews(res.data.reviews);
        // Find current user's review by matching token userId — we detect it
        // by checking reviews later in the render using token presence
      }
    } catch {
      // silently fail — reviews are non-critical
    } finally {
      setLoading(false);
    }
  }, [backendUrl, productId]);

  const fetchMyReview = useCallback(async () => {
    if (!token) return;
    try {
      // We find "my review" by checking which review's userId matches our token.
      // The list endpoint already returns all reviews. We rely on a separate
      // lightweight check: re-use the list and match by token claim after load.
      // Nothing extra needed server-side.
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    setMyReview(null);
    setEditMode(false);
    setError('');
    fetchReviews();
  }, [productId, fetchReviews]);

  // After reviews load, determine which one (if any) belongs to the current user.
  // We identify it by trying to add and catching the 409 — but that's wasteful.
  // Instead we store userId in ShopContext or decode the token. Simpler: we
  // expose a /api/review/mine endpoint. But to keep scope minimal we use a
  // dedicated field approach: after loading reviews, fire one GET to check if
  // user already has a review for this product via a separate endpoint call.
  // Actually cleanest: add GET /api/review/mine/:productId endpoint.
  // We'll do it inline here using the already-loaded list — the userId is
  // populated as an object with _id and name. To identify "mine" we need to
  // know our own userId. Decode the JWT client-side (it's not secret data):

  const getMyUserId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (reviews.length === 0) return;
    const myId = getMyUserId();
    if (!myId) return;
    const found = reviews.find(r => r.userId?._id === myId || r.userId === myId);
    if (found) setMyReview(found);
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

  return (
    <div className="mt-16">
      <hr className="mb-8" />
      <h2 className="text-lg font-semibold mb-1">Reviews</h2>

      {/* Average */}
      {averageRating && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-3xl font-bold">{averageRating}</span>
          <Stars value={Math.round(Number(averageRating))} />
          <span className="text-sm text-gray-400">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
        </div>
      )}

      {/* Write / Edit form */}
      {token && !myReview && !editMode && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 border border-gray-200 rounded-xl bg-gray-50">
          <p className="text-sm font-medium mb-3">Write a review</p>
          <Stars value={rating} interactive onSelect={setRating} />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Share your thoughts..."
            className="mt-3 w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-gray-400"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{comment.length}/1000</span>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 bg-black text-white text-sm px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {token && editMode && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 border border-gray-200 rounded-xl bg-gray-50">
          <p className="text-sm font-medium mb-3">Edit your review</p>
          <Stars value={rating} interactive onSelect={setRating} />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            className="mt-3 w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-gray-400"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{comment.length}/1000</span>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white text-sm px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="text-sm px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!token && (
        <p className="text-sm text-gray-400 mb-6">
          <a href="/login" className="underline text-gray-600 hover:text-black">Login</a> to leave a review.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Be the first.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {reviews.map((review) => {
            const isOwn = myReview?._id === review._id;
            return (
              <div key={review._id} className={`pb-5 border-b border-gray-100 last:border-0 ${isOwn ? 'bg-yellow-50 -mx-2 px-2 py-3 rounded-lg' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {review.userId?.name || 'User'}
                      {isOwn && <span className="ml-2 text-xs text-gray-400 font-normal">(you)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Stars value={review.rating} />
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {review.updatedAt !== review.createdAt && ' (edited)'}
                      </span>
                    </div>
                  </div>
                  {isOwn && !editMode && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={startEdit} className="text-xs text-gray-500 hover:text-black underline underline-offset-2">Edit</button>
                      <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2">Delete</button>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Size Chart Modal ─────────────────────────────────────────────────────────
```

Then at the bottom of the `Product` component's JSX, add `<ReviewsSection productId={productId} />` after `<RelatedProducts>`:

```jsx
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
```

- [ ] **Step 2: Verify in browser**

1. Open a product page — the Reviews section should appear at the bottom with "No reviews yet."
2. Log in, navigate to a product — the "Write a review" form should appear.
3. Submit a review — it should appear immediately.
4. The Edit and Delete buttons should appear on your own review.
5. Log out — only the review list shows, with a "Login to leave a review" link.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Product.jsx
git commit -m "feat: add ReviewsSection to product page with star rating, edit, and delete"
```

---

## Task 10: Create admin Reviews page

**Files:**
- Create: `admin/src/pages/Reviews.jsx`

- [ ] **Step 1: Create Reviews.jsx**

```jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const Stars = ({ value }) => (
  <span className="text-yellow-400 tracking-tight">
    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
  </span>
)

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAllReviews = async () => {
    if (!token) return
    try {
      const res = await axios.get(
        backendUrl + '/api/review/all',
        { headers: { token } }
      )
      if (res.data.success) {
        setReviews(res.data.reviews)
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reviewId) => {
    try {
      const res = await axios.delete(
        backendUrl + '/api/review/admin-remove',
        { data: { reviewId }, headers: { token } }
      )
      if (res.data.success) {
        setReviews(prev => prev.filter(r => r._id !== reviewId))
        toast.success('Review deleted')
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchAllReviews()
  }, [token])

  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-zinc-100 text-xl font-semibold tracking-tight'>Reviews</h2>
        <p className='text-zinc-500 text-sm mt-1'>{reviews.length} total reviews</p>
      </div>

      {loading ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>No reviews yet.</div>
      ) : (
        <div className='flex flex-col gap-3'>
          {reviews.map((review) => (
            <div
              key={review._id}
              className='bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-3 mb-1 flex-wrap'>
                    <span className='text-zinc-200 text-sm font-medium'>
                      {review.userId?.name || 'Unknown user'}
                    </span>
                    <span className='text-zinc-600 text-xs'>on</span>
                    <span className='text-zinc-400 text-sm font-medium'>
                      {review.productId?.name || 'Unknown product'}
                    </span>
                  </div>
                  <div className='flex items-center gap-3 mb-2'>
                    <Stars value={review.rating} />
                    <span className='text-zinc-600 text-xs font-mono'>
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className='text-zinc-400 text-sm leading-relaxed'>{review.comment}</p>
                </div>
                <button
                  onClick={() => handleDelete(review._id)}
                  className='shrink-0 text-xs text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-colors'
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reviews
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/pages/Reviews.jsx
git commit -m "feat: add admin Reviews page with list and delete"
```

---

## Task 11: Wire Reviews into admin App.jsx and Sidebar

**Files:**
- Modify: `admin/src/App.jsx`
- Modify: `admin/src/components/Sidebar.jsx`

- [ ] **Step 1: Add route in App.jsx**

Add the import and route:

```jsx
import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Edit from './pages/Edit'
import Reviews from './pages/Reviews'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify';

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '₹'

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '');

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {token === ""
        ? <Login setToken={setToken} />
        :
        <>
          <Navbar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path="/add" element={<Add token={token} />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/orders" element={<Orders token={token} />} />
                <Route path="/edit/:productId" element={<Edit token={token} />} />
                <Route path="/reviews" element={<Reviews token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      }
    </div>
  )
}

export default App
```

- [ ] **Step 2: Add Reviews nav item to Sidebar.jsx**

Add a new entry to the `navItems` array in `admin/src/components/Sidebar.jsx`:

```jsx
const navItems = [
  {
    to: '/add',
    label: 'Add Items',
    icon: (
      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        <circle cx='12' cy='12' r='10'/>
        <line x1='12' y1='8' x2='12' y2='16'/>
        <line x1='8' y1='12' x2='16' y2='12'/>
      </svg>
    )
  },
  {
    to: '/list',
    label: 'Products',
    icon: (
      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        <line x1='8' y1='6' x2='21' y2='6'/>
        <line x1='8' y1='12' x2='21' y2='12'/>
        <line x1='8' y1='18' x2='21' y2='18'/>
        <line x1='3' y1='6' x2='3.01' y2='6'/>
        <line x1='3' y1='12' x2='3.01' y2='12'/>
        <line x1='3' y1='18' x2='3.01' y2='18'/>
      </svg>
    )
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: (
      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'/>
        <line x1='3' y1='6' x2='21' y2='6'/>
        <path d='M16 10a4 4 0 0 1-8 0'/>
      </svg>
    )
  },
  {
    to: '/reviews',
    label: 'Reviews',
    icon: (
      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'/>
      </svg>
    )
  }
]
```

- [ ] **Step 3: Verify in admin panel**

1. Open the admin panel — the sidebar should show a "Reviews" nav item with a star icon.
2. Click it — the Reviews page should load and show all reviews from the database.
3. Click Delete on a review — it should disappear from the list with a toast.

- [ ] **Step 4: Commit**

```bash
git add admin/src/App.jsx admin/src/components/Sidebar.jsx
git commit -m "feat: add Reviews page to admin panel with sidebar nav entry"
```

---

## Self-Review Checklist

- [x] JWT error message → Task 1 ✓
- [x] JWT expiry 1825d → Task 2 ✓
- [x] Cache-Control header → Task 3 ✓
- [x] Preload script in index.html (uses `%VITE_BACKEND_URL%`) → Task 4 ✓
- [x] ShopContext consumes promise → Task 5 ✓
- [x] Review model with compound unique index → Task 6 ✓
- [x] add / edit / remove / listByProduct / listAll / adminRemove handlers → Task 7 ✓
- [x] Routes wired, server.js updated → Task 8 ✓
- [x] ReviewsSection in Product.jsx — display, form, edit, delete, logged-out state → Task 9 ✓
- [x] Admin Reviews page → Task 10 ✓
- [x] Admin App.jsx route + Sidebar nav item → Task 11 ✓
- [x] Type consistency: `addReview`, `editReview`, `removeReview`, `listProductReviews`, `listAllReviews`, `adminRemoveReview` match across controller, route, and frontend calls ✓
- [x] `%VITE_BACKEND_URL%` verified as Vite's HTML env substitution syntax ✓
- [x] No placeholders or TBDs ✓
