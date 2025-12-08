import { Router } from 'express';

const router = Router();

// Simulate a bank charge/authorization endpoint
router.post('/charge', (req, res) => {
  const { amount, currency = 'INR' } = req.body;
  // succeed for any positive amount
  if (!amount || amount <= 0) return res.status(400).json({ status: 'failed', reason: 'invalid_amount' });
  res.json({ status: 'authorized', currency, bankRef: 'BNK' + Math.floor(Math.random() * 1e6) });
});

// Simulate capture
router.post('/capture', (req, res) => {
  const { bankRef } = req.body;
  if (!bankRef) return res.status(400).json({ status: 'failed', reason: 'missing_ref' });
  res.json({ status: 'captured', bankRef });
});

export default router;




