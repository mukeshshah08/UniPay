import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSocket } from '../hooks/useSocket'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

const MerchantDashboard = ({ merchant, onLogout }) => {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    successRate: 0
  })
  const [balances, setBalances] = useState({
    grossCaptured: 0,
    pending: 0,
    failed: 0,
    fees: 0,
    netSettled: 0
  })
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  // Real-time socket connection
  useSocket(merchant?.merchant?._id, {
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
    onPaymentAuthorized: (data) => {
      console.log('Payment authorized:', data)
      addNotification('Payment Authorized', `₹${(data.payment.amount / 100).toFixed(2)} - ${data.payment.transactionId}`, 'info')
      fetchTransactions()
      fetchRevenueData()
    },
    onPaymentCaptured: (data) => {
      console.log('Payment captured:', data)
      addNotification('Payment Captured', `₹${(data.payment.amount / 100).toFixed(2)} - ${data.payment.transactionId}`, 'success')
      fetchTransactions()
      fetchRevenueData()
    },
    onPaymentRefunded: (data) => {
      console.log('Payment refunded:', data)
      addNotification('Payment Refunded', `₹${(data.refund.amount / 100).toFixed(2)} - ${data.payment.transactionId}`, 'warning')
      fetchTransactions()
      fetchRevenueData()
    },
    onPaymentFailed: (data) => {
      console.log('Payment failed:', data)
      addNotification('Payment Failed', `Transaction ${data.payment.transactionId} failed`, 'error')
      fetchTransactions()
      fetchRevenueData()
    }
  })

  const addNotification = (title, message, type = 'info') => {
    const notification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date()
    }
    setNotifications(prev => [notification, ...prev].slice(0, 5)) // Keep last 5
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  useEffect(() => {
    fetchTransactions()
    fetchRevenueData()
    
    // Listen for refresh events
    const handleRefresh = () => {
      fetchTransactions()
      fetchRevenueData()
    }
    
    window.addEventListener('refreshDashboard', handleRefresh)
    
    return () => {
      window.removeEventListener('refreshDashboard', handleRefresh)
    }
  }, [merchant])

  const fetchTransactions = async () => {
    if (!merchant?.merchant?._id) return
    
    setLoading(true)
    try {
      // Fetch payments for this merchant
      const res = await fetch(`${API_BASE}/payments/merchant/${merchant.merchant._id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch transactions')
      }
      const payments = await res.json()
      
      console.log('Fetched payments:', payments.length, 'for merchant:', merchant.merchant._id)
      
      // Transform payments to transaction format
      const transformedTransactions = payments.map(payment => ({
        id: payment.transactionId || payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status === 'captured' ? 'success' : (payment.status === 'authorized' || payment.status === 'pending') ? 'pending' : 'failed',
        method: payment.method,
        customer: 'customer@example.com', // You can add customer info to orders
        timestamp: payment.createdAt,
        orderId: payment.orderId?._id || payment.orderId,
        paymentId: payment._id
      }))
      
      // Sort transactions by date (most recent first)
      const sortedTransactions = transformedTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      console.log('Transformed transactions:', sortedTransactions.length)
      setTransactions(sortedTransactions)
      
      const totalAmount = transformedTransactions.reduce((sum, txn) => sum + (txn.status === 'success' ? txn.amount : 0), 0)
      const successCount = transformedTransactions.filter(txn => txn.status === 'success').length
      const successRate = transformedTransactions.length > 0 ? (successCount / transformedTransactions.length) * 100 : 0
      
      setStats({
        totalAmount,
        totalTransactions: transformedTransactions.length,
        successRate
      })

      // Fetch balances for this merchant
      const balRes = await fetch(`${API_BASE}/analytics/merchant/${merchant.merchant._id}/balances`)
      if (balRes.ok) {
        const bal = await balRes.json()
        setBalances(bal)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      // Fallback to empty state
      setTransactions([])
      setStats({ totalAmount: 0, totalTransactions: 0, successRate: 0 })
      setBalances({ grossCaptured: 0, pending: 0, failed: 0, fees: 0, netSettled: 0 })
    } finally {
      setLoading(false)
    }
  }

  const fetchRevenueData = async () => {
    if (!merchant?.merchant?._id) return
    
    try {
      const res = await fetch(`${API_BASE}/analytics/merchant/${merchant.merchant._id}?period=30d`)
      if (res.ok) {
        const analytics = await res.json()
        // Transform dailyStats for the chart
        const chartData = analytics.dailyStats?.map(stat => ({
          date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: stat.amount / 100, // Convert from paise to rupees
          transactions: stat.count
        })) || []
        setRevenueData(chartData)
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      setRevenueData([])
    }
  }

  const formatAmount = (amount) => `₹${(amount / 100).toFixed(2)}`
  const formatDate = (timestamp) => new Date(timestamp).toLocaleDateString()

  const refreshTransactions = () => {
    fetchTransactions()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">UniPay Dashboard</h1>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
                  <span className="text-xs text-gray-500">{isConnected ? 'Live' : 'Connecting...'}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Welcome back, {merchant.merchant.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg shadow-lg border-l-4 animate-slide-in ${
                notif.type === 'success' ? 'bg-green-50 border-green-500' :
                notif.type === 'error' ? 'bg-red-50 border-red-500' :
                notif.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    notif.type === 'success' ? 'text-green-800' :
                    notif.type === 'error' ? 'text-red-800' :
                    notif.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {notif.title}
                  </p>
                  <p className={`text-xs mt-1 ${
                    notif.type === 'success' ? 'text-green-600' :
                    notif.type === 'error' ? 'text-red-600' :
                    notif.type === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {notif.message}
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">{formatAmount(stats.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Balances Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Gross Captured</p>
            <p className="text-xl font-semibold">{formatAmount(balances.grossCaptured)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-semibold">{formatAmount(balances.pending)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Fees (est.)</p>
            <p className="text-xl font-semibold">{formatAmount(balances.fees)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Net Settled</p>
            <p className="text-xl font-semibold">{formatAmount(balances.netSettled)}</p>
          </div>
        </div>

        {/* Revenue Graph */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-[300px] text-gray-500">
              <div className="text-center">
                <p>No revenue data available</p>
                <p className="text-sm text-gray-400 mt-1">Revenue will appear here once you have transactions</p>
              </div>
            </div>
          )}
        </div>

        {/* API Keys Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key ID</label>
              <div className="flex">
                <input
                  type="text"
                  value={merchant.credentials.keyId}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(merchant.credentials.keyId)}
                  className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Secret</label>
              <div className="flex">
                <input
                  type="password"
                  value={merchant.credentials.keySecret}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(merchant.credentials.keySecret)}
                  className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              {isConnected && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live Updates
                </span>
              )}
            </div>
            <button
              onClick={refreshTransactions}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-1">Make a payment to see it here</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{txn.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{txn.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmount(txn.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{txn.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          txn.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : txn.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {txn.status === 'pending' && (
                            <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full animate-pulse"></span>
                          )}
                          {txn.status === 'success' && (
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                          )}
                          {txn.status === 'failed' && (
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                          )}
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(txn.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`${API_BASE}/payments/${txn.paymentId}/receipt.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Download Receipt
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MerchantDashboard
