import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'

const PlaceOrder = () => {

  const [method, setMethod] = useState('cod');
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, getFinalDeliveryFee, products, setToken } = useContext(ShopContext);
  const [formError, setFormError] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    phone: ''
  })

  const handleAuthError = (message = '') => {
    const m = message.toLowerCase()
    if (
      m.includes('expired') ||
      m.includes('not authorized') ||
      m.includes('invalid token') ||
      m.includes('signup') ||
      m.includes('login')
    ) {
      localStorage.removeItem('token')
      setToken('')
      setCartItems({})
      navigate('/login')
      return true
    }
    return false
  }

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value
    setFormData(data => ({ ...data, [name]: value }))
    setFormError('')
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setFormError('')

    try {
      let orderItems = [];

      for (const productId in cartItems) {
        const sizes = cartItems[productId];
        for (const size in sizes) {
          const quantity = sizes[size];
          if (quantity > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === productId));
            if (itemInfo) {
              itemInfo.size = size;
              itemInfo.quantity = quantity;
              orderItems.push(itemInfo);
            }
          }
        }
      }

      let orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + getFinalDeliveryFee()
      }

      switch (method) {

        case 'cod':
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })
          if (response.data.success) {
            setCartItems({})
            navigate('/orders')
          } else {
            if (!handleAuthError(response.data.message)) {
              setFormError(response.data.message || 'Failed to place order. Please try again.')
            }
          }
          break;

        case 'payu':
          const responsePayU = await axios.post(backendUrl + '/api/order/payu', orderData, { headers: { token } })
          if (responsePayU.data.success) {
            const { payuUrl, params } = responsePayU.data;
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = payuUrl;
            for (const key in params) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = params[key];
              form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
          } else {
            if (!handleAuthError(responsePayU.data.message)) {
              setFormError(responsePayU.data.message || 'Payment initiation failed. Please try again.')
            }
          }
          break;

        default:
          break;
      }

    } catch (error) {
      console.log(error)
      setFormError('Something went wrong. Please try again.')
    }
  }

  // ── Not logged in — inline prompt ──
  if (!token) {
    return (
      <div className='border-t pt-14 min-h-[80vh] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-5 text-center max-w-sm'>
          <div className='w-14 h-14 rounded-full bg-black flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-7 h-7 text-white' viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <div>
            <p className='text-xl font-semibold text-gray-900'>Sign in to place your order</p>
            <p className='text-sm text-gray-500 mt-2'>You need to be logged in to complete your purchase.</p>
          </div>
          <div className='flex gap-3 w-full'>
            <button onClick={() => navigate('/login')} className='flex-1 bg-black text-white py-2.5 text-sm font-medium rounded-full hover:bg-gray-800 transition-colors'>
              Login Now
            </button>
            <button onClick={() => navigate('/')} className='flex-1 border border-gray-300 text-gray-600 py-2.5 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors'>
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>

      {/* Left — Delivery Info */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl m-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-gray-500 rounded py-1.5 px-3.5 w-full' type='text' placeholder='First Name' />
          <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-gray-500 rounded py-1.5 px-3.5 w-full' type='text' placeholder='Last Name' />
        </div>
        <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-gray-500 rounded py-1.5 px-3.5 w-full' type='email' placeholder='Email Address' />
        <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-500 rounded py-1.5 px-3.5 w-full' type='text' placeholder='Street' />
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-500 rounded py-1.5 px-3.5 w-full' type='text' placeholder='City' />
          <input required onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-500 rounded py-1.5 px-3.5 w-full' type='text' placeholder='State' />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='border border-gray-500 rounded py-1.5 px-3.5 w-full' type='text' placeholder='Pin Code' />
          <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-500 rounded py-1.5 px-3.5 w-full' type='text' placeholder='Phone Number' />
        </div>

        {/* Inline form error */}
        {formError && (
          <div className='flex items-center gap-2 text-sm text-red-500'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 shrink-0' viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {formError}
          </div>
        )}
      </div>

      {/* Right — Order Summary & Payment */}
      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <CartTotal />
        </div>

        <div className='mt-12'>
          <Title text1={'PAYMENT'} text2={'METHOD'} />

          <div className='flex gap-3 flex-col lg:flex-row'>
            <div onClick={() => setMethod('payu')} className='flex items-center gap-3 border bg-white p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'payu' ? 'bg-black' : ''}`}></p>
              <img className='h-5 mx-4' src={assets.pay_u} alt="" />
            </div>
            <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border bg-white p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-black' : ''}`}></p>
              <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
            </div>
          </div>

          <div className='w-full text-end mt-8'>
            <button type='submit' className='bg-black text-white px-16 py-3 text-sm hover:bg-gray-800 transition-colors'>PLACE ORDER</button>
          </div>
        </div>
      </div>

    </form>
  )
}

export default PlaceOrder