import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  {
    to: '/add',
    label: 'Add Items',
    icon: (
      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        <circle cx='12' cy='12' r='10'/>
        <line x1='12' y1='8' x2='12' y2='16'/>
        <line x1='8' y1='12' x2='16' y2='12'/>
      </svg>
    )
  },
  {
    to: '/list',
    label: 'Products',
    icon: (
      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        <line x1='8' y1='6' x2='21' y2='6'/>
        <line x1='8' y1='12' x2='21' y2='12'/>
        <line x1='8' y1='18' x2='21' y2='18'/>
        <line x1='3' y1='6' x2='3.01' y2='6'/>
        <line x1='3' y1='12' x2='3.01' y2='12'/>
        <line x1='3' y1='18' x2='3.01' y2='18'/>
      </svg>
    )
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: (
      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'/>
        <line x1='3' y1='6' x2='21' y2='6'/>
        <path d='M16 10a4 4 0 0 1-8 0'/>
      </svg>
    )
  },
  {
    to: '/reviews',
    label: 'Reviews',
    icon: (
      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'/>
      </svg>
    )
  }
]

const Sidebar = () => {
  return (
    <div className='w-56 min-h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col'>
      <nav className='flex flex-col gap-1 p-3 pt-6'>
        <p className='text-zinc-600 text-xs font-mono uppercase tracking-widest px-3 mb-3'>Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`
            }
          >
            {item.icon}
            <span className='hidden md:block'>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
