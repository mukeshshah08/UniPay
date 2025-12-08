import mongoose from 'mongoose';

const MerchantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    keyId: { type: String, required: true, unique: true },
    keySecretHash: { type: String, required: true },
    webhookSecret: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const BankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    baseUrl: { type: String, required: true },
    apiKey: { type: String },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const OrderSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    receipt: { type: String },
    status: { type: String, enum: ['created', 'paid', 'expired', 'cancelled'], default: 'created' }
  },
  { timestamps: true }
);

const PaymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['authorized', 'captured', 'failed', 'pending'], required: true },
    bankRef: { type: String },
    method: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet'], default: 'card' },
    error: { type: String }
  },
  { timestamps: true }
);

const RefundSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['created', 'processed', 'failed'], default: 'created' },
    reason: { type: String }
  },
  { timestamps: true }
);

export const Merchant = mongoose.model('Merchant', MerchantSchema);
export const Bank = mongoose.model('Bank', BankSchema);
export const Order = mongoose.model('Order', OrderSchema);
export const Payment = mongoose.model('Payment', PaymentSchema);
export const Refund = mongoose.model('Refund', RefundSchema);



