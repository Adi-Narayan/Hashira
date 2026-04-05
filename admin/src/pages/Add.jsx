import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [category, setCategory] = useState('Men')
  const [subCategory, setSubCategory] = useState('Topwear')
  const [bestSeller, setBestSeller] = useState(false)
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(false)

  const toggleSize = (size) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('price', price)
      if (originalPrice) formData.append('originalPrice', originalPrice)
      formData.append('category', category)
      formData.append('subCategory', subCategory)
      formData.append('bestSeller', bestSeller)
      formData.append('sizes', JSON.stringify(sizes))
      if (image1) formData.append('image1', image1)
      if (image2) formData.append('image2', image2)
      if (image3) formData.append('image3', image3)
      if (image4) formData.append('image4', image4)

      const response = await axios.post(backendUrl + '/api/product/add', formData, {
        headers: { token },
      })

      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
        setPrice('')
        setOriginalPrice('')
        setSizes([])
        setBestSeller(false)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const ImageUpload = ({ id, file, setFile }) => (
    <label htmlFor={id} className='cursor-pointer group'>
      <div className='w-20 h-20 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden flex items-center justify-center group-hover:border-zinc-500 transition-colors'>
        {file ? (
          <img src={URL.createObjectURL(file)} alt='preview' className='w-full h-full object-cover' />
        ) : (
          <svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
            <rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/>
            <polyline points='21 15 16 10 5 21'/>
          </svg>
        )}
      </div>
      <input onChange={(e) => setFile(e.target.files[0])} type='file' id={id} hidden accept='image/*' />
    </label>
  )

  return (
    <div className='max-w-2xl'>
      <div className='mb-8'>
        <h2 className='text-zinc-100 text-xl font-semibold tracking-tight'>Add Product</h2>
        <p className='text-zinc-500 text-sm mt-1'>Fill in the details to list a new item</p>
      </div>

      <form onSubmit={onSubmitHandler} className='flex flex-col gap-6'>

        {/* Images */}
        <div>
          <label className='block text-zinc-400 text-xs font-medium mb-3 uppercase tracking-widest'>Product Images</label>
          <div className='flex gap-3'>
            <ImageUpload id='image1' file={image1} setFile={setImage1} />
            <ImageUpload id='image2' file={image2} setFile={setImage2} />
            <ImageUpload id='image3' file={image3} setFile={setImage3} />
            <ImageUpload id='image4' file={image4} setFile={setImage4} />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>Product Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. Slim Fit Oxford Shirt'
            required
            className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
          />
        </div>

        {/* Description */}
        <div>
          <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Describe the product...'
            required
            rows={3}
            className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors resize-none'
          />
        </div>

        {/* Category / Sub / Prices */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
            >
              <option value='Men'>Men</option>
              <option value='Women'>Women</option>
              <option value='Unisex'>Unisex</option>
            </select>
          </div>

          <div>
            <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>Sub Category</label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
            >
              <option value='Topwear'>Topwear</option>
              <option value='Bottomwear'>Bottomwear</option>
              <option value='Accessories'>Accessories</option>
            </select>
          </div>

          <div>
            <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>
              Sale Price (₹) <span className='text-zinc-600 normal-case tracking-normal'>— shown to customer</span>
            </label>
            <input
              type='number'
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder='e.g. 799'
              required
              className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
            />
          </div>

          <div>
            <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>
              Original Price (₹) <span className='text-zinc-600 normal-case tracking-normal'>— struck through in red</span>
            </label>
            <input
              type='number'
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder='e.g. 1299 (optional)'
              className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
            />
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label className='block text-zinc-400 text-xs font-medium mb-3 uppercase tracking-widest'>Sizes</label>
          <div className='flex gap-2'>
            {SIZES.map((size) => (
              <button
                key={size}
                type='button'
                onClick={() => toggleSize(size)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                  sizes.includes(size)
                    ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                    : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Bestseller */}
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => setBestSeller((p) => !p)}
            className={`w-10 h-5 rounded-full transition-colors relative ${bestSeller ? 'bg-zinc-100' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-zinc-900 transition-all ${bestSeller ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className='text-zinc-400 text-sm'>Mark as Bestseller</span>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='self-start bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm px-8 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </div>
  )
}

export default Add