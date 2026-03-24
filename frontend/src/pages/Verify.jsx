import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'

const Verify = () => {
  const [searchParams] = useSearchParams()
  const success = searchParams.get('success')
  const orderId = searchParams.get('orderId')
  const reason = searchParams.get('reason')
  const { navigate, setCartItems } = useContext(ShopContext)

  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (success === 'true') {
      setCartItems({})
      setStatus('success')
      // ✅ SPA navigation — auth context is already hydrated by this point
      setTimeout(() => navigate('/orders'), 2000)
    } else {
      setStatus('failed')
    }
  }, [])

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4 text-gray-500'>
          <svg className='w-8 h-8 animate-spin' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z' />
          </svg>
          <p className='text-sm'>Verifying your payment, please wait...</p>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div className='min-h-[60vh] flex items-center justify-center px-4'>
        <div className='flex flex-col items-center gap-5 text-center max-w-sm'>

          {/* Checkmark */}
          <div className='w-16 h-16 rounded-full bg-black flex items-center justify-center'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-8 h-8 text-white' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/>
            </svg>
          </div>

          <div>
            <p className='text-2xl font-semibold text-gray-900'>Payment Successful</p>
            <p className='text-sm text-gray-500 mt-2'>Your order has been placed. You'll receive a confirmation email shortly.</p>
            {orderId && (
              <p className='text-xs text-gray-400 mt-2'>Order ID: <span className='font-mono'>{orderId}</span></p>
            )}
            <p className='text-xs text-gray-400 mt-3'>Redirecting you to your orders...</p>
          </div>

          <div className='flex gap-3 w-full mt-2'>
            <button
              onClick={() => navigate('/orders')}
              className='flex-1 bg-black text-white py-2.5 text-sm font-medium rounded-full hover:bg-gray-800 transition-colors'
            >
              View Orders
            </button>
            <button
              onClick={() => navigate('/')}
              className='flex-1 border border-gray-300 text-gray-600 py-2.5 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors'
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Failed ──
  return (
    <div className='min-h-[60vh] flex items-center justify-center px-4'>
      <div className='flex flex-col items-center gap-5 text-center max-w-sm'>

        {/* X icon */}
        <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center'>
          <svg xmlns='http://www.w3.org/2000/svg' className='w-8 h-8 text-red-500' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/>
          </svg>
        </div>

        <div>
          <p className='text-2xl font-semibold text-gray-900'>Payment Failed</p>
          <p className='text-sm text-gray-500 mt-2'>
            Your payment could not be processed. You have not been charged.
          </p>
          {reason === 'invalid' && (
            <p className='text-xs text-red-400 mt-2'>Invalid payment response received.</p>
          )}
        </div>

        <div className='flex gap-3 w-full mt-2'>
          <button
            onClick={() => navigate('/place-order')}
            className='flex-1 bg-black text-white py-2.5 text-sm font-medium rounded-full hover:bg-gray-800 transition-colors'
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className='flex-1 border border-gray-300 text-gray-600 py-2.5 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors'
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default Verify