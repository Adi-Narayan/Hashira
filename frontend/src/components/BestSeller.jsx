import React, { useContext, useEffect, useState } from 'react'
import Title from './Title'
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';

const PAGE_SIZE = 5

const BestSeller = () => {
  const { products } = useContext(ShopContext);
  const [bestSeller, setBestSeller] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    // Fixed: was item.bestseller (always undefined) — model field is bestSeller
    const bestProduct = products.filter((item) => item.bestSeller);
    setBestSeller(bestProduct.slice(0, 10));
    setPage(0);
  }, [products])

  const totalPages = Math.ceil(bestSeller.length / PAGE_SIZE)
  const paginated = bestSeller.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className='my-10'>
      <div className='text-center text-3xl py-8'>
        <Title text1={'BEST'} text2={'SELLERS'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600'>
          HERE ARE SOME OF OUR BEST SELLERS!
        </p>
      </div>

      {/* Mobile & Tablet — horizontal scroll */}
      <div className='lg:hidden'>
        <div className='flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1'>
          {bestSeller.map((item, index) => (
            <div key={index} className='snap-start flex-shrink-0 w-40 sm:w-48'>
              <ProductItem id={item._id} name={item.name} image={item.image} price={item.price} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop — paginated grid */}
      <div className='hidden lg:block'>
        <div className='grid grid-cols-5 gap-4 gap-y-6'>
          {paginated.map((item, index) => (
            <ProductItem key={index} id={item._id} name={item.name} image={item.image} price={item.price} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className='flex justify-center items-center gap-2 mt-8'>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 0))}
              disabled={page === 0}
              className='w-8 h-8 flex items-center justify-center border border-gray-300 text-gray-500 hover:border-gray-800 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            >
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 text-sm border transition-colors ${
                  i === page
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'border-gray-300 text-gray-500 hover:border-gray-800 hover:text-gray-800'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
              disabled={page === totalPages - 1}
              className='w-8 h-8 flex items-center justify-center border border-gray-300 text-gray-500 hover:border-gray-800 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BestSeller