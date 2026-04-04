import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const STATUS_STYLES = {
  'Order Placed': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Packing':      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Shipped':      'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Out for Delivery': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Delivery':     'bg-green-500/10 text-green-400 border-green-500/20',
}

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAllOrders = async () => {
    if (!token) return
    try {
      const response = await axios.post(
        backendUrl + '/api/order/list',
        {},
        { headers: { token } }
      )
      if (response.data.success) {
        setOrders(response.data.orders.reverse())
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      await axios.post(
        backendUrl + '/api/order/status',
        { orderId, status: event.target.value },
        { headers: { token } }
      )
      await fetchAllOrders()
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [token])

  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-zinc-100 text-xl font-semibold tracking-tight'>Orders</h2>
        <p className='text-zinc-500 text-sm mt-1'>{orders.length} total orders</p>
      </div>

      {loading ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>No orders yet.</div>
      ) : (
        <div className='flex flex-col gap-3'>
          {orders.map((order) => (
            <div
              key={order._id}
              className='bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors'
            >
              {/* Top row: IDs + status + amount */}
              <div className='flex flex-wrap items-start justify-between gap-3 mb-4'>
                <div className='flex flex-col gap-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-zinc-600 text-xs uppercase tracking-widest font-mono'>Order ID</span>
                    <span className='text-zinc-300 text-xs font-mono'>{order._id}</span>
                  </div>
                  {order.txnid && (
                    <div className='flex items-center gap-2'>
                      <span className='text-zinc-600 text-xs uppercase tracking-widest font-mono'>Txn ID</span>
                      <span className='text-zinc-400 text-xs font-mono'>{order.txnid}</span>
                    </div>
                  )}
                  <div className='flex items-center gap-2 mt-0.5'>
                    <span className='text-zinc-600 text-xs uppercase tracking-widest font-mono'>Date</span>
                    <span className='text-zinc-500 text-xs font-mono'>
                      {new Date(order.date).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status] || STATUS_STYLES['Order Placed']}`}>
                    {order.status}
                  </span>
                  <span className='text-zinc-100 font-semibold font-mono text-sm'>
                    {currency}{order.amount}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className='border-t border-zinc-800 mb-4' />

              {/* Items */}
              <div className='flex flex-col gap-3 mb-4'>
                {order.items.map((item, idx) => (
                  <div key={idx} className='flex items-center gap-3'>
                    <img
                      src={item.image?.[0]}
                      alt={item.name}
                      className='w-12 h-12 object-cover rounded-lg bg-zinc-800 flex-shrink-0'
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='text-zinc-200 text-sm font-medium truncate'>{item.name}</p>
                      <div className='flex items-center gap-3 mt-0.5'>
                        <span className='text-zinc-500 text-xs'>Size: <span className='text-zinc-400'>{item.size}</span></span>
                        <span className='text-zinc-700'>·</span>
                        <span className='text-zinc-500 text-xs'>Qty: <span className='text-zinc-400 font-semibold'>{item.quantity}</span></span>
                        <span className='text-zinc-700'>·</span>
                        <span className='text-zinc-500 text-xs'>{currency}{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className='border-t border-zinc-800 mb-4' />

              {/* Bottom row: customer + payment + status selector */}
              <div className='flex flex-wrap items-end justify-between gap-4'>
                {/* Customer info */}
                <div className='flex flex-col gap-1'>
                  <p className='text-zinc-200 text-sm font-medium'>
                    {order.address.firstName} {order.address.lastName}
                  </p>
                  <p className='text-zinc-500 text-xs'>{order.address.phone}</p>
                  <p className='text-zinc-600 text-xs max-w-xs'>
                    {order.address.street}, {order.address.city}, {order.address.state} — {order.address.zipcode}
                  </p>
                </div>

                {/* Payment + status */}
                <div className='flex items-center gap-3 flex-wrap'>
                  <div className='flex flex-col items-end gap-1'>
                    <span className='text-zinc-500 text-xs'>
                      {order.paymentMethod}
                      <span className={`ml-2 font-medium ${order.payment ? 'text-green-400' : 'text-yellow-500'}`}>
                        {order.payment ? '· Paid' : '· Pending'}
                      </span>
                    </span>
                  </div>

                  <select
                    value={order.status}
                    onChange={(e) => statusHandler(e, order._id)}
                    className='bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-zinc-500 transition-colors cursor-pointer'
                  >
                    <option value='Order Placed'>Order Placed</option>
                    <option value='Packing'>Packing</option>
                    <option value='Shipped'>Shipped</option>
                    <option value='Out for Delivery'>Out for Delivery</option>
                    <option value='Delivery'>Delivered</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
