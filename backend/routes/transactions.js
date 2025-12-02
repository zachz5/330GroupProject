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
    
    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate tax (Alabama state sales tax: 4%)
    const TAX_RATE = 0.04;
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100; // Round to 2 decimal places
    
    // Calculate total with tax
    const calculatedTotal = subtotal + taxAmount;
    
    // Use provided total_amount if it matches calculated total (allows for frontend calculation)
    // Otherwise use calculated total
    const finalTotal = total_amount && Math.abs(total_amount - calculatedTotal) < 0.01 
      ? total_amount 
      : calculatedTotal;
    
    if (finalTotal <= 0) {
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
      // Create transaction record with tax and shipping address
      const [transactionResult] = await connection.execute(
        `INSERT INTO Customer_Purchase_Transaction (customer_id, transaction_date, total_amount, tax_amount, payment_method, status, shipping_address)
         VALUES (?, NOW(), ?, ?, ?, 'Processing', ?)`,
        [customer_id, finalTotal, taxAmount, normalizedPaymentMethod, shipping_address || null]
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
          tax_amount: row.tax_amount || 0,
          payment_method: row.payment_method,
          status: row.status,
          notes: row.notes || null,
          shipping_address: row.shipping_address || null,
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
          tax_amount: row.tax_amount || 0,
          payment_method: row.payment_method,
          status: row.status,
          notes: row.notes || null,
          shipping_address: row.shipping_address || null,
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

// PUT update transaction status and/or details
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, items, total_amount, payment_method, shipping_address } = req.body;
    
    console.log('\n========== PUT /transactions/:id ==========');
    console.log('Transaction ID:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Shipping address received:', shipping_address);
    console.log('Shipping address type:', typeof shipping_address);
    console.log('Shipping address !== undefined?', shipping_address !== undefined);
    
    // Start database transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get current transaction details for inventory management
      const [currentDetails] = await connection.execute(
        'SELECT detail_id, furniture_id, quantity FROM Transaction_Details WHERE transaction_id = ?',
        [id]
      );
      
      // Get current transaction to check status
      const [currentTransaction] = await connection.execute(
        'SELECT status FROM Customer_Purchase_Transaction WHERE transaction_id = ?',
        [id]
      );
      
      if (currentTransaction.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      const currentStatus = currentTransaction[0].status;
      
      // Update transaction items if provided
      if (items && Array.isArray(items)) {
        // Handle inventory changes when quantities are modified
        for (const currentDetail of currentDetails) {
          const updatedItem = items.find((item) => item.detail_id === currentDetail.detail_id);
          
          if (updatedItem) {
            const quantityDiff = updatedItem.quantity - currentDetail.quantity;
            
            // Update inventory if quantity changed (only if not cancelled/refunded)
            if (quantityDiff !== 0 && currentStatus !== 'Cancelled' && currentStatus !== 'Refunded') {
              // If quantity increased, decrease inventory
              // If quantity decreased, increase inventory
              await connection.execute(
                'UPDATE Furniture SET quantity = quantity - ? WHERE furniture_id = ?',
                [-quantityDiff, currentDetail.furniture_id]
              );
            }
            
            // Update transaction detail
            await connection.execute(
              'UPDATE Transaction_Details SET quantity = ?, price_each = ? WHERE detail_id = ?',
              [updatedItem.quantity, updatedItem.price_each, updatedItem.detail_id]
            );
          }
        }
      }
      
      // Build update query for transaction
      const updateFields = [];
      const updateValues = [];
      
      if (status) {
        // Valid statuses: Pending, Processing, Shipped, Delivered, Completed, Cancelled, Refunded
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled', 'Refunded'];
        if (!validStatuses.includes(status)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ error: 'Invalid status' });
        }
        
        updateFields.push('status = ?');
        updateValues.push(status);
        
        // If status changed to cancelled or refunded, restock items
        if ((status === 'Cancelled' || status === 'Refunded') && currentStatus !== 'Cancelled' && currentStatus !== 'Refunded') {
          for (const detail of currentDetails) {
            await connection.execute(
              'UPDATE Furniture SET quantity = quantity + ? WHERE furniture_id = ?',
              [detail.quantity, detail.furniture_id]
            );
          }
        }
        // If status changed from cancelled/refunded to something else, unstock items
        else if ((currentStatus === 'Cancelled' || currentStatus === 'Refunded') && status !== 'Cancelled' && status !== 'Refunded') {
          for (const detail of currentDetails) {
            await connection.execute(
              'UPDATE Furniture SET quantity = quantity - ? WHERE furniture_id = ?',
              [detail.quantity, detail.furniture_id]
            );
          }
        }
      }
      
      if (notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
      }
      
      // Recalculate tax and total if items were updated
      if (items && Array.isArray(items)) {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price_each), 0);
        const TAX_RATE = 0.04;
        const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
        const calculatedTotal = subtotal + taxAmount;
        
        updateFields.push('tax_amount = ?');
        updateValues.push(taxAmount);
        
        // Only update total_amount if it wasn't explicitly provided
        if (total_amount === undefined) {
          updateFields.push('total_amount = ?');
          updateValues.push(calculatedTotal);
        } else {
          updateFields.push('total_amount = ?');
          updateValues.push(total_amount);
        }
      } else if (total_amount !== undefined) {
        // If total is provided but items weren't updated, recalculate tax from current items
        const [currentDetails] = await connection.execute(
          'SELECT quantity, price_each FROM Transaction_Details WHERE transaction_id = ?',
          [id]
        );
        const subtotal = currentDetails.reduce((sum, detail) => sum + (detail.quantity * detail.price_each), 0);
        const TAX_RATE = 0.04;
        const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
        
        updateFields.push('tax_amount = ?');
        updateValues.push(taxAmount);
        updateFields.push('total_amount = ?');
        updateValues.push(total_amount);
      }
      
      if (payment_method) {
        // Normalize payment method
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
                                         : payment_method);
        updateFields.push('payment_method = ?');
        updateValues.push(normalizedPaymentMethod);
      }
      
      // Always update shipping_address if provided (even if empty string, convert to null)
      if (shipping_address !== undefined) {
        updateFields.push('shipping_address = ?');
        // Convert empty string to null, otherwise use the provided value (trimmed)
        const addressValue = shipping_address === null || shipping_address === '' 
          ? null 
          : (typeof shipping_address === 'string' ? shipping_address.trim() : shipping_address);
        updateValues.push(addressValue);
        console.log('✅ Adding shipping_address to update. Value:', addressValue);
        console.log('   Original value from request:', shipping_address);
      } else {
        console.log('⚠️ shipping_address is undefined, not updating');
      }
      
      // Update transaction if there are fields to update
      if (updateFields.length > 0) {
        updateValues.push(id);
        console.log('📝 Updating transaction with fields:', updateFields);
        console.log('📝 Update values (excluding ID):', updateValues.slice(0, -1));
        console.log('📝 Field count:', updateFields.length, 'Value count (excluding ID):', updateValues.length - 1);
        
        const updateQuery = `UPDATE Customer_Purchase_Transaction SET ${updateFields.join(', ')} WHERE transaction_id = ?`;
        console.log('📝 Update SQL:', updateQuery);
        console.log('📝 Update values array:', updateValues);
        
        const [result] = await connection.execute(updateQuery, updateValues);
        
        console.log('✅ Update result - affectedRows:', result.affectedRows);
        
        if (result.affectedRows === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Verify the update by querying the database immediately (before commit)
        if (shipping_address !== undefined) {
          const [verify] = await connection.execute(
            'SELECT shipping_address FROM Customer_Purchase_Transaction WHERE transaction_id = ?',
            [id]
          );
          console.log('🔍 Verification (before commit) - shipping_address in DB:', verify[0]?.shipping_address);
        }
      } else {
        console.log('⚠️ No fields to update!');
      }
      
      // Commit transaction
      await connection.commit();
      console.log('✅ Transaction committed');
      
      // Get updated transaction with details - use a fresh connection to avoid any caching
      const [updatedTransaction] = await connection.execute(
        `SELECT t.*, c.email as customer_email, c.first_name, c.last_name
         FROM Customer_Purchase_Transaction t
         JOIN Customer c ON t.customer_id = c.customer_id
         WHERE t.transaction_id = ?`,
        [id]
      );
      
      if (updatedTransaction.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      console.log('🔍 After commit - shipping_address from DB query:', updatedTransaction[0]?.shipping_address);
      console.log('🔍 Raw shipping_address value:', JSON.stringify(updatedTransaction[0]?.shipping_address));
      console.log('🔍 All fields from updatedTransaction[0]:', Object.keys(updatedTransaction[0]));
      
      // Double-check with a direct query
      const [directCheck] = await connection.execute(
        'SELECT shipping_address FROM Customer_Purchase_Transaction WHERE transaction_id = ?',
        [id]
      );
      console.log('🔍 Direct check - shipping_address:', directCheck[0]?.shipping_address);
      
      // Get transaction details (items) to match the structure of GET endpoint
      const [details] = await connection.execute(
        `SELECT td.*, f.name, f.category 
         FROM Transaction_Details td
         JOIN Furniture f ON td.furniture_id = f.furniture_id
         WHERE td.transaction_id = ?`,
        [id]
      );
      
      connection.release();
      
      // Explicitly construct response to ensure shipping_address is included
      const response = {
        transaction_id: updatedTransaction[0].transaction_id,
        customer_id: updatedTransaction[0].customer_id,
        transaction_date: updatedTransaction[0].transaction_date,
        total_amount: updatedTransaction[0].total_amount,
        tax_amount: updatedTransaction[0].tax_amount,
        payment_method: updatedTransaction[0].payment_method,
        status: updatedTransaction[0].status,
        notes: updatedTransaction[0].notes,
        shipping_address: updatedTransaction[0].shipping_address !== undefined 
          ? updatedTransaction[0].shipping_address 
          : null,
        customer_email: updatedTransaction[0].customer_email,
        first_name: updatedTransaction[0].first_name,
        last_name: updatedTransaction[0].last_name,
        items: details
      };
      
      console.log('📤 Response shipping_address:', response.shipping_address);
      console.log('📤 Full response object keys:', Object.keys(response));
      console.log('========== END PUT /transactions/:id ==========\n');
      
      // Add debug info to response temporarily
      response._debug = {
        shipping_address_sent: shipping_address,
        shipping_address_in_db: updatedTransaction[0]?.shipping_address,
        shipping_address_in_response: response.shipping_address
      };
      
      res.json(response);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
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

