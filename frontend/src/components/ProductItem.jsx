import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);

  return (
    <Link
      to={`/product/${id}`}
      className="flex flex-col h-full cursor-pointer"
    >
      {/* Image container with border and hover zoom */}
      <div className="aspect-square overflow-hidden bg-gray-100 border border-black-300 rounded-lg hover:shadow-lg transition">
        <img
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          src={image[0]}
          alt={name}
        />
      </div>

      {/* Text content outside the image - no hover effect */}
      <div className="flex flex-col flex-grow pt-2 px-1">
        <p className="text-m leading-tight min-h-[4px]">{name}</p>
        <p className="text-m font-medium">{currency}{price}</p>
      </div>
    </Link>
  );
};

export default ProductItem;
