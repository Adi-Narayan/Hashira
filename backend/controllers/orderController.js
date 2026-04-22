import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../services/emailService.js";
import { pushOrder } from '../services/shiprocketService.js';

/* -------------------- PAYU CONFIG -------------------- */
const payuMerchantKey = process.env.PAYU_MERCHANT_KEY;
const payuSalt = process.env.PAYU_SALT;
const payuPaymentUrl = "https://secure.payu.in/_payment";

/* -------------------- HELPERS -------------------- */
const getFrontendUrl = () => {
  const urls = process.env.FRONTEND_URLS?.split(",") || [];
  return urls[0] || process.env.DEFAULT_FRONTEND_URL;
};

// Builds the emailData shape that sendOrderConfirmationEmail expects
const buildEmailData = (orderId, order) => ({
  orderId,
  customerName: order.address?.firstName && order.address?.lastName
    ? `${order.address.firstName} ${order.address.lastName}`
    : undefined,
  date: order.date,
  paymentMethod: order.paymentMethod,
  payment: order.payment,
  items: order.items,
  amount: order.amount,
  address: order.address,
});

/* -------------------- COD ORDER -------------------- */
const placeOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, amount, address } = req.body;

    const order = await orderModel.create({
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now()
    });

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Send confirmation email — same direct pattern as updateStatus so errors surface clearly
    try {
      const user = await userModel.findById(userId);
      if (user?.email) {
        await sendOrderConfirmationEmail(user.email, buildEmailData(order._id, order));
      } else {
        console.warn("COD order email skipped: no email found for userId", userId);
      }
    } catch (emailError) {
      // Don't fail the order response over an email error — but log it visibly
      console.error("COD order confirmation email failed:", emailError);
    }

    // Auto-push to Shiprocket — non-blocking, never fails the order response
    pushOrder(order)
      .then(() => orderModel.findByIdAndUpdate(order._id, { shiprocketPushed: true }))
      .catch(err => console.error('Shiprocket auto-push failed (COD):', err));

    res.json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

