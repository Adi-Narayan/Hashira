# Design: Admin Panel v2 — Shiprocket, Stats, Delete, Polish
**Date:** 2026-04-13
**Project:** Hashira E-commerce (hashira.in)
**Stack:** React 19 + Vite + Tailwind CSS 4 (admin), Express 5 + Mongoose 8 (backend, Railway)

---

## Scope

Six changes, all scoped to the admin panel and its backend:

1. `.gitignore` — add `docs/`
2. Admin background colour — grey
3. Frontend scroll-to-top on navigation
4. Revenue stats page (`/stats`)
5. Delete order with confirmation modal
6. Shiprocket push-to-fulfil per order

---

## 1. `.gitignore` — add `docs/`

Add `docs/` to the root `.gitignore` so the spec/plan documents are never committed to git.

**File:** `c:\Users\newpassword\Desktop\ecommerce-app\.gitignore`

```
*node_modules
*.env
docs/
```

---

## 2. Admin Background Colour

Change `bg-gray-50` → `bg-gray-100` in the root wrapper div of `admin/src/App.jsx`.

This is the only change required — the panel's content areas (`bg-zinc-900` cards, `bg-zinc-800` sidebar) are already dark and unaffected.

---

## 3. Frontend Scroll-to-Top on Navigation

**Problem:** React Router does not reset scroll position on route change. Navigating to a new product or page leaves the user wherever they were scrolled on the previous page.

**Fix:** A `ScrollToTop` component that listens to `useLocation()` and calls `window.scrollTo(0, 0)` on every pathname change. Mounted once inside `<BrowserRouter>` in `frontend/src/main.jsx` (or `App.jsx`).

```jsx
// frontend/src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default ScrollToTop;
```

Mounted in `frontend/src/App.jsx` as `<ScrollToTop />` — a sibling of `<Routes>`, inside the router context.

**Files:**
- Create: `frontend/src/components/ScrollToTop.jsx`
- Modify: `frontend/src/App.jsx` — import and mount `<ScrollToTop />`

---

## 4. Revenue Stats Page

### Backend

New endpoint: `GET /api/order/stats` (admin auth required).

Aggregates all non-Failed orders from MongoDB:
- `collected` — sum of `amount` where `payment === true`
- `pending` — sum of `amount` where `payment === false` (COD awaiting delivery)
- `total` — `collected + pending`

Response:
```json
{ "success": true, "collected": 45200, "pending": 8500, "total": 53700 }
```

**Files:**
- Modify: `backend/controllers/orderController.js` — add `getStats` function
- Modify: `backend/routes/orderRoute.js` — add `GET /stats` with `adminAuth`

### Admin Frontend

New page `admin/src/pages/Stats.jsx` — three stat cards in the zinc dark theme:

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Total Collected  │  │  Pending (COD)   │  │   Grand Total    │
│   ₹45,200        │  │   ₹8,500         │  │   ₹53,700        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

Each card: `bg-zinc-900 border border-zinc-800 rounded-xl`. Amount in `text-zinc-100 text-2xl font-bold`. Label in `text-zinc-500 text-xs uppercase tracking-widest`.

Amounts formatted with `toLocaleString('en-IN')` for Indian number formatting (₹53,700 not ₹53700).

Sidebar gets a "Stats" entry (bar-chart icon) linking to `/stats`.

**Files:**
- Create: `admin/src/pages/Stats.jsx`
- Modify: `admin/src/App.jsx` — add `/stats` route
- Modify: `admin/src/components/Sidebar.jsx` — add Stats nav item

---

## 5. Delete Order (Admin)

### Backend

New endpoint: `DELETE /api/order/delete` (admin auth required).

Takes `{ orderId }` in request body. Hard-deletes the order from MongoDB using `findByIdAndDelete`. Returns `{ success: true }`.

**Files:**
- Modify: `backend/controllers/orderController.js` — add `deleteOrder` function
- Modify: `backend/routes/orderRoute.js` — add `DELETE /delete` with `adminAuth`

### Admin Frontend

Each order card in `admin/src/pages/Orders.jsx` gets a "Delete" button alongside the status selector.

**Confirmation flow:**
1. Admin clicks "Delete" → inline modal appears overlaying the order card
2. Modal content:
   - Title: "Delete this order?"
   - Body: "Order ID: `<id>`. This cannot be undone."
   - Buttons: "Cancel" (dismisses) + "Delete Order" (red, proceeds)
3. On confirm: calls `DELETE /api/order/delete`, removes order from local state on success, shows toast

No second verification step. The admin is already authenticated and the modal provides sufficient friction.

**Modal implementation:** A stateful `deleteTarget` in `Orders.jsx` (`null` or an order `_id`). When non-null, a fixed backdrop + card appears. No external modal library needed.

**Files:**
- Modify: `backend/controllers/orderController.js`
- Modify: `backend/routes/orderRoute.js`
- Modify: `admin/src/pages/Orders.jsx`

