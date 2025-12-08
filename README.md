UniPay
=====

Full-stack demo of a Razorpay-like payment gateway using Node/Express, MongoDB Atlas, and React + Tailwind.

Quick start
-----------

1. Create `.env` in the project root with your MongoDB Atlas connection string:

```
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB=unipay
VITE_API_BASE=http://localhost:4000/api
```

**Important:** Replace `<user>`, `<password>`, and `<cluster-url>` with your actual MongoDB Atlas credentials.

2. Install dependencies:

```
cd backend && npm i
cd ../frontend && npm i
```

3. Run backend:

```
cd backend && npm run dev
```

4. Run frontend:

```
cd frontend && npm run dev
```

Open the printed URL (default `http://localhost:5173`). Use the buttons to create a merchant, order, authorize, and capture payments.

API
---

- `POST /api/merchants` – onboard merchant (returns keys + webhook secret)
- `POST /api/orders` – create order
- `POST /api/payments/authorize` – mock authorize
- `POST /api/payments/:id/capture` – capture
- `POST /api/refunds` – refund captured payment
- `POST /api/webhooks/:merchantId` – verify minimal HMAC and process events
- `GET /api/health` – health check

This is a teaching/demo scaffold; do not use in production without adding auth, rate limiting, PCI compliance, idempotency, retries, and comprehensive validation.


