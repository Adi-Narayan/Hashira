import React, { useState, useEffect, useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // ── Inline error state per field ──
  const [errors, setErrors] = useState({})

  const setError = (field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }

  const clearError = (field) => {
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  const clearAllErrors = () => setErrors({})

  // Clear errors when switching states
  useEffect(() => {
    clearAllErrors()
  }, [currentState])

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    clearAllErrors();

    try {
      if (currentState === 'Sign Up') {
        const response = await axios.post(`${backendUrl}/api/user/register`, { name, email, password })
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
        } else {
          const msg = response.data.message || ''
          if (msg.toLowerCase().includes('email')) {
            setError('email', msg)
          } else if (msg.toLowerCase().includes('password')) {
            setError('password', msg)
          } else if (msg.toLowerCase().includes('exists')) {
            setError('email', msg)
          } else {
            setError('form', msg)
          }
        }

      } else if (currentState === 'Login') {
        const response = await axios.post(`${backendUrl}/api/user/login`, { email, password })
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
        } else {
          const msg = response.data.message || ''
          if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('user')) {
            setError('email', msg)
          } else if (msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('password')) {
            setError('password', msg)
          } else {
            setError('form', msg)
          }
        }

      } else if (currentState === 'Forgot Password') {
        const response = await axios.post(`${backendUrl}/api/user/forgot-password`, { email, newPassword })
        if (response.data.success) {
          clearAllErrors()
          setError('success', 'Password updated. Please login.')
          setTimeout(() => setCurrentState('Login'), 1500)
        } else {
          const msg = response.data.message || ''
          if (msg.toLowerCase().includes('user') || msg.toLowerCase().includes('email')) {
            setError('email', msg)
          } else {
            setError('form', msg)
          }
        }
      }

    } catch (error) {
      setError('form', 'Something went wrong. Please try again.')
    }
  }

  useEffect(() => {
    if (token) navigate('/')
  }, [token])

  // ── Reusable inline error/success component ──
  const FieldError = ({ field }) => {
    if (!errors[field]) return null
    return (
      <p className='flex items-center gap-1.5 text-xs text-red-500 mt-1'>
        <svg xmlns="http://www.w3.org/2000/svg" className='w-3.5 h-3.5 shrink-0' viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        {errors[field]}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {/* Form-level error */}
      {errors.form && (
        <div className='w-full flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded text-sm text-red-600'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 shrink-0' viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {errors.form}
        </div>
      )}

      {/* Success message */}
      {errors.success && (
        <div className='w-full flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded text-sm text-green-600'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 shrink-0' viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          {errors.success}
        </div>
      )}

      {/* Name — Sign Up only */}
      {currentState === 'Sign Up' && (
        <div className='w-full'>
          <input
            onChange={(e) => { setName(e.target.value); clearError('name') }}
            value={name}
            type="text"
            className={`w-full px-3 py-2 border ${errors.name ? 'border-red-400' : 'border-gray-800'}`}
            placeholder='Name'
          />
          <FieldError field='name' />
        </div>
      )}

      {/* Email */}
      <div className='w-full'>
        <input
          onChange={(e) => { setEmail(e.target.value); clearError('email') }}
          value={email}
          type="email"
          className={`w-full px-3 py-2 border ${errors.email ? 'border-red-400' : 'border-gray-800'}`}
          placeholder='Email'
        />
        <FieldError field='email' />
      </div>

      {/* Password / New Password */}
      <div className='w-full'>
        {currentState === 'Forgot Password' ? (
          <input
            onChange={(e) => { setNewPassword(e.target.value); clearError('password') }}
            value={newPassword}
            type="password"
            className={`w-full px-3 py-2 border ${errors.password ? 'border-red-400' : 'border-gray-800'}`}
            placeholder='New Password'
          />
        ) : (
          <input
            onChange={(e) => { setPassword(e.target.value); clearError('password') }}
            value={password}
            type="password"
            className={`w-full px-3 py-2 border ${errors.password ? 'border-red-400' : 'border-gray-800'}`}
            placeholder='Password'
          />
        )}
        <FieldError field='password' />
      </div>

      {/* Forgot / Create links */}
      {currentState !== 'Forgot Password' && (
        <div className='w-full flex justify-between text-sm mt-[-8px]'>
          <p onClick={() => setCurrentState('Forgot Password')} className='cursor-pointer hover:underline'>Forgot password?</p>
          {currentState === 'Login'
            ? <p onClick={() => setCurrentState('Sign Up')} className='cursor-pointer hover:underline'>Create Account</p>
            : <p onClick={() => setCurrentState('Login')} className='cursor-pointer hover:underline'>Login Here</p>
          }
        </div>
      )}

      <button className='bg-black text-white font-light px-8 py-2 mt-4 hover:bg-gray-800 transition-colors hover:cursor-pointer'>
        {currentState === 'Login' ? 'Sign In' : currentState === 'Sign Up' ? 'Sign Up' : 'Reset Password'}
      </button>
    </form>
  )
}

export default Login