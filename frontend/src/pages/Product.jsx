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
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAddToCart = () => {
    if (!size) return;
    
    setIsAdding(true);
    addToCart(productData._id, size);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      
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
            <img
              src={image}
              alt=""
              className="w-full h-auto rounded-xl border-2"
            />
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
                      : 'border-gray-300 bg-gray-100 hover:border-gray-400 hover:bg-gray-200 hover:scale-102'
                    }
                  `}
                  style={{
                    transform: item === size ? 'translateY(-1px)' : 'translateY(0)',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`
              bg-black text-white px-8 py-3 text-sm rounded-md
              transition-all duration-300
              ${isAdding 
                ? 'scale-95 opacity-80' 
                : 'hover:scale-105 hover:shadow-lg hover:bg-gray-800'
              }
              disabled:cursor-not-allowed
            `}
            style={{
              transform: isAdding ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            {isAdding ? 'ADDING...' : 'ADD TO CART'}
          </button>

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