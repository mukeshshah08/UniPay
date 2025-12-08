import { useState } from 'react'

const PaymentLinks = ({ merchant, onCreateLink }) => {
  const [linkData, setLinkData] = useState({
    amount: '',
    currency: 'INR',
    description: '',
    customer: {
      name: '',
      email: '',
      contact: ''
    },
    notes: {},
    callback_url: '',
    expireBy: ''
  })
  const [createdLinks, setCreatedLinks] = useState([])
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const paymentLink = {
      id: 'plink_' + Math.random().toString(36).substr(2, 9),
      short_url: `https://unipay-pay.com/pay/${Math.random().toString(36).substr(2, 8)}`,
      amount: parseInt(linkData.amount) * 100, // Convert to paise
      currency: linkData.currency,
      description: linkData.description,
      customer: linkData.customer,
      status: 'active',
      created_at: new Date().toISOString(),
      expire_by: linkData.expireBy ? new Date(linkData.expireBy).toISOString() : null
    }

    setCreatedLinks([paymentLink, ...createdLinks])
    setShowForm(false)
    setLinkData({
      amount: '',
      currency: 'INR',
      description: '',
      customer: { name: '', email: '', contact: '' },
      notes: {},
      callback_url: '',
      expireBy: ''
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Link copied to clipboard!')
  }

  const generateQR = (url) => {
    // In a real app, you'd use a QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Payment Links</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create Payment Link'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={linkData.amount}
                onChange={(e) => setLinkData({...linkData, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={linkData.currency}
                onChange={(e) => setLinkData({...linkData, currency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={linkData.description}
              onChange={(e) => setLinkData({...linkData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Payment for services"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={linkData.customer.name}
                onChange={(e) => setLinkData({...linkData, customer: {...linkData.customer, name: e.target.value}})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
              <input
                type="email"
                value={linkData.customer.email}
                onChange={(e) => setLinkData({...linkData, customer: {...linkData.customer, email: e.target.value}})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Contact</label>
              <input
                type="tel"
                value={linkData.customer.contact}
                onChange={(e) => setLinkData({...linkData, customer: {...linkData.customer, contact: e.target.value}})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Callback URL</label>
              <input
                type="url"
                value={linkData.callback_url}
                onChange={(e) => setLinkData({...linkData, callback_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yoursite.com/callback"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expire By</label>
              <input
                type="datetime-local"
                value={linkData.expireBy}
                onChange={(e) => setLinkData({...linkData, expireBy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Payment Link
          </button>
        </form>
      )}

      {/* Created Links */}
      <div className="space-y-4">
        {createdLinks.map((link) => (
          <div key={link.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{link.description}</h4>
                <p className="text-sm text-gray-600">Amount: ₹{link.amount / 100} {link.currency}</p>
                <p className="text-xs text-gray-500">Created: {new Date(link.created_at).toLocaleString()}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                link.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {link.status}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={link.short_url}
                readOnly
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50"
              />
              <button
                onClick={() => copyToClipboard(link.short_url)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                Copy
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href={link.short_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Test Payment →
              </a>
              <div className="flex items-center space-x-2">
                <img
                  src={generateQR(link.short_url)}
                  alt="QR Code"
                  className="w-8 h-8"
                />
                <span className="text-xs text-gray-500">QR Code</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PaymentLinks


