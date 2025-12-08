import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

const UnifiedLogin = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  onMerchantCreated,
  existingEmail = '',
  startWithMerchantCreation = true
}) => {
  const [loginData, setLoginData] = useState({ 
    email: existingEmail, 
    password: '' 
  })
  const [isCreatingMerchant, setIsCreatingMerchant] = useState(startWithMerchantCreation)
  const [merchantData, setMerchantData] = useState({
    name: '',
    businessType: 'individual',
    website: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // For demo purposes, we'll just set the user as logged in
      // In a real app, you'd validate credentials against a backend
      onLoginSuccess(loginData.email)
      onClose()
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMerchant = async () => {
    if (!loginData.email || !loginData.password) {
      setError('Please enter email and password first')
      return
    }

    if (!merchantData.name) {
      setError('Please enter merchant name')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE}/merchants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          name: merchantData.name,
          businessType: merchantData.businessType,
          website: merchantData.website,
          description: merchantData.description
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create merchant account')
      }

      const merchant = await response.json()
      onMerchantCreated(merchant)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create merchant account')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setLoginData({ email: existingEmail, password: '' })
    setMerchantData({ name: '', businessType: 'individual', website: '', description: '' })
    setIsCreatingMerchant(false)
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isCreatingMerchant ? 'Create Merchant Account' : 'Login to UniPay'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {isCreatingMerchant 
              ? 'Set up your merchant account to start accepting payments'
              : 'Enter your credentials to access the dashboard'
            }
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Merchant Creation Fields */}
            {isCreatingMerchant && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={merchantData.name}
                    onChange={(e) => setMerchantData({...merchantData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your business name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    value={merchantData.businessType}
                    onChange={(e) => setMerchantData({...merchantData, businessType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                    <option value="nonprofit">Non-profit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    value={merchantData.website}
                    onChange={(e) => setMerchantData({...merchantData, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://your-website.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={merchantData.description}
                    onChange={(e) => setMerchantData({...merchantData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your business"
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {!isCreatingMerchant ? (
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            ) : (
              <button
                onClick={handleCreateMerchant}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>
          
          <div className="mt-3 text-center">
            <button
              onClick={handleClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnifiedLogin
