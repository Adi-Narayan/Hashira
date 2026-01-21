import React from 'react'
import Title from '../components/Title'
import NewsLetterBox from '../components/NewsLetterBox'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'ABOUT'} text2={'US'} />
      </div>
      
      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img className='w-full md:max-w-[450px]' src={assets.about_img} alt=""/>
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
          <p>Welcome to HASHIRA, where bold fashion meets everyday comfort. We are more than just a clothing brand — we are a movement inspired by individuality, culture, and the desire to stand out without trying too hard. Every piece we create is designed to reflect strength, confidence, and effortless style, giving you the freedom to express who you truly are.</p>
          <p>At HASHIRA, we believe that fashion should be empowering, inclusive, and sustainable. Whether you're dressing up or down, HASHIRA offers timeless essentials and statement pieces that make you feel seen, heard, and unstoppable.</p>
          <b>Our Mission</b>  
          <p>Our mission at HASHIRA is to empower our customers with choice, convenience, and confidence. We're dedicated to providing a seamless shopping experience that exceeds expectations, from browsing and ordering to delivery and beyond.</p>      
        </div>
      </div>
      <div className='text-xl py-4'>
        <Title text1={'WHY'} text2={'CHOOSE US'}/>
      </div>
      <div className='flex flex-col md:flex-row text-sm mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Quality Assurance</b>
          <p className='text-gray-600'>At HASHIRA, quality is non-negotiable. Every garment goes through a meticulous design and production process, with attention to detail at every stitch. We source premium fabrics, partner with ethical manufacturers, and rigorously test each item to ensure it not only looks great — but lasts. Our commitment to craftsmanship means you can wear HASHIRA with confidence, knowing it’s built to perform and made to endure.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Convenience</b>
          <p className='text-gray-600'>We know your time is valuable — that’s why HASHIRA is built around convenience. From an intuitive online shopping experience to fast, reliable delivery and easy returns, every step is designed to be seamless. Whether you're browsing from your phone or placing an order late at night, HASHIRA is always just a few clicks away, bringing style to your doorstep without the stress.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Exceptional Customer Service</b>
          <p className='text-gray-600'>At HASHIRA, our relationship with you doesn’t end at checkout. We're committed to delivering exceptional customer service that’s personal, responsive, and genuinely helpful. Whether you need styling advice, support with your order, or have a question about sizing, our team is here to assist — quickly and kindly. Your satisfaction is our top priority, and we’re always just a message away.</p>
        </div>
      </div>

    

    </div>

  )
}

export default About