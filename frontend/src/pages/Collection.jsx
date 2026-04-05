import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets';
import ProductItem from '../components/ProductItem'

const FilterCheckbox = ({ value, label, checked, onChange }) => (
  <label className='flex items-center gap-2.5 cursor-pointer group'>
    <div className={`w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0 transition-colors ${
      checked ? 'bg-gray-800 border-gray-800' : 'border-gray-400 group-hover:border-gray-600'
    }`}>
      {checked && (
        <svg className='w-2 h-2 text-white' viewBox='0 0 10 10' fill='none'>
          <path d='M1.5 5L4 7.5L8.5 2.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
        </svg>
      )}
    </div>
    <input type='checkbox' value={value} onChange={onChange} className='hidden' />
    <span className={`text-sm transition-colors ${checked ? 'text-gray-800 font-medium' : 'text-gray-600 group-hover:text-gray-800'}`}>
      {label}
    </span>
  </label>
)

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relevance');

  const toggleCategory = (e) => {
    const val = e.target.value
    setCategory(prev =>
      prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
    )
  }

  const toggleSubCategory = (e) => {
    const val = e.target.value
    setSubCategory(prev =>
      prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
    )
  }

  const applyFilter = () => {
    let productsCopy = products.slice();

    if (showSearch && search) {
      productsCopy = productsCopy.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter(item =>
        category.map(c => c.toLowerCase()).includes(item.category.toLowerCase())
      );
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter(item =>
        subCategory.map(sc => sc.toLowerCase()).includes(item.subCategory.toLowerCase())
      );
    }

    setFilterProducts(productsCopy)
  }

  const sortProduct = () => {
    let fpCopy = filterProducts.slice();
    switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a, b) => a.price - b.price))
        break;
      case 'high-low':
        setFilterProducts(fpCopy.sort((a, b) => b.price - a.price))
        break;
      default:
        applyFilter();
        break;
    }
  }

  useEffect(() => { applyFilter() }, [category, subCategory, search, showSearch, products])
  useEffect(() => { sortProduct() }, [sortType])

  return (
    <div className='flex flex-col sm:flex-row gap-4 sm:gap-10 pt-10 border-t'>

      {/* ── Filter Sidebar ── */}
      <div className='w-full sm:min-w-60 sm:w-60'>

        {/* Mobile toggle */}
        <button
          onClick={() => setShowFilter(!showFilter)}
          className='my-2 w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 text-base font-medium tracking-wide'
        >
          <span>FILTERS</span>
          <img
            className={`h-3 sm:hidden transition-transform duration-200 ${showFilter ? 'rotate-90' : ''}`}
            src={assets.dropdown_icon}
            alt=''
          />
        </button>

        <div className={`${showFilter ? 'block' : 'hidden'} sm:block`}>

          {/* Category */}
          <div className='border border-gray-300 pl-5 pr-4 py-4 my-5'>
            <p className='mb-3 text-xs font-semibold tracking-widest text-gray-500 uppercase'>Category</p>
            <div className='flex flex-col gap-3'>
              <FilterCheckbox value='Men' label='Men' checked={category.includes('Men')} onChange={toggleCategory} />
              <FilterCheckbox value='Women' label='Women' checked={category.includes('Women')} onChange={toggleCategory} />
              <FilterCheckbox value='Unisex' label='Unisex' checked={category.includes('Unisex')} onChange={toggleCategory} />
            </div>
          </div>

          {/* Sub-Category */}
          <div className='border border-gray-300 pl-5 pr-4 py-4 my-5'>
            <p className='mb-3 text-xs font-semibold tracking-widest text-gray-500 uppercase'>Type</p>
            <div className='flex flex-col gap-3'>
              <FilterCheckbox value='Topwear' label='Topwear' checked={subCategory.includes('Topwear')} onChange={toggleSubCategory} />
              <FilterCheckbox value='Bottomwear' label='Bottomwear' checked={subCategory.includes('Bottomwear')} onChange={toggleSubCategory} />
              <FilterCheckbox value='Accessories' label='Accessories' checked={subCategory.includes('Accessories')} onChange={toggleSubCategory} />
            </div>
          </div>

          {(category.length > 0 || subCategory.length > 0) && (
            <button
              onClick={() => { setCategory([]); setSubCategory([]) }}
              className='text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors mb-2'
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className='flex-1 min-w-0'>
        {/* Header row — stacks on mobile to prevent overflow */}
        <div className='flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-4'>
          <div className='text-base sm:text-2xl'>
            <span className='text-gray-400 font-light'>ALL </span>
            <span className='font-medium'>COLLECTIONS</span>
            <span className='text-sm font-normal text-gray-400 ml-2'>
              ({filterProducts.length} items)
            </span>
          </div>
          <select
            onChange={(e) => setSortType(e.target.value)}
            value={sortType}
            className='border border-gray-300 text-sm px-3 py-1.5 text-gray-600 focus:outline-none focus:border-gray-500 w-full xs:w-auto'
          >
            <option value='relevance'>Sort: Relevance</option>
            <option value='low-high'>Price: Low to High</option>
            <option value='high-low'>Price: High to Low</option>
          </select>
        </div>

        {filterProducts.length === 0 ? (
          <div className='py-20 text-center text-gray-400 text-sm'>
            No products match your filters.
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
            {filterProducts.map((item, index) => (
              <ProductItem
                key={index}
                id={item._id}
                image={item.image}
                name={item.name}
                price={item.price}
                originalPrice={item.originalPrice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Collection