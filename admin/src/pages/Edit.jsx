import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

// Slot: holds either a new File (to be uploaded) or an existing URL string (kept as-is)
const ImageSlot = ({ id, existing, file, setFile, onClear }) => {
  const preview = file ? URL.createObjectURL(file) : existing || null

  return (
    <div className='relative group'>
      <label htmlFor={id} className='cursor-pointer'>
        <div className='w-20 h-20 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden flex items-center justify-center hover:border-zinc-500 transition-colors'>
          {preview ? (
            <img src={preview} alt='preview' className='w-full h-full object-cover' />
          ) : (
            <svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5 text-zinc-600' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
              <rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/>
              <polyline points='21 15 16 10 5 21'/>
            </svg>
          )}
        </div>
        <input onChange={(e) => setFile(e.target.files[0])} type='file' id={id} hidden accept='image/*' />
      </label>
      {preview && (
        <button
          type='button'
          onClick={onClear}
          className='absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-400 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
          title='Remove image'
        >×</button>
      )}
    </div>
  )
}

const Edit = ({ token }) => {
  const { productId } = useParams()
  const navigate = useNavigate()

  // Existing Cloudinary URLs loaded from DB
  const [existingImages, setExistingImages] = useState([null, null, null, null])
  // New files selected to replace a slot
  const [file1, setFile1] = useState(null)
  const [file2, setFile2] = useState(null)
  const [file3, setFile3] = useState(null)
  const [file4, setFile4] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [category, setCategory] = useState('Men')
  const [subCategory, setSubCategory] = useState('Topwear')
  const [bestSeller, setBestSeller] = useState(false)
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.post(backendUrl + '/api/product/single', { productId })
        if (res.data.success) {
          const p = res.data.product
          setName(p.name)
          setDescription(p.description)
          setPrice(String(p.price))
          setOriginalPrice(p.originalPrice ? String(p.originalPrice) : '')
          setCategory(p.category)
          setSubCategory(p.subCategory)
          setBestSeller(p.bestSeller || false)
          setSizes(p.sizes || [])
          // Pad/trim to exactly 4 slots
          const imgs = [...(p.image || []), null, null, null, null].slice(0, 4)
          setExistingImages(imgs)
        } else {
          toast.error(res.data.message)
          navigate('/list')
        }
      } catch (err) {
        toast.error(err.message)
        navigate('/list')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  const toggleSize = (size) => {
    setSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  const clearSlot = (index) => {
    setExistingImages(prev => prev.map((url, i) => i === index ? null : url))
    const setters = [setFile1, setFile2, setFile3, setFile4]
    setters[index](null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('id', productId)
      formData.append('name', name)
      formData.append('description', description)
      formData.append('price', price)
      formData.append('originalPrice', originalPrice)
      formData.append('category', category)
      formData.append('subCategory', subCategory)
      formData.append('bestSeller', bestSeller)
      formData.append('sizes', JSON.stringify(sizes))

      // Send existing URLs so backend knows what to keep for unchanged slots
      const currentExisting = [
        file1 ? null : existingImages[0],
        file2 ? null : existingImages[1],
        file3 ? null : existingImages[2],
        file4 ? null : existingImages[3],
      ]
      formData.append('existingImages', JSON.stringify(currentExisting))

      if (file1) formData.append('image1', file1)
      if (file2) formData.append('image2', file2)
      if (file3) formData.append('image3', file3)
      if (file4) formData.append('image4', file4)

      const res = await axios.post(backendUrl + '/api/product/edit', formData, {
        headers: { token },
      })

      if (res.data.success) {
        toast.success(res.data.message)
        navigate('/list')
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className='py-16 text-center text-zinc-600 text-sm'>Loading product...</div>
  }

  return (
    <div className='max-w-2xl'>
      <div className='mb-8 flex items-center gap-4'>
        <button
          onClick={() => navigate('/list')}
          className='text-zinc-500 hover:text-zinc-300 transition-colors'
          title='Back to list'
        >
          <svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M19 12H5M12 5l-7 7 7 7'/>
          </svg>
        </button>
        <div>
          <h2 className='text-zinc-100 text-xl font-semibold tracking-tight'>Edit Product</h2>
          <p className='text-zinc-500 text-sm mt-0.5'>Changes are saved immediately to the database</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className='flex flex-col gap-6'>

        {/* Images */}
        <div>
          <label className='block text-zinc-400 text-xs font-medium mb-3 uppercase tracking-widest'>
            Product Images <span className='text-zinc-600 normal-case tracking-normal'>— click to replace, × to remove</span>
          </label>
          <div className='flex gap-3'>
            <ImageSlot id='edit-img1' existing={existingImages[0]} file={file1} setFile={setFile1} onClear={() => clearSlot(0)} />
            <ImageSlot id='edit-img2' existing={existingImages[1]} file={file2} setFile={setFile2} onClear={() => clearSlot(1)} />
            <ImageSlot id='edit-img3' existing={existingImages[2]} file={file3} setFile={setFile3} onClear={() => clearSlot(2)} />
            <ImageSlot id='edit-img4' existing={existingImages[3]} file={file4} setFile={setFile4} onClear={() => clearSlot(3)} />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>Product Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
          />
        </div>

        {/* Description */}
        <div>
          <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
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
              onChange={e => setCategory(e.target.value)}
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
              onChange={e => setSubCategory(e.target.value)}
              className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
            >
              <option value='Topwear'>Topwear</option>
              <option value='Bottomwear'>Bottomwear</option>
              <option value='Accessories'>Accessories</option>
            </select>
          </div>

          <div>
            <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>
              Sale Price (₹)
            </label>
            <input
              type='number'
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
              className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
            />
          </div>

          <div>
            <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>
              Original Price (₹) <span className='text-zinc-600 normal-case tracking-normal'>— optional</span>
            </label>
            <input
              type='number'
              value={originalPrice}
              onChange={e => setOriginalPrice(e.target.value)}
              placeholder='e.g. 1299'
              className='w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-500 transition-colors'
            />
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label className='block text-zinc-400 text-xs font-medium mb-3 uppercase tracking-widest'>Sizes</label>
          <div className='flex gap-2'>
            {SIZES.map(size => (
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
            onClick={() => setBestSeller(p => !p)}
            className={`w-10 h-5 rounded-full transition-colors relative ${bestSeller ? 'bg-zinc-100' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-zinc-900 transition-all ${bestSeller ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className='text-zinc-400 text-sm'>Mark as Bestseller</span>
        </div>

        <div className='flex gap-3'>
          <button
            type='submit'
            disabled={saving}
            className='bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm px-8 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type='button'
            onClick={() => navigate('/list')}
            className='text-zinc-500 hover:text-zinc-300 text-sm px-4 py-2.5 transition-colors'
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default Edit
