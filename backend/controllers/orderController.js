import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../services/emailService.js";

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
    console.log("PayU callback received:", req.body);

    const status = req.body?.status;
    const txnid = req.body?.txnid;
    const frontendUrl = getFrontendUrl();

    if (!status || !txnid) {
      console.error("Invalid PayU callback payload:", req.body);
      return res.redirect(`${frontendUrl}/verify?success=false&reason=invalid`);
    }

    console.log("Looking for order with txnid:", txnid);
    const order = await orderModel.findOne({ txnid });

    if (!order) {
      console.error("Order not found for txnid:", txnid);
      return res.redirect(`${frontendUrl}/verify?success=false&reason=notfound`);
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
    const orders = await orderModel.find({ status: { $ne: "Failed" } });
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
    const orders = await orderModel.find({ status: { $ne: 'Failed' } });

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

/* -------------------- EXPORTS -------------------- */
export {
  placeOrder,
  placeOrderPayU,
  verifyPayU,
  allOrders,
  userOrders,
  updateStatus,
  getStats
};