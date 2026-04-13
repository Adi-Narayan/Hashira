import express from 'express'
import { verifyPayU, placeOrder, placeOrderPayU, allOrders, userOrders, updateStatus, getStats, deleteOrder, pushShiprocket } from '../controllers/orderController.js';
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

//Admin Features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)
orderRouter.get('/stats', adminAuth, getStats)
orderRouter.delete('/delete', adminAuth, deleteOrder)
orderRouter.post('/push-shiprocket', adminAuth, pushShiprocket)

//Payment Features
orderRouter.post('/place', authUser, placeOrder)
orderRouter.post('/payu', authUser, placeOrderPayU)


//User Feature
orderRouter.post('/userorders', authUser, userOrders)

//Verify Payment
orderRouter.post('/verifyPayU', verifyPayU)

export default orderRouter