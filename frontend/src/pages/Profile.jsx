// src/pages/Profile.jsx
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'

const Profile = () => {
  const { token, backendUrl } = useContext(ShopContext)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: { token }
      })
      if (res.data.success) {
        setFormData(res.data.user)
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error("Failed to fetch profile")
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.put(`${backendUrl}/api/user/profile`, formData, {
        headers: { token }
      })
      if (res.data.success) {
        toast.success("Profile updated")
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error("Failed to update profile")
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const onChangeHandler = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (loading) return <div className="p-5 text-center">Loading profile...</div>

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl mb-4">My Profile</h2>
      <form onSubmit={updateProfile} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChangeHandler}
          placeholder="Name"
          className="border rounded p-2"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onChangeHandler}
          placeholder="Email"
          className="border rounded p-2"
          required
        />
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={onChangeHandler}
          placeholder="Phone"
          className="border rounded p-2"
        />
        <button type="submit" className="bg-black text-white py-2 mt-2">Update Profile</button>
      </form>
    </div>
  )
}

export default Profile
