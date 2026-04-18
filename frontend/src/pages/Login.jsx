import React, { useState, useEffect, useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const Login = () => {
  const [currentState, setCurrentState] = useState('Login')
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otp, setOtp] = useState('')

  // show/hide toggles
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // OTP step: 'email' | 'verify'
  const [otpStep, setOtpStep] = useState('email')
  const [otpSending, setOtpSending] = useState(false)

  const [errors, setErrors] = useState({})

  const setError = (field, message) => setErrors(prev => ({ ...prev, [field]: message }))
  const clearError = (field) => setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  const clearAllErrors = () => setErrors({})

  useEffect(() => {
    clearAllErrors()
    setOtpStep('email')
    setOtp('')
    setNewPassword('')
    setShowPassword(false)
    setShowNewPassword(false)
  }, [currentState])

  const handleSendOtp = async () => {
    clearAllErrors()
    if (!email) { setError('email', 'Enter your email first'); return }
    setOtpSending(true)
    try {
      const res = await axios.post(`${backendUrl}/api/user/send-otp`, { email })
      if (res.data.success) {
        setOtpStep('verify')
        setError('success', 'OTP sent to your email. Check your inbox.')
      } else {
        setError('email', res.data.message)
      }
    } catch {
      setError('form', 'Something went wrong. Please try again.')
    } finally {
      setOtpSending(false)
    }
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    clearAllErrors()

    try {
      if (currentState === 'Sign Up') {
        const response = await axios.post(`${backendUrl}/api/user/register`, { name, email, password })
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
        } else {
          const msg = response.data.message || ''
          if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('exists')) setError('email', msg)
          else if (msg.toLowerCase().includes('password')) setError('password', msg)
          else setError('form', msg)
        }

      } else if (currentState === 'Login') {
        const response = await axios.post(`${backendUrl}/api/user/login`, { email, password })
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
        } else {
          const msg = response.data.message || ''
          if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('user')) setError('email', msg)
          else if (msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('password')) setError('password', msg)
          else setError('form', msg)
        }

      } else if (currentState === 'Forgot Password') {
        if (otpStep === 'email') {
          await handleSendOtp()
          return
        }
        // otpStep === 'verify'
        const response = await axios.post(`${backendUrl}/api/user/forgot-password`, { email, otp, newPassword })
        if (response.data.success) {
          clearAllErrors()
          setError('success', 'Password updated. Please login.')
          setTimeout(() => setCurrentState('Login'), 1500)
        } else {
          const msg = response.data.message || ''
          if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('code')) setError('otp', msg)
          else if (msg.toLowerCase().includes('user') || msg.toLowerCase().includes('email')) setError('email', msg)
          else setError('form', msg)
        }
      }

    } catch {
      setError('form', 'Something went wrong. Please try again.')
    }
  }

  useEffect(() => {
    if (token) navigate('/')
  }, [token])

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
          disabled={currentState === 'Forgot Password' && otpStep === 'verify'}
          className={`w-full px-3 py-2 border ${errors.email ? 'border-red-400' : 'border-gray-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder='Email'
        />
        <FieldError field='email' />
      </div>

      {/* Password (Login + Sign Up) */}
      {(currentState === 'Login' || currentState === 'Sign Up') && (
        <div className='w-full'>
          <div className='relative'>
            <input
              onChange={(e) => { setPassword(e.target.value); clearError('password') }}
              value={password}
              type={showPassword ? 'text' : 'password'}
              className={`w-full px-3 py-2 pr-10 border ${errors.password ? 'border-red-400' : 'border-gray-800'}`}
              placeholder='Password'
            />
            <button
              type='button'
              onClick={() => setShowPassword(v => !v)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
              tabIndex={-1}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <FieldError field='password' />
        </div>
      )}

      {/* Forgot Password flow */}
      {currentState === 'Forgot Password' && otpStep === 'verify' && (
        <>
          {/* OTP field */}
          <div className='w-full'>
            <input
              onChange={(e) => { setOtp(e.target.value); clearError('otp') }}
              value={otp}
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={`w-full px-3 py-2 border tracking-[0.3em] text-center ${errors.otp ? 'border-red-400' : 'border-gray-800'}`}
              placeholder='Enter 6-digit OTP'
            />
            <FieldError field='otp' />
          </div>

          {/* New password */}
          <div className='w-full'>
            <div className='relative'>
              <input
                onChange={(e) => { setNewPassword(e.target.value); clearError('password') }}
                value={newPassword}
                type={showNewPassword ? 'text' : 'password'}
                className={`w-full px-3 py-2 pr-10 border ${errors.password ? 'border-red-400' : 'border-gray-800'}`}
                placeholder='New Password'
              />
              <button
                type='button'
                onClick={() => setShowNewPassword(v => !v)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                tabIndex={-1}
              >
                <EyeIcon open={showNewPassword} />
              </button>
            </div>
            <FieldError field='password' />
          </div>

          <p
            onClick={handleSendOtp}
            className='text-xs text-gray-500 cursor-pointer hover:underline self-start -mt-2'
          >
            Resend OTP
          </p>
        </>
      )}

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

      {currentState === 'Forgot Password' && (
        <div className='w-full flex justify-end text-sm mt-[-8px]'>
          <p onClick={() => setCurrentState('Login')} className='cursor-pointer hover:underline'>Back to Login</p>
        </div>
      )}

      <button
        type='submit'
        disabled={otpSending}
        className='bg-black text-white font-light px-8 py-2 mt-4 hover:bg-gray-800 transition-colors hover:cursor-pointer disabled:opacity-60'
      >
        {currentState === 'Login' ? 'Sign In'
          : currentState === 'Sign Up' ? 'Sign Up'
          : otpStep === 'email' ? (otpSending ? 'Sending OTP...' : 'Send OTP')
          : 'Reset Password'}
      </button>
    </form>
  )
}

export default Login
