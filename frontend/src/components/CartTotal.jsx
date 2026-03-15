import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';

const CartTotal = () => {

  const { currency, delivery_fee, getFinalDeliveryFee, getCartAmount, getCartCount } = useContext(ShopContext);

  const isFreeShipping = getCartCount() > 1;
  const finalFee = getFinalDeliveryFee();

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTAL'} />
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>

        {/* Subtotal */}
        <div className='flex justify-between'>
          <p>Subtotal</p>
          <p>{currency}{getCartAmount()}.00</p>
        </div>
        <hr />

        {/* Shipping Fee */}
        <div className='flex justify-between items-center'>
          <p>Shipping Fee</p>
          <div className='flex items-center gap-2'>
            {isFreeShipping ? (
              <>
                <span className='line-through text-gray-400'>{currency}{delivery_fee}.00</span>
                <span className='text-green-600 font-semibold'>FREE</span>
              </>
            ) : (
              <p>{currency}{delivery_fee}.00</p>
            )}
          </div>
        </div>

        {/* ✅ Free shipping unlocked banner */}
        {isFreeShipping && (
          <div className='flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2 mt-1'>
            <span className='text-green-600 text-base'>🎉</span>
            <p className='text-green-700 text-xs font-medium'>You've unlocked free shipping!</p>
          </div>
        )}

        {/* ✅ Nudge to unlock free shipping */}
        {!isFreeShipping && getCartAmount() > 0 && (
          <div className='flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-1'>
            <span className='text-amber-500 text-base'>🚚</span>
            <p className='text-amber-700 text-xs font-medium'>Add 1 more product to unlock free shipping!</p>
          </div>
        )}

        <hr />

        {/* Total */}
        <div className='flex justify-between'>
          <b>Total</b>
          <b>{currency}{getCartAmount() === 0 ? 0 : getCartAmount() + finalFee}.00</b>
        </div>

      </div>
    </div>
  )
}

export default CartTotal