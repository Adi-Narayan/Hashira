import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';

const Navbar = () => {

    const [visible, setVisible] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { setShowSearch, getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext)
    const location = useLocation();
    const isHome = location.pathname === '/';

    const logout = () => {
        navigate('/login')
        localStorage.removeItem('token')
        setToken('')
        setCartItems({})
        setProfileOpen(false);
    }

    return (
        <>
            {/* ── Announcement Bar ── */}
            <div className='w-full bg-black text-white overflow-hidden'>
                <div className='flex sm:hidden py-2 whitespace-nowrap'>
                    <div className='animate-marquee flex gap-16 text-[11px] tracking-widest uppercase font-light'>
                        {[...Array(6)].map((_, i) => (
                            <span key={i} className='flex items-center gap-2'>
                                <span className='text-white/40'>✦</span>
                                Buy 2+ products &amp; unlock
                                <span className='font-semibold text-white'> Free Shipping</span>
                            </span>
                        ))}
                    </div>
                </div>
                <div className='hidden sm:flex items-center justify-center py-2 gap-2 text-[11px] tracking-widest uppercase font-light'>
                    <span className='text-white/40'>✦</span>
                    Buy 2 or more products &amp; unlock
                    <span className='font-semibold text-white ml-1'>Free Shipping</span>
                    <span className='text-white/40'>✦</span>
                </div>
            </div>

            {/* ── Main Navbar ── */}
            {/*
                FIX: Use a 3-column grid on mobile so the logo is truly centered
                and the icons on the right can never bleed into it.
                On sm+ we fall back to the original flex layout.
            */}
            <div className='grid grid-cols-3 sm:flex sm:items-center sm:justify-between py-5 pt-18 pb-14 font-medium mb-8 relative'>

                {/* Left — Desktop Nav Links (hidden on mobile, left cell is empty/spacer) */}
                <ul className='hidden sm:flex gap-5 text-sm text-gray-700'>
                    {[['/', 'HOME'], ['/collection', 'COLLECTIONS'], ['/about', 'ABOUT'], ['/contact', 'CONTACT']].map(([path, label]) => (
                        <NavLink key={path} to={path} className={({ isActive }) =>
                            `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-black' : 'hover:text-black'}`
                        }>
                            <p>{label}</p>
                            <hr className='w-2/4 border-none h-[1.5px] bg-black hidden' />
                        </NavLink>
                    ))}
                </ul>

                {/* Center — Logo (col-start-2 centres it in the grid on mobile) */}
                <Link to='/' className='flex justify-center items-center sm:absolute sm:left-1/2 sm:-translate-x-1/2'>
                    <img src={assets.logo} className='w-36' alt="Logo" />
                </Link>

                {/* Right — Actions */}
                <div className='flex items-center justify-end gap-3 sm:gap-4'>

                    {/* Search — hidden on home page */}
                    {!isHome && (
                        <button
                            onClick={() => setShowSearch(true)}
                            className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors'
                            aria-label="Search"
                        >
                            <img src={assets.search_icon} className='w-4' alt="Search" />
                        </button>
                    )}

                    {/* Auth — Login dropdown OR Account dropdown */}
                    {!token ? (
                        <div className='relative'>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className='flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-full hover:border-black transition-all duration-200 bg-white'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 text-gray-700' viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                                </svg>
                                <span className='hidden sm:inline text-gray-700'>Account</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </button>

                            {profileOpen && (
                                <div className='fixed inset-0 z-10' onClick={() => setProfileOpen(false)} />
                            )}

                            {profileOpen && (
                                <div className='absolute right-0 mt-2 z-20 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden'>
                                    <button
                                        onClick={() => { navigate('/login'); setProfileOpen(false); }}
                                        className='w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors'
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 text-gray-400' viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                                        </svg>
                                        Login Now
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='relative'>
                            {/* Account Button */}
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className='flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-full hover:border-black transition-all duration-200 bg-white'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 text-gray-700' viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                                </svg>
                                <span className='hidden sm:inline text-gray-700'>Account</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </button>

                            {/* Backdrop */}
                            {profileOpen && (
                                <div className='fixed inset-0 z-10' onClick={() => setProfileOpen(false)} />
                            )}

                            {/* Dropdown */}
                            {profileOpen && (
                                <div className='absolute right-0 mt-2 z-20 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden'>

                                    {/* Orders */}
                                    <button
                                        onClick={() => { navigate('/orders'); setProfileOpen(false); }}
                                        className='w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors'
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 text-gray-400' viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 7H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM9 3h6a1 1 0 0 1 1 1v3H8V4a1 1 0 0 1 1-1zm2 10H8v-2h3v2zm0 3H8v-2h3v2zm5-3h-3v-2h3v2zm0 3h-3v-2h3v2z"/>
                                        </svg>
                                        My Orders
                                    </button>

                                    {/* Divider before logout */}
                                    <div className='border-t border-gray-100 mx-3' />

                                    {/* Logout */}
                                    <button
                                        onClick={logout}
                                        className='w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors'
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16 13v-2H7V8l-5 4 5 4v-3z"/>
                                            <path d="M20 3h-9a2 2 0 0 0-2 2v4h2V5h9v14h-9v-4H9v4a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart */}
                    <Link to='/cart' className='relative w-8 h-8 flex items-center justify-center'>
                        <img src={assets.cart_icon} className='w-5 min-w-5' alt="Cart" />
                        {getCartCount() > 0 && (
                            <span className='absolute -right-1 -bottom-1 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-[8px] font-bold'>
                                {getCartCount()}
                            </span>
                        )}
                    </Link>

                    {/* Hamburger — mobile only */}
                    <button
                        onClick={() => setVisible(true)}
                        className='sm:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors'
                        aria-label="Menu"
                    >
                        <img src={assets.menu_icon} className='w-5' alt="Menu" />
                    </button>
                </div>
            </div>

            {/* ── Mobile Sidebar ── */}
            <div className={`fixed top-0 right-0 bottom-0 z-50 bg-white transition-all duration-300 shadow-2xl ${visible ? 'w-72' : 'w-0'}`}>
                <div className='flex flex-col h-full text-gray-600 overflow-hidden'>

                    {/* Sidebar Header */}
                    <div onClick={() => setVisible(false)} className='flex items-center gap-3 p-5 cursor-pointer border-b border-gray-100'>
                        <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 rotate-180' viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 19l7-7-7-7v14z"/>
                        </svg>
                        <p className='text-sm font-medium'>Close Menu</p>
                    </div>

                    {/* Nav Links */}
                    <nav className='flex flex-col mt-2'>
                        {[['/', 'HOME'], ['/collection', 'COLLECTIONS'], ['/about', 'ABOUT'], ['/contact', 'CONTACT']].map(([path, label]) => (
                            <NavLink
                                key={path}
                                onClick={() => setVisible(false)}
                                className={({ isActive }) =>
                                    `py-3.5 px-6 text-sm tracking-widest border-b border-gray-50 transition-colors ${isActive ? 'text-black font-semibold bg-gray-50' : 'hover:bg-gray-50'}`
                                }
                                to={path}
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Mobile Auth Section */}
                    <div className='mt-auto border-t border-gray-100 p-5 flex flex-col gap-3'>
                        {!token ? (
                            /* ── Not logged in: "Login Now" is the priority CTA ── */
                            <button
                                onClick={() => { navigate('/login'); setVisible(false); }}
                                className='w-full py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors'
                            >
                                Login Now
                            </button>
                        ) : (
                            <>
                                {/* Orders */}
                                <button
                                    onClick={() => { navigate('/orders'); setVisible(false); }}
                                    className='w-full flex items-center gap-3 py-2.5 px-4 text-sm text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20 7H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM9 3h6a1 1 0 0 1 1 1v3H8V4a1 1 0 0 1 1-1zm2 10H8v-2h3v2zm0 3H8v-2h3v2zm5-3h-3v-2h3v2zm0 3h-3v-2h3v2z"/>
                                    </svg>
                                    My Orders
                                </button>
                                {/* Logout */}
                                <button
                                    onClick={() => { logout(); setVisible(false); }}
                                    className='w-full flex items-center gap-3 py-2.5 px-4 text-sm text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors'
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 13v-2H7V8l-5 4 5 4v-3z"/>
                                        <path d="M20 3h-9a2 2 0 0 0-2 2v4h2V5h9v14h-9v-4H9v4a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                                    </svg>
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile sidebar backdrop */}
            {visible && (
                <div
                    className='fixed inset-0 z-40 bg-black/30 sm:hidden'
                    onClick={() => setVisible(false)}
                />
            )}
        </>
    )
}

export default Navbar