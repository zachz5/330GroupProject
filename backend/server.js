import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itemsRoutes from './routes/items.js';
import authRoutes from './routes/auth.js';
import employeesRoutes from './routes/employees.js';
import transactionsRoutes from './routes/transactions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/items', itemsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/transactions', transactionsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Campus ReHome API',
    endpoints: {
      health: '/api/health',
      items: {
        getAll: 'GET /api/items',
        getOne: 'GET /api/items/:id',
        create: 'POST /api/items',
        update: 'PUT /api/items/:id',
        delete: 'DELETE /api/items/:id',
      },
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
    },
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

