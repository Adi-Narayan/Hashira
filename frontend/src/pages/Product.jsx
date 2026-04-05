import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
// Drop your size chart image into src/assets/ as size_chart.png
// When the chart is updated, just replace that file — no code changes needed
import sizeChartImg from '../assets/size_chart.jpeg';

// Size chart link only appears for Topwear — add 'Bottomwear' here when that chart is ready
const SIZE_CHART_SUBCATEGORIES = new Set(['Topwear']);

// ─── Size Chart Modal ─────────────────────────────────────────────────────────

const SizeChartModal = ({ onClose }) => {

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={handleBackdrop}
      className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4'
    >
      <div className='bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden'>

        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
          <h2 className='text-sm font-semibold text-gray-900 tracking-tight'>Size Chart</h2>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500'
            aria-label='Close'
          >
            <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
              <line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>
            </svg>
          </button>
        </div>

        {/* Chart image */}
        <div className='p-4'>
          <img
            src={sizeChartImg}
            alt='Size Chart'
            className='w-full h-auto object-contain rounded-lg'
          />
        </div>

        {/* Footer */}
        <div className='px-5 py-3 bg-gray-50 border-t border-gray-100'>
          <p className='text-xs text-gray-400'>
            Measurements are garment measurements. When in doubt, size up.
          </p>
        </div>

      </div>
    </div>
  );
};

// ─── Product Page ─────────────────────────────────────────────────────────────

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);

  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        setImage(item.image[0]);
        return null;
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  useEffect(() => {
    setQuantity(1);
    setSize('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  const handleAddToCart = () => {
    if (!size) return;
    setIsAdding(true);
    for (let i = 0; i < quantity; i++) {
      addToCart(productData._id, size);
    }
    setTimeout(() => {
      setIsAdding(false);
      setShowToast(true);
    }, 400);
    setTimeout(() => {
      setShowToast(false);
    }, 2900);
  };

  const hasSizeChart = SIZE_CHART_SUBCATEGORIES.has(productData?.subCategory);

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">

      {/* ── Added to Cart Toast ── */}
      <div className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-40
        flex items-center gap-3 px-5 py-3.5
        bg-black text-white text-sm font-medium rounded-full shadow-2xl
        transition-all duration-300
        ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        <span className='w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-3 h-3 text-black' viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </span>
        {quantity} × {productData.name} added to cart
      </div>

      {/* ── Size Chart Modal ── */}
      {showSizeChart && (
        <SizeChartModal onClose={() => setShowSizeChart(false)} />
      )}

      {/* ----- Product Layout ----- */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">

        {/* ----- Images ----- */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                key={index}
                src={item}
                onClick={() => setImage(item)}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer rounded-lg border-2"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img src={image} alt="" className="w-full h-auto rounded-xl border-2" />
          </div>
        </div>

        {/* ----- Info ----- */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>

          <p className="mt-5 text-3xl font-medium">
            {currency}{productData.price}
          </p>
          {productData.originalPrice && productData.originalPrice > productData.price && (
            <p className="mt-1 text-base text-red-400 line-through">
              {currency}{productData.originalPrice}
            </p>
          )}

          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>

          {/* Size selector */}
          <div className="flex flex-col gap-4 my-8">
            <div className='flex items-center justify-between md:w-4/5'>
              <p>Select Size</p>
              {hasSizeChart && (
                <button
                  onClick={() => setShowSizeChart(true)}
                  className='flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M21 3H3v6l9 12 9-12V3z'/><line x1='3' y1='9' x2='21' y2='9'/>
                    <line x1='9' y1='3' x2='9' y2='9'/><line x1='15' y1='3' x2='15' y2='9'/>
                  </svg>
                  Size Chart
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {productData.sizes.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSize(item)}
                  className={`
                    border py-2 px-4 rounded-md
                    transition-all duration-200
                    ${item === size
                      ? 'border-orange-500 bg-orange-50 scale-105 shadow-sm'
                      : 'border-gray-300 bg-gray-100 hover:border-gray-400 hover:bg-gray-200'
                    }
                  `}
                  style={{ transform: item === size ? 'translateY(-1px)' : 'translateY(0)' }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex flex-col gap-2 mb-8">
            <p>Quantity</p>
            <div className="flex items-center gap-0 w-fit border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
              <span className="w-10 h-9 flex items-center justify-center text-sm font-medium border-x border-gray-300 select-none">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(99, q + 1))}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
                disabled={quantity >= 99}
                aria-label="Increase quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !size}
            className={`
              bg-black text-white px-8 py-3 text-sm rounded-md
              transition-all duration-300
              ${isAdding
                ? 'scale-95 opacity-80'
                : !size
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-105 hover:shadow-lg hover:bg-gray-800'
              }
            `}
          >
            {isAdding ? 'ADDING...' : 'ADD TO CART'}
          </button>

          {!size && (
            <p className="mt-2 text-xs text-gray-400">Please select a size first</p>
          )}

          <hr className="mt-8 sm:w-4/5" />
        </div>
      </div>

      {/* ----- Related Products ----- */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.subCategory}
      />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;