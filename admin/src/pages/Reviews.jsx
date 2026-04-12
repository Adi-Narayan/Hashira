import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Stars = ({ value }) => (
  <span className="text-yellow-400 tracking-tight text-base">
    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
  </span>
)

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAllReviews = async () => {
    if (!token) return
    try {
      const res = await axios.get(
        backendUrl + '/api/review/all',
        { headers: { token } }
      )
      if (res.data.success) {
        setReviews(res.data.reviews)
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reviewId) => {
    try {
      const res = await axios.delete(
        backendUrl + '/api/review/admin-remove',
        { data: { reviewId }, headers: { token } }
      )
      if (res.data.success) {
        setReviews(prev => prev.filter(r => r._id !== reviewId))
        toast.success('Review deleted')
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchAllReviews()
  }, [token])

  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-zinc-100 text-xl font-semibold tracking-tight'>Reviews</h2>
        <p className='text-zinc-500 text-sm mt-1'>{reviews.length} total reviews</p>
      </div>

      {loading ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>No reviews yet.</div>
      ) : (
        <div className='flex flex-col gap-3'>
          {reviews.map((review) => (
            <div
              key={review._id}
              className='bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 hover:border-zinc-700 transition-colors'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1 min-w-0'>
                  {/* Product + user */}
                  <div className='flex flex-wrap items-center gap-x-2 gap-y-1 mb-2'>
                    <span className='text-zinc-200 text-sm font-medium truncate'>
                      {review.productId?.name || 'Unknown product'}
                    </span>
                    <span className='text-zinc-600 text-xs hidden sm:inline'>·</span>
                    <span className='text-zinc-500 text-xs truncate'>
                      by {review.userId?.name || 'Unknown user'}
                    </span>
                  </div>
                  {/* Rating + date */}
                  <div className='flex flex-wrap items-center gap-3 mb-2'>
                    <Stars value={review.rating} />
                    <span className='text-zinc-600 text-xs font-mono'>
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                  {/* Comment */}
                  <p className='text-zinc-400 text-sm leading-relaxed break-words'>
                    {review.comment}
                  </p>
                </div>
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(review._id)}
                  className='shrink-0 text-xs text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-400/50 px-3 py-2 rounded-lg transition-colors min-w-[60px] text-center'
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reviews
