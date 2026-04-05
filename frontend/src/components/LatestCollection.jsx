import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title'
import ProductItem from './ProductItem';

const PAGE_SIZE = 10

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const sorted = products.slice().sort((a, b) => b.date - a.date);
    setLatestProducts(sorted.slice(0, 20));
    setPage(0);
  }, [products])

  const totalPages = Math.ceil(latestProducts.length / PAGE_SIZE)
  const paginated = latestProducts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Title text1={'LATEST'} text2={'COLLECTIONS'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600'>
          DISCOVER OUR NEWEST ARRIVALS, HANDPICKED JUST FOR YOU
        </p>
      </div>

      {/* Mobile & Tablet — horizontal scroll */}
      <div className='lg:hidden'>
        <div className='flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1'>
          {latestProducts.map((item, index) => (
            <div key={index} className='snap-start flex-shrink-0 w-40 sm:w-48'>
              <ProductItem id={item._id} image={item.image} name={item.name} price={item.price} originalPrice={item.originalPrice} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop — paginated grid */}
      <div className='hidden lg:block'>
        <div className='grid grid-cols-5 gap-4 gap-y-6'>
          {paginated.map((item, index) => (
            <ProductItem key={index} id={item._id} image={item.image} name={item.name} price={item.price} originalPrice={item.originalPrice} />
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

export default LatestCollection