import { useState } from 'react'

const Subscriptions = ({ merchant, onCreateSubscription }) => {
  const [subscriptionData, setSubscriptionData] = useState({
    plan: {
      name: '',
      amount: '',
      currency: 'INR',
      interval: 'monthly',
      description: ''
    },
    customer: {
      name: '',
      email: '',
      contact: ''
    },
    notes: {},
    total_count: '',
    expire_by: ''
  })
  const [createdSubscriptions, setCreatedSubscriptions] = useState([])
  const [showForm, setShowForm] = useState(false)

  const intervals = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const subscription = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      plan: subscriptionData.plan,
      customer: subscriptionData.customer,
      status: 'active',
      current_start: new Date().toISOString(),
      current_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      ended_at: null,
      quantity: 1,
      notes: subscriptionData.notes,
      created_at: new Date().toISOString(),
      total_count: subscriptionData.total_count ? parseInt(subscriptionData.total_count) : null,
      expire_by: subscriptionData.expire_by ? new Date(subscriptionData.expire_by).toISOString() : null
    }

    setCreatedSubscriptions([subscription, ...createdSubscriptions])
    setShowForm(false)
    setSubscriptionData({
      plan: { name: '', amount: '', currency: 'INR', interval: 'monthly', description: '' },
      customer: { name: '', email: '', contact: '' },
      notes: {},
      total_count: '',
      expire_by: ''
    })
  }

  const cancelSubscription = (subscriptionId) => {
    setCreatedSubscriptions(prev => 
      prev.map(sub => 
        sub.id === subscriptionId 
          ? { ...sub, status: 'cancelled', ended_at: new Date().toISOString() }
          : sub
      )
    )
  }

  const pauseSubscription = (subscriptionId) => {
    setCreatedSubscriptions(prev => 
      prev.map(sub => 
        sub.id === subscriptionId 
          ? { ...sub, status: 'paused' }
          : sub
      )
    )
  }

  const resumeSubscription = (subscriptionId) => {
    setCreatedSubscriptions(prev => 
      prev.map(sub => 
        sub.id === subscriptionId 
          ? { ...sub, status: 'active' }
          : sub
      )
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Subscriptions</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          {showForm ? 'Cancel' : 'Create Subscription Plan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium mb-4">Plan Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input
                type="text"
                value={subscriptionData.plan.name}
                onChange={(e) => setSubscriptionData({
                  ...subscriptionData, 
                  plan: {...subscriptionData.plan, name: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Premium Plan"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={subscriptionData.plan.amount}
                onChange={(e) => setSubscriptionData({
                  ...subscriptionData, 
                  plan: {...subscriptionData.plan, amount: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="999"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={subscriptionData.plan.currency}
                onChange={(e) => setSubscriptionData({
                  ...subscriptionData, 
                  plan: {...subscriptionData.plan, currency: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Interval</label>
              <select
                value={subscriptionData.plan.interval}
                onChange={(e) => setSubscriptionData({
                  ...subscriptionData, 
                  plan: {...subscriptionData.plan, interval: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {intervals.map(interval => (
                  <option key={interval.value} value={interval.value}>{interval.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={subscriptionData.plan.description}
              onChange={(e) => setSubscriptionData({
                ...subscriptionData, 
                plan: {...subscriptionData.plan, description: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Premium features and benefits"
              rows="3"
            />
          </div>

          <h4 className="text-lg font-medium mb-4">Customer Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={subscriptionData.customer.name}
                onChange={(e) => setSubscriptionData({
                  ...subscriptionData, 
                  customer: {...subscriptionData.customer, name: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
              <input
                type="email"
                value={subscriptionData.customer.email}
                onChange={(e) => setSubscriptionData({
                  ...subscriptionData, 
                  customer: {...subscriptionData.customer, email: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Contact</label>
              <input
                type="tel"
                value={subscriptionData.customer.contact}
                onChange={(e) => setSubscriptionData({
                  ...subscriptionData, 
                  customer: {...subscriptionData.customer, contact: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Count (Optional)</label>
              <input
                type="number"
                value={subscriptionData.total_count}
                onChange={(e) => setSubscriptionData({...subscriptionData, total_count: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="12 (for 12 months)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expire By</label>
              <input
                type="datetime-local"
                value={subscriptionData.expire_by}
                onChange={(e) => setSubscriptionData({...subscriptionData, expire_by: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Create Subscription Plan
          </button>
        </form>
      )}

      {/* Created Subscriptions */}
      <div className="space-y-4">
        {createdSubscriptions.map((subscription) => (
          <div key={subscription.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{subscription.plan.name}</h4>
                <p className="text-sm text-gray-600">
                  ₹{subscription.plan.amount} {subscription.plan.currency} / {subscription.plan.interval}
                </p>
                <p className="text-xs text-gray-500">
                  Customer: {subscription.customer.name} ({subscription.customer.email})
                </p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(subscription.created_at).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {subscription.status}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {subscription.status === 'active' && (
                <>
                  <button
                    onClick={() => pauseSubscription(subscription.id)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => cancelSubscription(subscription.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                  >
                    Cancel
                  </button>
                </>
              )}
              {subscription.status === 'paused' && (
                <button
                  onClick={() => resumeSubscription(subscription.id)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Subscriptions


