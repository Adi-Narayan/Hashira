import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post(backendUrl + '/api/user/admin', { email, password })
      if (response.data.success) {
        setToken(response.data.token)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-zinc-950 flex items-center justify-center px-4'>
      <div className='w-full max-w-sm'>

        {/* Logo */}
        <div className='flex justify-center mb-10'>
          <img src={assets.logo} alt='Logo' className='h-8 object-contain brightness-0 invert' />
        </div>

        {/* Card */}
        <div className='bg-zinc-900 border border-zinc-800 rounded-xl p-8'>
          <h1 className='text-zinc-100 text-lg font-semibold mb-1 tracking-tight'>Admin Panel</h1>
          <p className='text-zinc-500 text-sm mb-7'>Sign in to manage your store</p>

          <form onSubmit={onSubmitHandler} className='flex flex-col gap-4'>
            <div>
              <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>
                Email
              </label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='admin@example.com'
                required
                className='w-full bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors'
              />
            </div>

            <div>
              <label className='block text-zinc-400 text-xs font-medium mb-2 uppercase tracking-widest'>
                Password
              </label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='••••••••'
                required
                className='w-full bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors'
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              className='mt-2 w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className='text-center text-zinc-700 text-xs mt-6'>Hashira Admin — Restricted Access</p>
      </div>
    </div>
  )
}

export default Login
