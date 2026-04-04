import React from 'react'
import { assets } from '../assets/assets'

const Navbar = ({ setToken }) => {
  return (
    <div className='bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 py-3'>
      <div className='flex items-center gap-3'>
        <img
          className='h-6 object-contain brightness-0 invert'
          src={assets.logo}
          alt='Logo'
        />
        <span className='text-zinc-600 text-xs font-mono tracking-widest uppercase'>Admin</span>
      </div>

      <button
        onClick={() => setToken('')}
        className='flex items-center gap-2 text-zinc-400 hover:text-zinc-100 text-xs font-medium uppercase tracking-widest transition-colors'
      >
        <span>Logout</span>
        <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/>
          <polyline points='16 17 21 12 16 7'/>
          <line x1='21' y1='12' x2='9' y2='12'/>
        </svg>
      </button>
    </div>
  )
}

export default Navbar
