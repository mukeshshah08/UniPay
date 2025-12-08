import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import refundsRouter from './routes/refunds.js';
import merchantsRouter from './routes/merchants.js';
import banksRouter from './routes/banks.js';
import webhooksRouter from './routes/webhooks.js';
import mockBankRouter from './routes/mockBank.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Make io available to routes
app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is not set. Add it to .env');
  process.exit(1);
}

mongoose
  .connect(mongoUri, { dbName: process.env.MONGODB_DB || 'unipay' })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Mongo connection error', err);
    console.log('Server will continue without database connection for testing...');
    // Don't exit - allow server to start for testing
  });

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'unipay-backend' });
});

app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/refunds', refundsRouter);
app.use('/api/merchants', merchantsRouter);
app.use('/api/banks', banksRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/mock-bank', mockBankRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Join merchant room for real-time updates
  socket.on('join-merchant', (merchantId) => {
    socket.join(`merchant:${merchantId}`);
    console.log(`Client ${socket.id} joined merchant room: ${merchantId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`UniPay backend listening on ${port}`);
  console.log(`Socket.io server ready for real-time updates`);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Please stop the existing server first.`);
    console.log('💡 Try running: npm run kill-port');
    console.log('💡 Or use: npm run dev:safe');
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});


