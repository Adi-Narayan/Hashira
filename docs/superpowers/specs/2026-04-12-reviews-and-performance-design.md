# Design: Reviews Section + Performance + JWT Fixes
**Date:** 2026-04-12  
**Project:** Hashira E-commerce (hashira.in)  
**Stack:** React + Vite (Vercel) / Express + MongoDB (Railway)

---

## 1. Scope

Three independent improvements shipped together:

1. **Product load speed** — eliminate the client-side data-fetch waterfall on new devices
2. **Product reviews** — per-product star rating + comment system for logged-in users
3. **JWT fixes** — extend token lifetime to 5 years; humanise expired-token error messages

---

## 2. Product Load Speed Fix

### Root cause
The frontend is a React SPA. Products are fetched inside a `useEffect` in `ShopContext.jsx`, which only runs *after* the JS bundle has downloaded and React has hydrated. On a new device this creates a sequential waterfall:

```
HTML loads → JS bundle downloads → React hydrates → useEffect fires → API call → products render
```

The backend (Railway) is warm — there is no cold start. The delay is entirely in the waterfall.

### Fix A — Preload script in `index.html`
Add an inline `<script>` tag **before** the Vite entry point that fires the products fetch immediately when the HTML is parsed, in parallel with the JS bundle download:

```html
<script>
  window.__productsPromise = fetch(
    '%VITE_BACKEND_URL%/api/product/list'
  ).then(r => r.json()).catch(() => null);
</script>
```

Vite replaces `%VITE_BACKEND_URL%` at build time using the value in `.env`. No hardcoded URL.

In `ShopContext.jsx`, `getProductsData` checks for `window.__productsPromise` first and consumes it instead of making a duplicate request. Falls back to a fresh fetch if the promise is absent or errored.

**Impact:** The API round-trip overlaps with JS bundle download. Products are available the moment React mounts, or very shortly after. Saves ~1–2 s on a new device.

### Fix B — Browser cache via `Cache-Control`
Add one header to the `listProduct` controller response:

```
Cache-Control: public, max-age=300, stale-while-revalidate=3600
```

The browser caches the product list for 5 minutes. On repeat visits (same device, same browser), products are served from local cache in < 5 ms with no network request at all.

**Scope:** This header is added only to `GET /api/product/list`. All other endpoints are unaffected.

### Files changed
| File | Change |
|------|--------|
| `frontend/index.html` | Add preload `<script>` block |
| `frontend/src/context/ShopContext.jsx` | Consume `window.__productsPromise` in `getProductsData` |
| `backend/controllers/productController.js` | Add `Cache-Control` header to `listProduct` |

---

## 3. Product Reviews

### Data model — `Review` collection

```js
{
  userId:    ObjectId (ref: User),   // required
  productId: ObjectId (ref: Product),// required
  rating:    Number (1–5),           // required
  comment:   String,                 // required, trimmed, max 1000 chars
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Compound unique index on `{ userId, productId }` — enforces one review per user per product at the database level
- Index on `productId` — fast lookup of all reviews for a product

### API endpoints

All write endpoints require the `auth` middleware (JWT token in headers).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/review/add` | Required | Submit a new review |
| `PUT` | `/api/review/edit` | Required | Edit own review |
| `DELETE` | `/api/review/remove` | Required | Delete own review |
| `GET` | `/api/review/product/:productId` | None | List all reviews for a product |

**`POST /api/review/add`** — body: `{ productId, rating, comment }`  
Validates rating (1–5 integer) and comment (non-empty, ≤ 1000 chars). Returns 409 if user already has a review for this product.

**`PUT /api/review/edit`** — body: `{ reviewId, rating, comment }`  
Verifies `review.userId === req.userId` before updating. Updates `updatedAt`.

**`DELETE /api/review/remove`** — body: `{ reviewId }`  
Verifies `review.userId === req.userId` before deleting.

**`GET /api/review/product/:productId`**  
Returns all reviews for the product sorted newest first, with `{ _id, userId: { name }, rating, comment, createdAt, updatedAt }`. Populates only `name` from the user — no email or password.

### Anti-spam
- One review per user per product enforced at DB level (unique index) and API level (409 on duplicate)
- Reviews require a valid JWT — unauthenticated users cannot submit
- Comment max length: 1000 characters

### Frontend — `Product.jsx`

A `ReviewsSection` component is added at the bottom of the product page (below Related Products).

**Display (all visitors):**
- Average star rating (1 decimal, e.g. 4.3 ★) + total review count
- List of reviews: reviewer name, star display, comment, date
- If no reviews: "No reviews yet. Be the first."

**Logged-in user, no existing review:**
- "Write a Review" form inline — star picker + comment textarea + submit button

**Logged-in user, has existing review:**
- Their review shown with "Edit" and "Delete" buttons
- Edit mode: pre-fills the form, submit updates

**Logged-out user:**
- "Login to leave a review" link

### Admin panel

A new **Reviews** page in the admin panel lists all reviews across all products. Columns: product name, reviewer name, rating, comment, date. Admin can delete any review (no edit — moderation only).

### Files changed (backend)
| File | Change |
|------|--------|
| `backend/models/reviewModel.js` | New — Review schema |
| `backend/controllers/reviewController.js` | New — add/edit/remove/list handlers |
| `backend/routes/reviewRoute.js` | New — routes wired to controller |
| `backend/server.js` | Mount `/api/review` router |

### Files changed (frontend)
| File | Change |
|------|--------|
| `frontend/src/pages/Product.jsx` | Add `ReviewsSection` component at bottom |
| `frontend/src/context/ShopContext.jsx` | Expose `backendUrl` (already done), no other changes |

### Files changed (admin)
| File | Change |
|------|--------|
| `admin/src/pages/Reviews.jsx` | New — admin review list with delete |
| `admin/src/App.jsx` | Add `/reviews` route |
| `admin/src/components/Sidebar.jsx` | Add Reviews entry to `navItems` array |

---

## 4. JWT Fixes

### Expiry extended to 5 years
In `userController.js`, `createToken`:

```js
// Before
jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// After
jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1825d' })
```

### Humanised error message for expired tokens
In `backend/middleware/auth.js`, the `catch` block currently returns `error.message` raw (e.g. "jwt expired", "invalid signature"). Replace with:

```js
return res.json({ success: false, message: 'Order unavailable, please try again later' });
```

### Files changed
| File | Change |
|------|--------|
| `backend/controllers/userController.js` | `expiresIn: '1825d'` |
| `backend/middleware/auth.js` | Friendly catch message |

---

## 5. Out of Scope (not in this plan)

The following security issues were identified during analysis but are **not** part of this implementation — they should be addressed separately to avoid scope creep:

- Unauthenticated password reset (`/api/user/forgot-password`)
- PayU response hash verification missing in `verifyPayU`
- CORS allowedOrigins whitelist not enforced (fallthrough allows all origins)
- No rate limiting on auth endpoints
- Multer file type validation missing
- Admin JWT encodes raw credentials in payload

---

## 6. Implementation Order

1. JWT fixes (smallest, safest, independent)
2. Product load speed fix (backend + frontend, no new dependencies)
3. Review backend (model + controller + routes)
4. Review frontend (Product.jsx)
5. Review admin panel
