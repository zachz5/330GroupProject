import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// POST create new transaction
router.post('/', async (req, res, next) => {
  try {
    const { customer_id, items, total_amount, payment_method, shipping_address, skip_inventory_update } = req.body;
    
    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer ID and items are required' });
    }
    
    if (!total_amount || total_amount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }
    
    // Normalize payment method to match enum values
    const paymentMethodMap = {
      'credit': 'Credit Card',
      'credit card': 'Credit Card',
      'debit': 'Debit Card',
      'debit card': 'Debit Card',
      'paypal': 'PayPal',
      'cash': 'Cash',
      'venmo': 'Venmo'
    };
    const normalizedPaymentMethod = paymentMethodMap[payment_method?.toLowerCase()] || 
                                     (payment_method && ['Credit Card', 'Debit Card', 'Cash', 'Venmo', 'PayPal'].includes(payment_method) 
                                       ? payment_method 
                                       : 'Credit Card');
    
    // Start database transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create transaction record
      const [transactionResult] = await connection.execute(
        `INSERT INTO Customer_Purchase_Transaction (customer_id, transaction_date, total_amount, payment_method, status)
         VALUES (?, NOW(), ?, ?, 'Processing')`,
        [customer_id, total_amount, normalizedPaymentMethod]
      );
      
      const transactionId = transactionResult.insertId;
      
      // Create transaction details for each item
      for (const item of items) {
        await connection.execute(
          `INSERT INTO Transaction_Details (transaction_id, furniture_id, quantity, price_each)
           VALUES (?, ?, ?, ?)`,
          [transactionId, item.furniture_id, item.quantity, item.price]
        );
        
        // Update furniture inventory (decrease quantity) - skip for historical orders
        if (!skip_inventory_update) {
          await connection.execute(
            `UPDATE Furniture SET quantity = quantity - ? WHERE furniture_id = ?`,
            [item.quantity, item.furniture_id]
          );
        }
      }
      
      // Commit transaction
      await connection.commit();
      
      // Get the created transaction with details
      const [transaction] = await connection.execute(
        `SELECT * FROM Customer_Purchase_Transaction WHERE transaction_id = ?`,
        [transactionId]
      );
      
      const [details] = await connection.execute(
        `SELECT * FROM Transaction_Details WHERE transaction_id = ?`,
        [transactionId]
      );
      
      // Release connection before sending response
      connection.release();
      
      res.status(201).json({
        transaction: transaction[0],
        details: details
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    next(error);
  }
});

// GET all transactions for a customer
router.get('/customer/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    // Use a single query with JOINs to get all data at once, avoiding multiple concurrent connections
    const [transactions] = await pool.execute(
      `SELECT 
         t.*,
         td.detail_id,
         td.furniture_id,
         td.quantity,
         td.price_each,
         f.name as item_name,
         f.category as item_category
       FROM Customer_Purchase_Transaction t
       LEFT JOIN Transaction_Details td ON t.transaction_id = td.transaction_id
       LEFT JOIN Furniture f ON td.furniture_id = f.furniture_id
       WHERE t.customer_id = ?
       ORDER BY t.transaction_date DESC, td.detail_id`,
      [customerId]
    );
    
    // Group transactions and their details
    const transactionsMap = new Map();
    
    transactions.forEach(row => {
      const transactionId = row.transaction_id;
      
      if (!transactionsMap.has(transactionId)) {
        transactionsMap.set(transactionId, {
          transaction_id: row.transaction_id,
          customer_id: row.customer_id,
          transaction_date: row.transaction_date,
          total_amount: row.total_amount,
          payment_method: row.payment_method,
          status: row.status,
          items: []
        });
      }
      
      // Add item details if they exist
      if (row.detail_id) {
        transactionsMap.get(transactionId).items.push({
          detail_id: row.detail_id,
          transaction_id: row.transaction_id,
          furniture_id: row.furniture_id,
          quantity: row.quantity,
          price_each: row.price_each,
          name: row.item_name,
          category: row.item_category
        });
      }
    });
    
    const transactionsWithDetails = Array.from(transactionsMap.values());
    
    res.json(transactionsWithDetails);
  } catch (error) {
    next(error);
  }
});

