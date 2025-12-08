import { useState, useMemo } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

const PaymentForm = ({ order, onPaymentSuccess, onPaymentError, onBack }) => {
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })
  const [netBanking, setNetBanking] = useState('')
  const [wallet, setWallet] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Default UPI ID
  const DEFAULT_UPI_ID = '7693801244@ybl'
  
  const upiQrUrl = useMemo(() => {
    if (selectedMethod !== 'upi') return ''
    const intent = `upi://pay?pa=${encodeURIComponent(DEFAULT_UPI_ID)}&pn=${encodeURIComponent('UniPay Merchant')}&am=${(order.amount/100).toFixed(2)}&cu=${order.currency}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(intent)}`
  }, [selectedMethod, order])

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'upi', name: 'UPI', icon: '📱' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦' },
    { id: 'wallet', name: 'Wallet', icon: '👛' }
  ]

  const banks = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 
    'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda'
  ]

  const wallets = [
    'Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay', 'Mobikwik'
  ]

  const handleCardInput = (field, value) => {
    let formattedValue = value
    if (field === 'number') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
    } else if (field === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/')
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3)
    }
    setCardDetails({ ...cardDetails, [field]: formattedValue })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Authorize
      const authorizeRes = await fetch(`${API_BASE}/payments/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, method: selectedMethod })
      })
      if (!authorizeRes.ok) throw new Error('Authorization failed')
      const authorizedPayment = await authorizeRes.json()

      // For non-card methods, simulate confirmation delay
      if (selectedMethod !== 'card') {
        await new Promise(r => setTimeout(r, 1500))
      }

      // Capture
      const captureRes = await fetch(`${API_BASE}/payments/${authorizedPayment._id}/capture`, { method: 'POST' })
      if (!captureRes.ok) throw new Error('Capture failed')
      const captured = await captureRes.json()

      const paymentData = {
        id: captured._id,
        amount: captured.amount,
        currency: captured.currency,
        method: captured.method,
        status: captured.status,
        timestamp: captured.createdAt
      }

      onPaymentSuccess(paymentData)
    } catch (error) {
      onPaymentError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        )}
        <h2 className="text-2xl font-bold flex-1 text-center">Complete Payment</h2>
        {onBack && <div className="w-16"></div>} {/* Spacer for centering */}
      </div>
      
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount to pay</span>
            <span className="text-2xl font-bold">₹{(order.amount / 100).toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">Order ID: {order._id}</div>
          <div className="text-xs text-gray-400 mt-1">Raw amount: {order.amount} paise</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Choose Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  selectedMethod === method.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">{method.icon}</div>
                <div className="text-sm font-medium">{method.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Payment Form */}
        {selectedMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input
                type="text"
                value={cardDetails.number}
                onChange={(e) => handleCardInput('number', e.target.value)}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="19"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <input
                  type="text"
                  value={cardDetails.expiry}
                  onChange={(e) => handleCardInput('expiry', e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input
                  type="text"
                  value={cardDetails.cvv}
                  onChange={(e) => handleCardInput('cvv', e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="3"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
              <input
                type="text"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        )}

        {/* UPI Payment Form */}
        {selectedMethod === 'upi' && (
          <div className="text-center">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Scan QR Code to Pay</p>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                  <img src={upiQrUrl} alt="UPI QR Code" className="w-48 h-48" />
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Pay via UPI</p>
              <p className="text-xs text-gray-600 mb-2">
                Scan this QR code with any UPI app (PhonePe, Google Pay, Paytm, BHIM, etc.)
              </p>
              <p className="text-xs text-gray-500">
                UPI ID: <span className="font-mono font-semibold">{DEFAULT_UPI_ID}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Amount: <span className="font-semibold text-green-600">₹{(order.amount / 100).toFixed(2)}</span>
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              After scanning and completing the payment, click the "Pay" button below to confirm.
            </p>
          </div>
        )}

        {/* Net Banking Form */}
        {selectedMethod === 'netbanking' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
            <select
              value={netBanking}
              onChange={(e) => setNetBanking(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose your bank</option>
              {banks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>
        )}

        {/* Wallet Form */}
        {selectedMethod === 'wallet' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Wallet</label>
            <select
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose your wallet</option>
              {wallets.map(walletName => (
                <option key={walletName} value={walletName}>{walletName}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">You'll be redirected in your wallet app to approve the payment.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Pay ₹${(order.amount / 100).toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}

export default PaymentForm


