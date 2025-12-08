import { Router } from 'express';
import crypto from 'crypto';
import { Merchant } from '../models.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    let { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name (use email) is required' });
    }
    name = name.trim().toLowerCase();

    // If merchant with same name (email) exists, reuse it to preserve history
    const existing = await Merchant.findOne({ name });
    if (existing) {
      return res.status(200).json({
        merchant: existing,
        // Do not return keySecret again for security; indicate reuse
        credentials: { keyId: existing.keyId },
        webhookSecret: existing.webhookSecret,
        reused: true
      });
    }

    const keyId = 'mk_' + crypto.randomBytes(6).toString('hex');
    const keySecret = crypto.randomBytes(16).toString('hex');
    const webhookSecret = crypto.randomBytes(16).toString('hex');
    const keySecretHash = crypto.createHash('sha256').update(keySecret).digest('hex');
    const merchant = await Merchant.create({ name, keyId, keySecretHash, webhookSecret });
    res.status(201).json({ merchant, credentials: { keyId, keySecret }, webhookSecret });
  } catch (e) {
    next(e);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const merchants = await Merchant.find();
    res.json(merchants);
  } catch (e) {
    next(e);
  }
});

// Get or create default merchant account for all payments
router.get('/default', async (_req, res, next) => {
  try {
    // Look for a merchant with name 'default' or 'unipay@default'
    let defaultMerchant = await Merchant.findOne({ name: 'unipay@default.com' });
    
    if (!defaultMerchant) {
      // Create default merchant if it doesn't exist
      const keyId = 'mk_default_' + crypto.randomBytes(6).toString('hex');
      const keySecret = crypto.randomBytes(16).toString('hex');
      const webhookSecret = crypto.randomBytes(16).toString('hex');
      const keySecretHash = crypto.createHash('sha256').update(keySecret).digest('hex');
      
      defaultMerchant = await Merchant.create({ 
        name: 'unipay@default.com',
        keyId, 
        keySecretHash, 
        webhookSecret 
      });
    }
    
    res.json({ 
      merchant: defaultMerchant,
      credentials: { keyId: defaultMerchant.keyId }
    });
  } catch (e) {
    next(e);
  }
});

export default router;



