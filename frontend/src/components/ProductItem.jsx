import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import cldImg from '../utils/cldImg';

const ProductItem = ({ id, image, name, price, originalPrice }) => {
  const { currency } = useContext(ShopContext);

  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <Link to={`/product/${id}`} className="flex flex-col h-full cursor-pointer">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-gray-100 border border-black-300 rounded-lg hover:shadow-lg transition relative">
        <img
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          src={cldImg(image[0])}
          alt={name}
        />
        {hasDiscount && (
          <span className='absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded'>
            {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col flex-grow pt-2 px-1">
        <p className="text-m leading-tight min-h-[4px]">{name}</p>
        <div className='flex items-baseline gap-2 mt-0.5 flex-wrap'>
          <p className="text-m font-medium">{currency}{price}</p>
          {hasDiscount && (
            <p className="text-sm text-red-400 line-through">{currency}{originalPrice}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductItem;