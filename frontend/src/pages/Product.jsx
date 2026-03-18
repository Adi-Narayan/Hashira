import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);

  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);

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

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1);
    setSize('');
  }, [productId]);

  const handleAddToCart = () => {
    if (!size) return;

    setIsAdding(true);

    // Add to cart `quantity` times
    for (let i = 0; i < quantity; i++) {
      addToCart(productData._id, size);
    }

    setTimeout(() => {
      setIsAdding(false);
      setShowToast(true);
    }, 400);

    // Auto-hide toast after 2.5s
    setTimeout(() => {
      setShowToast(false);
    }, 2900);
  };

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">

      {/* ── Added to Cart Toast ── */}
      <div className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-5 py-3.5
        bg-black text-white text-sm font-medium rounded-full shadow-2xl
        transition-all duration-300
        ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        {/* Checkmark */}
        <span className='w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-3 h-3 text-black' viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </span>
        {quantity} × {productData.name} added to cart
      </div>

      {/* ----- Product Data ----- */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">

        {/* ----- Product Images ----- */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">

          {/* Thumbnails */}
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

          {/* Main Image */}
          <div className="w-full sm:w-[80%]">
            <img src={image} alt="" className="w-full h-auto rounded-xl border-2" />
          </div>
        </div>

        {/* ----- Product Information ----- */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>

          <p className="mt-5 text-3xl font-medium">
            {currency}{productData.price}
          </p>

          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>

          {/* Size selector */}
          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2">
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

          {/* ── Quantity selector ── */}
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

          {/* Add to cart button */}
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