---

## 6. Shiprocket Integration

### Environment Variables

Three new slots in `backend/.env`:

```
SHIPROCKET_EMAIL=your-shiprocket-email@example.com
SHIPROCKET_PASSWORD=your-shiprocket-password
SHIPROCKET_PICKUP_LOCATION=Primary   # exact name from Shiprocket dashboard > Pickup Addresses
```

### Backend Service

New file: `backend/services/shiprocketService.js`

**Auth:** On every push, calls `POST https://apiv2.shiprocket.in/v1/external/auth/login` with `{ email, password }`. Returns a token valid for 10 days. No caching — fresh token per push.

**Create order:** Immediately calls `POST https://apiv2.shiprocket.in/v1/external/orders/create/adhoc` with the token from the previous step.

**Payload mapping:**

| Shiprocket field | Source |
|-----------------|--------|
| `order_id` | `order._id.toString()` (MongoDB ObjectId as string — primary key) |
| `order_date` | `new Date(order.date).toISOString().split('T')[0]` (YYYY-MM-DD) |
| `pickup_location` | `process.env.SHIPROCKET_PICKUP_LOCATION` |
| `billing_customer_name` | `order.address.firstName` |
| `billing_last_name` | `order.address.lastName` |
| `billing_address` | `order.address.street` |
| `billing_city` | `order.address.city` |
| `billing_state` | `order.address.state` |
| `billing_pincode` | `order.address.zipcode` |
| `billing_country` | `"India"` |
| `billing_phone` | `order.address.phone` |
| `billing_email` | fetched from `userModel.findById(order.userId).select('email')` |
| `shipping_is_billing` | `1` |
| `payment_method` | `order.payment === true ? "Prepaid" : "COD"` |
| `sub_total` | `order.amount` |
| `length` | `30` (cm) |
| `breadth` | `25` (cm) |
| `height` | `5` (cm) |
| `weight` | `0.5` (kg) |
| `order_items` | array of `{ name, sku, units, selling_price }` mapped from `order.items` |

`sku` is set to `item._id || item.name` — Shiprocket requires it but doesn't validate format.

**Error handling:** If Shiprocket auth or order creation fails, the service throws. The controller catches and returns `{ success: false, message }` — the `shiprocketPushed` flag is NOT set on failure.

### Order Model Change

Add one field to `backend/models/orderModel.js`:

```js
shiprocketPushed: { type: Boolean, default: false }
```

### Backend Endpoint

`POST /api/order/push-shiprocket` (admin auth required).

Body: `{ orderId }`

1. Fetch order by `_id`
2. If `order.shiprocketPushed === true` → return 400 (idempotency guard)
3. Call `shiprocketService.pushOrder(order)`
4. On success: set `order.shiprocketPushed = true`, save, return `{ success: true }`
5. On failure: return `{ success: false, message }`

**Files:**
- Create: `backend/services/shiprocketService.js`
- Modify: `backend/models/orderModel.js`
- Modify: `backend/controllers/orderController.js`
- Modify: `backend/routes/orderRoute.js`

### Admin Frontend

Each order card in `admin/src/pages/Orders.jsx` gets a "Push to Shiprocket" button in the bottom action row.

**States:**
- `order.shiprocketPushed === false` + not loading: teal/indigo outlined button, label "Push to Shiprocket"
- Loading (after click, before response): button disabled, label "Pushing..."
- `order.shiprocketPushed === true`: button disabled, grey, label "✓ Transferred to Shiprocket"

Button is rendered via a per-order loading state map (`pushing` object keyed by `order._id`). On success, `setOrders` updates the local order's `shiprocketPushed` to `true` without a full refetch.

**Files:**
- Modify: `admin/src/pages/Orders.jsx`

---

## Summary of all file changes

| File | Action |
|------|--------|
| `.gitignore` | Add `docs/` |
| `admin/src/App.jsx` | Change bg to `bg-gray-100`, add Stats route |
| `frontend/src/components/ScrollToTop.jsx` | Create |
| `frontend/src/App.jsx` | Mount `<ScrollToTop />` |
| `backend/controllers/orderController.js` | Add `getStats`, `deleteOrder`, `pushShiprocket` |
| `backend/routes/orderRoute.js` | Add `/stats`, `/delete`, `/push-shiprocket` |
| `backend/services/shiprocketService.js` | Create |
| `backend/models/orderModel.js` | Add `shiprocketPushed` field |
| `admin/src/pages/Stats.jsx` | Create |
| `admin/src/App.jsx` | Add `/stats` route |
| `admin/src/components/Sidebar.jsx` | Add Stats nav item |
| `admin/src/pages/Orders.jsx` | Delete button + modal + Shiprocket button |
| `backend/.env` | Add Shiprocket env var slots (documented, not committed) |
