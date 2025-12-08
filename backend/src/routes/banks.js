import { Router } from 'express';
import { Bank } from '../models.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const bank = await Bank.create(req.body);
    res.status(201).json(bank);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const banks = await Bank.find();
    res.json(banks);
  } catch (e) {
    next(e);
  }
});

export default router;



