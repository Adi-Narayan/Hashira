import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe';
import crypto from 'crypto';
import razorpay from 'razorpay'

// global variables
const currency = 'inr'
const deliveryCharge = 100

// gateway initialize
const payuMerchantKey = process.env.PAYU_MERCHANT_KEY;
const payuSalt = process.env.PAYU_SALT;
const payuPaymentUrl = "https://secure.payu.in/_payment"


// Placing Orders using COD Method
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address} = req.body;
        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment: false,
            date: Date.now()
        }
        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true, message:"Order Placed"})
    }
    catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// PayU
const placeOrderPayU = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

        const txnid = `TXN_${Date.now()}`;
        const productinfo = items.map(i => i.name).join(", ");
        const firstname = address.name || "Customer";
        const email = address.email || "customer@example.com";
        const phone = address.phone || "9999999999";

        const surl = `${origin}/verify?success=true&orderId=${txnid}`;
        const furl = `${origin}/verify?success=false&orderId=${txnid}`;

        // Construct the hash string according to PayU's format
        const hashString = `${payuMerchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${payuSalt}`;
        const hash = crypto.createHash('sha512').update(hashString).digest('hex');

        // Save order to DB
        const newOrder = new orderModel({
            userId,
            items,
            address,
            amount,
            txnid,
            paymentMethod: "PayU",
            payment: false,
            date: Date.now()
        });
        await newOrder.save();

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
                hash,
                
            },
            orderId: newOrder._id
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};



const verifyPayU = async (req, res) => {
    const { orderId, success, userId } = req.body;

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            await userModel.findByIdAndUpdate(userId, { cartData: {} });
            res.json({ success: true, message: "Payment verified and order Placed." });
        } else {
            res.json({ success: false, message: "Payment failed." });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


// RazorPay
const placeOrderRazorpay = async (req, res) => {

}

// All orders data for Admin Panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success:true, orders })
    }
    catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// Use Order Data fro Frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({ success:true, orders })
    }
    catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// Update order status from Admin Panel
const updateStatus = async (req,res) => {
    try {

        const { orderId, status } = req.body

        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({success:true, message:'Status Updated'})

    }
    catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

export { verifyPayU, placeOrder, placeOrderPayU, placeOrderRazorpay, allOrders, userOrders, updateStatus }