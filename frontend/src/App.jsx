import { useEffect, useState } from 'react'
import PaymentForm from './components/PaymentForm'
import MerchantDashboard from './components/MerchantDashboard'
import PaymentSuccess from './components/PaymentSuccess'
import PaymentLinks from './components/PaymentLinks'
import Subscriptions from './components/Subscriptions'
import WebhookManager from './components/WebhookManager'
import UnifiedLogin from './components/UnifiedLogin'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

export default function App() {
  const [merchant, setMerchant] = useState(null)
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState('login') // 'login' or 'create'
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentView, setCurrentView] = useState('home') // home, payment, success, dashboard, links, subscriptions, webhooks
  const [paymentData, setPaymentData] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [paymentAmount, setPaymentAmount] = useState(100) // Default amount in paise (₹1.00)
  const [defaultMerchant, setDefaultMerchant] = useState(null)

  useEffect(() => {
    // auto-restore previous session
    const savedEmail = localStorage.getItem('unipay_email')
    const savedMerchant = localStorage.getItem('unipay_merchant')
    if (savedEmail) setLoginData(d => ({ ...d, email: savedEmail }))
    if (savedMerchant) {
      try { setMerchant(JSON.parse(savedMerchant)); setIsLoggedIn(true); setCurrentView('dashboard') } catch {}
    }
    
    // Fetch default merchant for all payments
    fetchDefaultMerchant()
  }, [])

  const fetchDefaultMerchant = async () => {
    try {
      const res = await fetch(`${API_BASE}/merchants/default`)
      if (res.ok) {
        const data = await res.json()
        setDefaultMerchant(data)
      }
    } catch (error) {
      console.error('Error fetching default merchant:', error)
    }
  }

  const handleLoginSuccess = (email) => {
    setIsLoggedIn(true)
    setShowLogin(false)
    setLoginData({ email, password: '' })
    localStorage.setItem('unipay_email', email)
  }

  const handleMerchantCreated = (merchant) => {
    setMerchant(merchant)
    setIsLoggedIn(true)
    setShowLogin(false)
    localStorage.setItem('unipay_merchant', JSON.stringify(merchant))
    setCurrentView('dashboard')
  }

  const createMerchantForLoggedInUser = async () => {
    if (!isLoggedIn) {
      alert('Please login first')
      return
    }
    
    if (!loginData.email) {
      alert('Email is required. Please login again.')
      return
    }
    
    try {
      const res = await fetch(`${API_BASE}/merchants`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          name: loginData.email
        }) 
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to create merchant' }))
        throw new Error(errorData.message || 'Failed to create merchant')
      }
      
      const merchant = await res.json()
      setMerchant(merchant)
      localStorage.setItem('unipay_merchant', JSON.stringify(merchant))
      setCurrentView('dashboard')
    } catch (error) {
      console.error('Error creating merchant:', error)
      alert(error.message || 'Failed to create merchant account')
    }
  }

  async function createOrder() {
    try {
      // Always use logged-in merchant when available, otherwise use default merchant
      const merchantId = merchant?.merchant?._id || defaultMerchant?.merchant?._id
      
      if (!merchantId) {
        alert('Merchant account not available. Please try again.')
        return
      }
      
      console.log('=== ORDER CREATION DEBUG ===')
      console.log('Current paymentAmount state:', paymentAmount, 'paise')
      console.log('Amount in rupees:', (paymentAmount / 100).toFixed(2))
      console.log('Merchant ID:', merchantId)
      console.log('Using merchant:', merchant?.merchant?._id ? 'Logged-in merchant' : 'Default merchant')
      
      const orderPayload = { 
        merchantId: merchantId, 
        amount: paymentAmount, 
        currency: 'INR', 
        receipt: 'rcpt_001' 
      }
      console.log('Order payload:', orderPayload)
      
      const res = await fetch(`${API_BASE}/orders`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(orderPayload) 
      })
      const orderData = await res.json()
      console.log('Order created successfully:', orderData)
      console.log('Order amount:', orderData.amount, 'paise (₹' + (orderData.amount / 100).toFixed(2) + ')')
      setOrder(orderData)
      setCurrentView('payment')
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    }
  }

  const handlePaymentSuccess = async (payment) => {
    setPaymentData(payment)
    
    // Payment is already created in PaymentForm.jsx, no need to create again
    console.log('Payment successful:', payment)
    
    // Trigger dashboard refresh if we're going back to dashboard
    window.dispatchEvent(new CustomEvent('refreshDashboard'))
    
    setCurrentView('success')
  }

  const handlePaymentError = (error) => {
    alert(`Payment failed: ${error}`)
  }

  const handleNewPayment = () => {
    setOrder(null)
    setPayment(null)
    setPaymentData(null)
    setCurrentView('dashboard')
    // Trigger a refresh of the dashboard data
    window.dispatchEvent(new CustomEvent('refreshDashboard'))
  }

  function logout() {
    setIsLoggedIn(false)
    setMerchant(null)
    setOrder(null)
    setPayment(null)
    setCurrentView('home')
    // keep email, but remove merchant to require explicit create
    localStorage.removeItem('unipay_merchant')
  }

  // Show payment success page
  if (currentView === 'success' && paymentData) {
    return <PaymentSuccess payment={paymentData} onNewPayment={handleNewPayment} onBack={() => setCurrentView('dashboard')} />
  }

  // Show payment form
  if (currentView === 'payment' && order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <PaymentForm 
          order={order} 
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          onBack={() => setCurrentView('dashboard')}
        />
      </div>
    )
  }

  // Show merchant dashboard with tabs
  if (currentView === 'dashboard' && merchant) {
    return (
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Home</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">UniPay Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {merchant.merchant.name}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: '📊' },
                { id: 'payments', name: 'Payments', icon: '💳' },
                { id: 'links', name: 'Payment Links', icon: '🔗' },
                { id: 'subscriptions', name: 'Subscriptions', icon: '🔄' },
                { id: 'webhooks', name: 'Webhooks', icon: '🔔' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {activeTab === 'dashboard' && <MerchantDashboard merchant={merchant} onLogout={logout} />}
            {activeTab === 'payments' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-6">Test Payment Flow</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      💰 Enter Your Custom Amount
                    </label>
                    <div className="bg-gray-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-blue-600">₹</span>
                        <input
                          type="number"
                          value={paymentAmount / 100}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            const newAmount = Math.round(value * 100);
                            setPaymentAmount(newAmount);
                          }}
                          className="flex-1 text-2xl font-bold text-gray-900 border-none outline-none bg-transparent"
                          placeholder="0.00"
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Type any amount from ₹0.01 to ₹99,999.99
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                          <span>Examples: 25.50, 100, 0.99, 1500.75</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800">
                        ✅ Selected Amount: ₹{(paymentAmount / 100).toFixed(2)} ({paymentAmount} paise)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPaymentAmount(100)} // ₹1.00
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      ₹1.00
                    </button>
                    <button
                      onClick={() => setPaymentAmount(500)} // ₹5.00
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      ₹5.00
                    </button>
                    <button
                      onClick={() => setPaymentAmount(1000)} // ₹10.00
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      ₹10.00
                    </button>
                    <button
                      onClick={() => setPaymentAmount(5000)} // ₹50.00
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      ₹50.00
                    </button>
                    <button
                      onClick={() => setPaymentAmount(2500)} // ₹25.00 - Test amount
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-bold"
                    >
                      ₹25.00 (TEST)
                    </button>
                    <button
                      onClick={() => setPaymentAmount(0)} // Clear amount
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={createOrder}
                      disabled={paymentAmount < 1}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paymentAmount < 1 ? 'Enter Amount First' : `Test Payment - ₹${(paymentAmount / 100).toFixed(2)}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'links' && <PaymentLinks merchant={merchant} />}
            {activeTab === 'subscriptions' && <Subscriptions merchant={merchant} />}
            {activeTab === 'webhooks' && <WebhookManager merchant={merchant} />}
          </div>
        </div>
      </div>
    )
  }

  // Show main home page
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">UniPay</h1>
          {isLoggedIn && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {loginData.email}</span>
              <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Accept Payments Like a Pro
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            The complete payment gateway solution for your business
          </p>
          
          {!isLoggedIn ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setLoginMode('login')
                    setShowLogin(true)
                  }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setLoginMode('create')
                    setShowLogin(true)
                  }}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg text-lg font-medium hover:bg-green-700"
                >
                  Create Account
                </button>
              </div>
              <p className="text-sm text-gray-500">Login to access merchant dashboard and analytics</p>
            </div>
          ) : (
            <div className="space-x-4">
              <button
                onClick={createMerchantForLoggedInUser}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                {merchant ? '✅ Merchant Created' : 'Create Merchant Account'}
              </button>
              {merchant && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to UniPay</h3>
                    <p className="text-gray-600 mb-6">Your merchant account is ready. Access your dashboard to manage payments, view analytics, and more.</p>
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">Multiple Payment Methods</h3>
            <p className="text-gray-600">Accept cards, UPI, net banking, and digital wallets</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-2">Payment Links</h3>
            <p className="text-gray-600">Create shareable payment links with QR codes</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2">Subscriptions</h3>
            <p className="text-gray-600">Recurring payments and subscription management</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold mb-2">Webhooks</h3>
            <p className="text-gray-600">Real-time notifications for payment events</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure & Compliant</h3>
            <p className="text-gray-600">PCI DSS compliant with bank-grade security</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">Real-time insights and transaction analytics</p>
          </div>
        </div>

        {/* Unified Login Modal */}
        <UnifiedLogin
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
          onMerchantCreated={handleMerchantCreated}
          existingEmail={loginData.email}
          startWithMerchantCreation={loginMode === 'create'}
        />
      </div>
    </div>
  )
}