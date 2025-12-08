import { useState } from 'react'

const WebhookManager = ({ merchant }) => {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState([])
  const [webhookLogs, setWebhookLogs] = useState([])
  const [showTestModal, setShowTestModal] = useState(false)

  const availableEvents = [
    { id: 'payment.captured', name: 'Payment Captured', description: 'When a payment is successfully captured' },
    { id: 'payment.failed', name: 'Payment Failed', description: 'When a payment fails' },
    { id: 'payment.authorized', name: 'Payment Authorized', description: 'When a payment is authorized' },
    { id: 'order.paid', name: 'Order Paid', description: 'When an order is fully paid' },
    { id: 'refund.created', name: 'Refund Created', description: 'When a refund is initiated' },
    { id: 'refund.processed', name: 'Refund Processed', description: 'When a refund is processed' },
    { id: 'subscription.charged', name: 'Subscription Charged', description: 'When a subscription payment is charged' },
    { id: 'subscription.cancelled', name: 'Subscription Cancelled', description: 'When a subscription is cancelled' }
  ]

  const handleAddEvent = (eventId) => {
    const event = availableEvents.find(e => e.id === eventId)
    if (event && !webhookEvents.find(e => e.id === eventId)) {
      setWebhookEvents([...webhookEvents, event])
    }
  }

  const handleRemoveEvent = (eventId) => {
    setWebhookEvents(webhookEvents.filter(e => e.id !== eventId))
  }

  const handleSaveWebhook = () => {
    if (!webhookUrl || webhookEvents.length === 0) {
      alert('Please provide webhook URL and select at least one event')
      return
    }

    // In a real app, this would save to the backend
    const webhook = {
      id: 'webhook_' + Math.random().toString(36).substr(2, 9),
      url: webhookUrl,
      events: webhookEvents,
      secret: merchant.webhookSecret,
      status: 'active',
      created_at: new Date().toISOString()
    }

    alert('Webhook configuration saved!')
    console.log('Webhook config:', webhook)
  }

  const testWebhook = () => {
    const testPayload = {
      event: 'payment.captured',
      created_at: new Date().toISOString(),
      data: {
        payment: {
          id: 'pay_test_' + Math.random().toString(36).substr(2, 9),
          amount: 4999, // This is just for webhook testing, not actual payment
          currency: 'INR',
          status: 'captured',
          method: 'card',
          order_id: 'order_test_123'
        }
      }
    }

    // Simulate webhook call
    setWebhookLogs([{
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      url: webhookUrl,
      event: 'payment.captured',
      status: 'success',
      response_code: 200,
      timestamp: new Date().toISOString(),
      payload: testPayload
    }, ...webhookLogs])

    setShowTestModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Webhook Configuration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Webhook Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yoursite.com/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Events</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableEvents.map(event => (
                <div key={event.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id={event.id}
                    checked={webhookEvents.some(e => e.id === event.id)}
                    onChange={(e) => e.target.checked ? handleAddEvent(event.id) : handleRemoveEvent(event.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor={event.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                      {event.name}
                    </label>
                    <p className="text-xs text-gray-500">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSaveWebhook}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Webhook
            </button>
            <button
              onClick={() => setShowTestModal(true)}
              disabled={!webhookUrl}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Test Webhook
            </button>
          </div>
        </div>
      </div>

      {/* Webhook Secret */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Webhook Secret</h3>
        <div className="flex items-center space-x-3">
          <input
            type="password"
            value={merchant.webhookSecret}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
          />
          <button
            onClick={() => navigator.clipboard.writeText(merchant.webhookSecret)}
            className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300"
          >
            Copy
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Use this secret to verify webhook signatures in your application
        </p>
      </div>

      {/* Webhook Logs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Webhook Logs</h3>
        {webhookLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No webhook calls yet</p>
        ) : (
          <div className="space-y-3">
            {webhookLogs.map(log => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{log.event}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status} ({log.response_code})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{log.url}</p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600">View Payload</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Test Webhook</h3>
            <p className="text-gray-600 mb-4">
              This will send a test webhook to: <code className="bg-gray-100 px-1 rounded">{webhookUrl}</code>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={testWebhook}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Send Test
              </button>
              <button
                onClick={() => setShowTestModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebhookManager


