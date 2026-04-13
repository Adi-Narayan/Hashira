import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const StatCard = ({ label, amount, highlight }) => (
  <div className={`bg-zinc-900 border rounded-xl p-6 flex flex-col gap-2 ${highlight ? 'border-zinc-600' : 'border-zinc-800'}`}>
    <p className='text-zinc-500 text-xs font-mono uppercase tracking-widest'>{label}</p>
    <p className={`text-2xl font-bold ${highlight ? 'text-zinc-100' : 'text-zinc-200'}`}>
      {currency}{amount.toLocaleString('en-IN')}
    </p>
  </div>
)

const Stats = ({ token }) => {
  const [stats, setStats] = useState({ collected: 0, pending: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    axios.get(backendUrl + '/api/order/stats', { headers: { token } })
      .then(res => {
        if (res.data.success) setStats(res.data)
        else toast.error(res.data.message)
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-zinc-100 text-xl font-semibold tracking-tight'>Revenue</h2>
        <p className='text-zinc-500 text-sm mt-1'>All non-failed orders</p>
      </div>

      {loading ? (
        <div className='py-16 text-center text-zinc-600 text-sm'>Loading stats...</div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <StatCard label='Collected (Paid)' amount={stats.collected} />
          <StatCard label='Pending (COD)' amount={stats.pending} />
          <StatCard label='Grand Total' amount={stats.total} highlight />
        </div>
      )}
    </div>
  )
}

export default Stats
