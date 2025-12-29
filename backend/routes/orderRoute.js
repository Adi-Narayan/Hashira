import express from 'express'
import { verifyPayU, placeOrder, placeOrderPayU, allOrders, userOrders, updateStatus } from '../controllers/orderController.js';
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

//Admin Features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)

//Payment Features
orderRouter.post('/place', authUser, placeOrder)
orderRouter.post('/payu', authUser, placeOrderPayU)


//User Feature
orderRouter.post('/userorders', authUser, userOrders)

//Verify Payment
orderRouter.post('/verifyPayU', verifyPayU)

export default orderRouter