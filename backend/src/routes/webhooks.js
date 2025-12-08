import { Router } from 'express';
import crypto from 'crypto';
import { Merchant, Payment } from '../models.js';

const router = Router();

// Minimal webhook validation using merchant's webhookSecret
router.post('/:merchantId', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const signature = req.headers['x-unipay-signature'];
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });

    const payload = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', merchant.webhookSecret).update(payload).digest('hex');
    if (signature !== expected) return res.status(401).json({ message: 'Invalid signature' });

    // Example event: payment.captured
    if (req.body.type === 'payment.captured') {
      const { paymentId } = req.body.data;
      await Payment.findByIdAndUpdate(paymentId, { status: 'captured' });
    }
    res.json({ received: true });
  } catch (e) {
    next(e);
  }
});

export default router;



