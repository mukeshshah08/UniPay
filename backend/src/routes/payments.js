import { Router } from 'express';
import { Order, Payment, Merchant } from '../models.js';
import PDFDocument from 'pdfkit';

function generateTransactionId() {
  return 'txn_' + Math.random().toString(36).slice(2, 10) + Date.now().toString().slice(-4);
}

const router = Router();

// Authorize a payment for an order (sets status pending/authorized)
router.post('/authorize', async (req, res, next) => {
  try {
    const { orderId, method = 'card' } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // mock bank authorization success
    const payment = await Payment.create({
      transactionId: generateTransactionId(),
      orderId: order._id,
      amount: order.amount,
      currency: order.currency,
      status: 'authorized',
      bankRef: 'BANK-' + order._id.toString().slice(-6),
      method
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`merchant:${order.merchantId}`).emit('payment:authorized', {
        payment: {
          _id: payment._id,
          transactionId: payment.transactionId,
          orderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          createdAt: payment.createdAt
        },
        merchantId: order.merchantId.toString()
      });
    }

    res.status(201).json(payment);
  } catch (e) {
    next(e);
  }
});

// Capture an authorized payment
router.post('/:id/capture', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('orderId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'authorized') return res.status(400).json({ message: 'Not authorized' });

    payment.status = 'captured';
    await payment.save();
    await Order.findByIdAndUpdate(payment.orderId, { status: 'paid' });

    // Emit real-time event
    const io = req.app.get('io');
    if (io && payment.orderId) {
      const merchantId = payment.orderId.merchantId || payment.orderId;
      io.to(`merchant:${merchantId}`).emit('payment:captured', {
        payment: {
          _id: payment._id,
          transactionId: payment.transactionId,
          orderId: payment.orderId._id || payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          createdAt: payment.createdAt
        },
        merchantId: merchantId.toString()
      });
    }

    res.json(payment);
  } catch (e) {
    next(e);
  }
});

// Get payment by ID
router.get('/:id', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('orderId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (e) {
    next(e);
  }
});

// Get all payments for a merchant
router.get('/merchant/:merchantId', async (req, res, next) => {
  try {
    const orders = await Order.find({ merchantId: req.params.merchantId });
    const orderIds = orders.map(order => order._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } }).populate('orderId');
    res.json(payments);
  } catch (e) {
    next(e);
  }
});

// Simple receipt/invoice endpoint
router.get('/:id/receipt', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('orderId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const order = payment.orderId;
    const receipt = {
      receiptId: (order && order.receipt) || `rcpt_${payment._id.toString().slice(-8)}`,
      transactionId: payment.transactionId,
      paymentId: payment._id,
      orderId: order ? order._id : null,
      merchantId: order ? order.merchantId : null,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      bankRef: payment.bankRef,
      createdAt: payment.createdAt,
      lineItems: [
        { description: 'Payment for order', amount: payment.amount, currency: payment.currency }
      ],
      totals: { subtotal: payment.amount, tax: 0, grandTotal: payment.amount }
    };
    res.json(receipt);
  } catch (e) {
    next(e);
  }
});

// PDF receipt download
router.get('/:id/receipt.pdf', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('orderId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const order = payment.orderId;
    const merchant = order ? await Merchant.findById(order.merchantId) : null;

    const receiptId = (order && order.receipt) || `RCPT-${payment._id.toString().slice(-8).toUpperCase()}`;
    const amountInRupees = (payment.amount / 100).toFixed(2);
    const createdAt = new Date(payment.createdAt);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment.transactionId || payment._id}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const primaryColor = '#111827';
    const accentColor = '#2563eb';
    const grayColor = '#6b7280';

    // Hero header
    doc.rect(50, 50, 512, 60).fill(primaryColor);
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('UniPay Payment Receipt', 60, 65);

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Receipt #: ${receiptId}`, 60, 92)
      .text(`Generated on ${createdAt.toLocaleString()}`, 60, 104);

    doc.fillColor(primaryColor);
    doc.moveDown(2);
    doc.lineWidth(1).strokeColor('#E5E7EB').moveTo(50, 130).lineTo(562, 130).stroke();
    doc.moveDown(1.5);

    // Merchant information
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(primaryColor)
      .text('Merchant Information');

    doc.moveDown(0.5);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1F2937')
      .text(`Merchant Name: ${merchant ? merchant.name : 'N/A'}`)
      .text(`Merchant ID: ${order ? order.merchantId : '-'}`);
    if (merchant?.keyId) {
      doc.text(`Merchant Key ID: ${merchant.keyId}`);
    }

    doc.moveDown(1);

    // Payment details
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(primaryColor)
      .text('Payment Details');

    doc.moveDown(0.5);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1F2937')
      .text(`Payment ID: ${payment._id}`)
      .text(`Transaction ID: ${payment.transactionId || '-'}`)
      .text(`Order ID: ${order ? order._id : '-'}`)
      .text(`Payment Method: ${payment.method.toUpperCase()}`)
      .text(`Payment Status: ${payment.status.toUpperCase()}`)
      .text(`Captured On: ${createdAt.toLocaleString()}`);
    if (payment.bankRef) {
      doc.text(`Bank Reference: ${payment.bankRef}`);
    }

    doc.moveDown(1.2);

    // Amount summary table
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(primaryColor)
      .text('Amount Summary');

    doc.moveDown(0.5);
    const tableStartY = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(grayColor)
      .text('Description', 50, tableStartY)
      .text('Amount (INR)', 400, tableStartY);

    doc.lineWidth(0.5).strokeColor('#D1D5DB').moveTo(50, tableStartY + 15).lineTo(562, tableStartY + 15).stroke();

    doc.moveDown(0.8);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1F2937')
      .text(`Payment for order ${order ? (order.receipt || order._id) : ''}`, 50)
      .text(`₹ ${amountInRupees}`, 400, doc.y - 12, { width: 150, align: 'right' });

    doc.moveDown(0.6);
    doc.lineWidth(0.5).strokeColor('#D1D5DB').moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.6);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1F2937')
      .text('Subtotal', 50)
      .text(`₹ ${amountInRupees}`, 400, doc.y - 12, { width: 150, align: 'right' });

    doc.moveDown(0.4);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1F2937')
      .text('Taxes & Fees', 50)
      .text('₹ 0.00', 400, doc.y - 12, { width: 150, align: 'right' });

    doc.moveDown(0.6);
    const totalBoxY = doc.y;
    doc.rect(50, totalBoxY, 512, 26).fill(accentColor);
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total Paid', 60, totalBoxY + 7)
      .text(`₹ ${amountInRupees}`, 400, totalBoxY + 7, { width: 150, align: 'right' });

    doc.fillColor(primaryColor);
    doc.moveDown(3);

    // Footer / signature
    doc.lineWidth(1).strokeColor('#E5E7EB').moveTo(50, doc.page.height - 120).lineTo(562, doc.page.height - 120).stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(primaryColor)
      .text('Thank you for choosing UniPay!', 50, doc.page.height - 110);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(grayColor)
      .text('For any questions about this receipt, reach us at support@unipay.test or +91-98765-43210.', 50, doc.page.height - 95)
      .text('This is a system generated receipt. No signature is required.', 50, doc.page.height - 82);

    doc.end();
  } catch (e) {
    next(e);
  }
});

export default router;


