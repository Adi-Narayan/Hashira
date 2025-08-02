// src/pages/Verify.jsx
import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'

const Verify = () => {
  const [searchParams] = useSearchParams()
  const success = searchParams.get('success')
  const orderId = searchParams.get('orderId')
  const { token, backendUrl } = useContext(ShopContext)
  const navigate = useNavigate()

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await axios.post(
          `${backendUrl}/api/order/verifyPayU`,
          {
            success,
            orderId,
            userId: token
          },
          { headers: { token } }
        )

        if (res.data.success) {
          toast.success(res.data.message)
          navigate('/orders')
        } else {
          toast.error(res.data.message)
          navigate('/')
        }
      } catch (err) {
        toast.error('Payment verification failed')
        navigate('/')
      }
    }

    if (success && orderId) {
      verifyPayment()
    } else {
      toast.error('Invalid verification parameters')
      navigate('/')
    }
  }, [])

  return <div className="p-4 text-center">Verifying your payment, please wait...</div>
}

export default Verify
