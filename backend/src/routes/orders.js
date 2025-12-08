import { Router } from 'express';
import { Order } from '../models.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { merchantId, amount, currency = 'INR', receipt } = req.body;
    const order = await Order.create({ merchantId, amount, currency, receipt });
    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) {
    next(e);
  }
});

export default router;



