import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const List = ({ token }) => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setList(response.data.products)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/product/remove',
        { id },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-zinc-100 text-xl font-semibold tracking-tight'>Products</h2>
        <p className='text-zinc-500 text-sm mt-1'>{list.length} items listed</p>
      </div>

      {/* Header row — added Edit column */}
      <div className='hidden md:grid grid-cols-[60px_1fr_120px_140px_80px] gap-4 px-4 py-2 text-zinc-500 text-xs font-medium uppercase tracking-widest border-b border-zinc-800 mb-1'>
        <span>Image</span>
        <span>Name</span>
        <span>Category</span>
        <span>Price</span>
        <span className='text-center'>Actions</span>
      </div>

      {loading ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>Loading products...</div>
      ) : list.length === 0 ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>No products found.</div>
      ) : (
        <div className='flex flex-col'>
          {list.map((item) => (
            <div
              key={item._id}
              className='grid grid-cols-[60px_1fr_80px] md:grid-cols-[60px_1fr_120px_140px_80px] gap-4 items-center px-4 py-3 border-b border-zinc-800/60 hover:bg-zinc-900/50 transition-colors'
            >
              <img src={item.image[0]} alt={item.name} className='w-10 h-10 object-cover rounded-md bg-zinc-800' />

              <div>
                <p className='text-zinc-200 text-sm font-medium'>{item.name}</p>
                <p className='text-zinc-600 text-xs mt-0.5'>{item.subCategory}</p>
              </div>

              <p className='text-zinc-400 text-sm hidden md:block'>{item.category}</p>

              <div className='hidden md:flex flex-col gap-0.5'>
                <p className='text-zinc-300 text-sm font-mono'>{currency}{item.price}</p>
                {item.originalPrice && (
                  <p className='text-zinc-600 text-xs font-mono line-through'>{currency}{item.originalPrice}</p>
                )}
              </div>

              {/* Edit + Delete buttons */}
              <div className='flex items-center justify-center gap-1.5 mx-auto'>
                {/* Edit */}
                <button
                  onClick={() => navigate(`/edit/${item._id}`)}
                  className='flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:text-zinc-200 hover:bg-zinc-700/60 transition-all'
                  title='Edit product'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/>
                    <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/>
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeProduct(item._id)}
                  className='flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all'
                  title='Delete product'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <polyline points='3 6 5 6 21 6'/>
                    <path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/>
                    <path d='M10 11v6M14 11v6'/>
                    <path d='M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default List