/* -------------------- PAYU ORDER INIT -------------------- */
const placeOrderPayU = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, amount, address } = req.body;

    const txnid = `TXN_${Date.now()}`;
    const productinfo = items.map(i => i.name).join(", ");

    const firstname = address?.firstName || "Customer";
    const email = address?.email || "customer@example.com";
    const phone = address?.phone || "9999999999";

    const surl = `${process.env.BACKEND_URL}/api/order/verifyPayU`;
    const furl = `${process.env.BACKEND_URL}/api/order/verifyPayU`;

    const hashString = `${payuMerchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${payuSalt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const order = await orderModel.create({
      userId,
      items,
      address,
      amount,
      txnid,
      paymentMethod: "PayU",
      payment: false,
      status: "Pending",
      date: Date.now()
    });

    console.log("Order created with txnid:", txnid, "Order ID:", order._id);

    res.json({
      success: true,
      payuUrl: payuPaymentUrl,
      params: {
        key: payuMerchantKey,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash
      }
    });
  } catch (error) {
    console.error("placeOrderPayU error:", error);
    res.json({ success: false, message: error.message });
  }
};

/* -------------------- PAYU VERIFY -------------------- */
const verifyPayU = async (req, res) => {
  try {
    console.log("PayU callback received (txnid):", req.body?.txnid);

    const status = req.body?.status;
    const txnid = req.body?.txnid;
    const postedHash = req.body?.hash;
    const email = req.body?.email;
    const firstname = req.body?.firstname;
    const productinfo = req.body?.productinfo;
    const amount = req.body?.amount;
    const key = req.body?.key;
    const frontendUrl = getFrontendUrl();

    if (!status || !txnid || !postedHash) {
      console.error("Invalid PayU callback payload");
      return res.redirect(`${frontendUrl}/verify?success=false&reason=invalid`);
    }

    // Reverse hash per PayU spec:
    //   sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const udf1 = req.body?.udf1 || "";
    const udf2 = req.body?.udf2 || "";
    const udf3 = req.body?.udf3 || "";
    const udf4 = req.body?.udf4 || "";
    const udf5 = req.body?.udf5 || "";

    const additionalCharges = req.body?.additionalCharges;
    let reverseString = `${payuSalt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    if (additionalCharges) {
      reverseString = `${additionalCharges}|${reverseString}`;
    }
    const computedHash = crypto.createHash("sha512").update(reverseString).digest("hex");

    if (computedHash !== postedHash) {
      console.error("PayU hash mismatch for txnid:", txnid);
      return res.redirect(`${frontendUrl}/verify?success=false&reason=tampered`);
    }

    if (key !== payuMerchantKey) {
      console.error("PayU merchant key mismatch for txnid:", txnid);
      return res.redirect(`${frontendUrl}/verify?success=false&reason=tampered`);
    }

    console.log("Looking for order with txnid:", txnid);
    const order = await orderModel.findOne({ txnid });

    if (!order) {
      console.error("Order not found for txnid:", txnid);
      return res.redirect(`${frontendUrl}/verify?success=false&reason=notfound`);
    }

    // Amount tamper check — compare against the server-side order amount
    if (Number(amount) !== Number(order.amount)) {
      console.error("PayU amount mismatch for txnid:", txnid, "posted:", amount, "expected:", order.amount);
      return res.redirect(`${frontendUrl}/verify?success=false&reason=tampered`);
    }

    console.log("Order found:", order._id);

    if (status === "success") {
      order.payment = true;
      order.status = "Order Placed";
      await order.save();

      await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

      try {
        const user = await userModel.findById(order.userId);
        if (user?.email) {
          await sendOrderConfirmationEmail(user.email, buildEmailData(order._id, order));
        }
      } catch (emailError) {
        console.error("PayU order confirmation email failed:", emailError);
      }

      // Auto-push to Shiprocket — non-blocking, never blocks the redirect
      pushOrder(order)
        .then(() => orderModel.findByIdAndUpdate(order._id, { shiprocketPushed: true }))
        .catch(err => console.error('Shiprocket auto-push failed (PayU):', err));

      console.log("Payment successful for txnid:", txnid);
      return res.redirect(`${frontendUrl}/verify?success=true&orderId=${order._id}`);
    }

    order.payment = false;
    order.status = "Failed";
    await order.save();

    console.log("Payment failed for txnid:", txnid, "Status:", status);
    return res.redirect(`${frontendUrl}/verify?success=false&orderId=${order._id}`);

  } catch (error) {
    console.error("PayU verify error:", error);
    return res.redirect(`${getFrontendUrl()}/verify?success=false&reason=error`);
  }
};

/* -------------------- ADMIN -------------------- */
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ status: { $nin: ['Failed', 'Pending'] } });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({
      userId: req.userId,
      status: { $ne: "Failed" }
    });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (order) {
      const user = await userModel.findById(order.userId);
      if (user?.email) {
        sendOrderStatusEmail(user.email, order, status).catch(console.error);
      }
    }

    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* -------------------- STATS -------------------- */
const getStats = async (req, res) => {
  try {
    const orders = await orderModel.find({ status: { $nin: ['Failed', 'Pending'] } });

    let collected = 0;
    let pending = 0;

    orders.forEach(order => {
      if (order.payment === true) {
        collected += order.amount;
      } else {
        pending += order.amount;
      }
    });

    res.json({ success: true, collected, pending, total: collected + pending });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* -------------------- DELETE ORDER -------------------- */
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }
    const order = await orderModel.findByIdAndDelete(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* -------------------- SHIPROCKET -------------------- */
const pushShiprocket = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.shiprocketPushed) {
      return res.status(400).json({ success: false, message: 'Order already transferred to Shiprocket' });
    }

    await pushOrder(order);

    order.shiprocketPushed = true;
    await order.save();

    res.json({ success: true, message: 'Order transferred to Shiprocket' });
  } catch (error) {
    console.error('pushShiprocket error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------- EXPORTS -------------------- */
export {
  placeOrder,
  placeOrderPayU,
  verifyPayU,
  allOrders,
  userOrders,
  updateStatus,
  getStats,
  deleteOrder,
  pushShiprocket
};