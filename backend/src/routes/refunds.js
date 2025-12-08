import { Router } from 'express';
import { Payment, Refund } from '../models.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { paymentId, amount } = req.body;
    const payment = await Payment.findById(paymentId).populate('orderId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'captured') return res.status(400).json({ message: 'Only captured payments refundable' });

    const refund = await Refund.create({ paymentId, amount, status: 'processed' });

    // Emit real-time event
    const io = req.app.get('io');
    if (io && payment.orderId) {
      const merchantId = payment.orderId.merchantId || payment.orderId;
      io.to(`merchant:${merchantId}`).emit('payment:refunded', {
        refund: {
          _id: refund._id,
          paymentId: refund.paymentId,
          amount: refund.amount,
          status: refund.status,
          createdAt: refund.createdAt
        },
        payment: {
          _id: payment._id,
          transactionId: payment.transactionId,
          amount: payment.amount
        },
        merchantId: merchantId.toString()
      });
    }

    res.status(201).json(refund);
  } catch (e) {
    next(e);
  }
});

export default router;



