import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Edit from './pages/Edit'
import Reviews from './pages/Reviews'
import Stats from './pages/Stats'
import Login from './components/Login'
import { ToastContainer, toast } from 'react-toastify';

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '₹'

const isAuthFailure = (msg = '') => {
  const m = String(msg).toLowerCase()
  return m.includes('not authorized') || m.includes('login again') || m.includes('session expired')
}

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '');

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  // Global axios interceptor — if the backend says auth failed, force a clean logout once.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (response) => {
        if (response?.data && response.data.success === false && isAuthFailure(response.data.message)) {
          localStorage.removeItem('token')
          setToken('')
          toast.info('Session expired. Please login again.')
        }
        return response
      },
      (error) => {
        const msg = error?.response?.data?.message
        if (isAuthFailure(msg)) {
          localStorage.removeItem('token')
          setToken('')
          toast.info('Session expired. Please login again.')
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(id)
  }, [])

  return (
    <div className='bg-gray-100 min-h-screen'>
      <ToastContainer />
      {token === ""
        ? <Login setToken={setToken} />
        :
        <>
          <Navbar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path="/add" element={<Add token={token} />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/orders" element={<Orders token={token} />} />
                <Route path="/edit/:productId" element={<Edit token={token} />} />
                <Route path="/reviews" element={<Reviews token={token} />} />
                <Route path="/stats" element={<Stats token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      }
    </div>
  )
}

export default App
