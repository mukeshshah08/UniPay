import { Router } from 'express';
import { Order, Payment } from '../models.js';

const router = Router();

// Get analytics for a merchant
router.get('/merchant/:merchantId', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get orders for the merchant
    const orders = await Order.find({ 
      merchantId, 
      createdAt: { $gte: startDate } 
    });

    const orderIds = orders.map(order => order._id);
    
    // Get payments for these orders
    const payments = await Payment.find({ 
      orderId: { $in: orderIds } 
    });

    // Calculate analytics
    const totalAmount = payments
      .filter(p => p.status === 'captured')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalTransactions = payments.length;
    const successfulTransactions = payments.filter(p => p.status === 'captured').length;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

    // Payment method breakdown
    const methodBreakdown = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + 1;
      return acc;
    }, {});

    // Daily transaction count based on period
    let daysToShow = 7; // default
    switch (period) {
      case '7d':
        daysToShow = 7;
        break;
      case '30d':
        daysToShow = 30;
        break;
      case '90d':
        daysToShow = 90;
        break;
    }
    
    const dailyStats = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayPayments = payments.filter(p => 
        p.createdAt >= dayStart && p.createdAt < dayEnd
      );
      
      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayPayments.length,
        amount: dayPayments.reduce((sum, p) => sum + (p.status === 'captured' ? p.amount : 0), 0)
      });
    }

    res.json({
      totalAmount,
      totalTransactions,
      successfulTransactions,
      successRate: Math.round(successRate * 100) / 100,
      methodBreakdown,
      dailyStats,
      period
    });
  } catch (e) {
    next(e);
  }
});

// Simple balances endpoint per merchant
router.get('/merchant/:merchantId/balances', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const orders = await Order.find({ merchantId });
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } });

    const capturedTotal = payments
      .filter(p => p.status === 'captured')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingTotal = payments
      .filter(p => p.status === 'authorized' || p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    const failedTotal = payments
      .filter(p => p.status === 'failed')
      .reduce((sum, p) => sum + p.amount, 0);

    // Naive fee calc for demo
    const fees = Math.round(capturedTotal * 0.02);
    const netSettled = capturedTotal - fees;

    res.json({
      grossCaptured: capturedTotal,
      pending: pendingTotal,
      failed: failedTotal,
      fees,
      netSettled
    });
  } catch (e) {
    next(e);
  }
});

// Reports endpoint (JSON or CSV)
router.get('/merchant/:merchantId/report', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const { format = 'json', period = '30d' } = req.query;

    // Reuse logic similar to analytics to get payments in period
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const orders = await Order.find({ merchantId, createdAt: { $gte: startDate } });
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } }).populate('orderId');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${merchantId}_${period}.csv`);
      const headers = [
        'transactionId', 'paymentId', 'orderId', 'amount', 'currency', 'status', 'method', 'bankRef', 'createdAt'
      ];
      const lines = [headers.join(',')];
      for (const p of payments) {
        lines.push([
          p.transactionId || '',
          p._id,
          p.orderId ? p.orderId._id : '',
          p.amount,
          p.currency,
          p.status,
          p.method,
          p.bankRef || '',
          p.createdAt.toISOString()
        ].join(','));
      }
      res.send(lines.join('\n'));
      return;
    }

    // default JSON
    res.json({
      merchantId,
      period,
      count: payments.length,
      payments: payments.map(p => ({
        transactionId: p.transactionId,
        paymentId: p._id,
        orderId: p.orderId ? p.orderId._id : null,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        method: p.method,
        bankRef: p.bankRef,
        createdAt: p.createdAt
      }))
    });
  } catch (e) {
    next(e);
  }
});

export default router;