// GET single transaction by ID
router.get('/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    
    const [transactions] = await pool.execute(
      `SELECT * FROM Customer_Purchase_Transaction WHERE transaction_id = ?`,
      [transactionId]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const [details] = await pool.execute(
      `SELECT td.*, f.name, f.category 
       FROM Transaction_Details td
       JOIN Furniture f ON td.furniture_id = f.furniture_id
       WHERE td.transaction_id = ?`,
      [transactionId]
    );
    
    res.json({
      ...transactions[0],
      items: details
    });
  } catch (error) {
    next(error);
  }
});

// GET all transactions (for admin/employee use)
router.get('/', async (req, res, next) => {
  try {
    // Use a single query with JOINs to get all data at once, avoiding multiple concurrent connections
    const [transactions] = await pool.execute(
      `SELECT 
         t.*, 
         c.email as customer_email, 
         c.first_name, 
         c.last_name,
         td.detail_id,
         td.furniture_id,
         td.quantity,
         td.price_each,
         f.name as item_name,
         f.category as item_category
       FROM Customer_Purchase_Transaction t
       JOIN Customer c ON t.customer_id = c.customer_id
       LEFT JOIN Transaction_Details td ON t.transaction_id = td.transaction_id
       LEFT JOIN Furniture f ON td.furniture_id = f.furniture_id
       ORDER BY t.transaction_date DESC, td.detail_id`
    );
    
    // Group transactions and their details
    const transactionsMap = new Map();
    
    transactions.forEach(row => {
      const transactionId = row.transaction_id;
      
      if (!transactionsMap.has(transactionId)) {
        transactionsMap.set(transactionId, {
          transaction_id: row.transaction_id,
          customer_id: row.customer_id,
          transaction_date: row.transaction_date,
          total_amount: row.total_amount,
          payment_method: row.payment_method,
          status: row.status,
          customer_email: row.customer_email,
          first_name: row.first_name,
          last_name: row.last_name,
          items: []
        });
      }
      
      // Add item details if they exist
      if (row.detail_id) {
        transactionsMap.get(transactionId).items.push({
          detail_id: row.detail_id,
          transaction_id: row.transaction_id,
          furniture_id: row.furniture_id,
          quantity: row.quantity,
          price_each: row.price_each,
          name: row.item_name,
          category: row.item_category
        });
      }
    });
    
    const transactionsWithDetails = Array.from(transactionsMap.values());
    
    res.json(transactionsWithDetails);
  } catch (error) {
    next(error);
  }
});

// PUT update transaction status
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Valid statuses: Pending, Processing, Shipped, Delivered, Completed, Cancelled, Refunded
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled', 'Refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const [result] = await pool.execute(
      'UPDATE Customer_Purchase_Transaction SET status = ? WHERE transaction_id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // If cancelled or refunded, restock items
    if (status === 'Cancelled' || status === 'Refunded') {
      const [details] = await pool.execute(
        'SELECT furniture_id, quantity FROM Transaction_Details WHERE transaction_id = ?',
        [id]
      );
      
      for (const detail of details) {
        await pool.execute(
          'UPDATE Furniture SET quantity = quantity + ? WHERE furniture_id = ?',
          [detail.quantity, detail.furniture_id]
        );
      }
    }
    
    const [updatedTransaction] = await pool.execute(
      `SELECT t.*, c.email as customer_email, c.first_name, c.last_name
       FROM Customer_Purchase_Transaction t
       JOIN Customer c ON t.customer_id = c.customer_id
       WHERE t.transaction_id = ?`,
      [id]
    );
    
    if (updatedTransaction.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Get transaction details (items) to match the structure of GET endpoint
    const [details] = await pool.execute(
      `SELECT td.*, f.name, f.category 
       FROM Transaction_Details td
       JOIN Furniture f ON td.furniture_id = f.furniture_id
       WHERE td.transaction_id = ?`,
      [id]
    );
    
    const response = {
      ...updatedTransaction[0],
      items: details
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE transaction (for admin/employee use)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get transaction details before deleting to restock items
    const [details] = await pool.execute(
      'SELECT furniture_id, quantity FROM Transaction_Details WHERE transaction_id = ?',
      [id]
    );
    
    // Restock items
    for (const detail of details) {
      await pool.execute(
        'UPDATE Furniture SET quantity = quantity + ? WHERE furniture_id = ?',
        [detail.quantity, detail.furniture_id]
      );
    }
    
    // Delete transaction details first (foreign key constraint)
    await pool.execute('DELETE FROM Transaction_Details WHERE transaction_id = ?', [id]);
    
    // Delete transaction
    const [result] = await pool.execute('DELETE FROM Customer_Purchase_Transaction WHERE transaction_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

