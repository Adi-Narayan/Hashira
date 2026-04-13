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

/* ── Confirm Delete Modal ── */
const DeleteModal = ({ orderId, onCancel, onConfirm }) => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4'>
    <div className='bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl'>
      <h3 className='text-zinc-100 text-base font-semibold mb-2'>Delete this order?</h3>
      <p className='text-zinc-400 text-sm mb-1'>Order ID:</p>
      <p className='text-zinc-300 text-xs font-mono break-all mb-4'>{orderId}</p>
      <p className='text-red-400 text-sm mb-6'>This cannot be undone.</p>
      <div className='flex gap-3'>
        <button
          onClick={onCancel}
          className='flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors'
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className='flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors'
        >
          Delete Order
        </button>
      </div>
    </div>
  </div>
)

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)   // orderId string or null
  const [pushing, setPushing] = useState({})               // { [orderId]: true } while in-flight

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

  const handleDeleteConfirm = async () => {
    const orderId = deleteTarget
    setDeleteTarget(null)
    try {
      const res = await axios.delete(
        backendUrl + '/api/order/delete',
        { data: { orderId }, headers: { token } }
      )
      if (res.data.success) {
        setOrders(prev => prev.filter(o => o._id !== orderId))
        toast.success('Order deleted')
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleShiprocket = async (orderId) => {
    setPushing(prev => ({ ...prev, [orderId]: true }))
    try {
      const res = await axios.post(
        backendUrl + '/api/order/push-shiprocket',
        { orderId },
        { headers: { token } }
      )
      if (res.data.success) {
        setOrders(prev =>
          prev.map(o => o._id === orderId ? { ...o, shiprocketPushed: true } : o)
        )
        toast.success('Order transferred to Shiprocket')
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setPushing(prev => ({ ...prev, [orderId]: false }))
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [token])

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          orderId={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

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

              {/* Bottom row: customer + payment + actions */}
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

                {/* Actions */}
                <div className='flex items-center gap-2 flex-wrap'>
                  {/* Payment method indicator */}
                  <div className='flex flex-col items-end gap-1'>
                    <span className='text-zinc-500 text-xs'>
                      {order.paymentMethod}
                      <span className={`ml-2 font-medium ${order.payment ? 'text-green-400' : 'text-yellow-500'}`}>
                        {order.payment ? '· Paid' : '· Pending'}
                      </span>
                    </span>
                  </div>

                  {/* Shiprocket button */}
                  {order.shiprocketPushed ? (
                    <span className='text-xs text-zinc-500 border border-zinc-700 rounded-lg px-3 py-2 cursor-default'>
                      ✓ Transferred to Shiprocket
                    </span>
                  ) : (
                    <button
                      onClick={() => handleShiprocket(order._id)}
                      disabled={!!pushing[order._id]}
                      className='text-xs text-teal-400 border border-teal-500/40 hover:border-teal-400 hover:bg-teal-500/10 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {pushing[order._id] ? 'Pushing...' : 'Push to Shiprocket'}
                    </button>
                  )}

                  {/* Status selector */}
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

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteTarget(order._id)}
                    className='text-xs text-red-500 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors'
                  >
                    Delete
                  </button>
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
