import { pool } from '../db/connection.js';

// This script would need to be run from the frontend or manually
// Since localStorage is browser-only, we can't access it from Node.js
// This is just a template - you'd need to export the localStorage data first

async function migrateOrder(orderData, customerId) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
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
    const normalizedPaymentMethod = paymentMethodMap[orderData.paymentMethod?.toLowerCase()] || 
                                     (orderData.paymentMethod && ['Credit Card', 'Debit Card', 'Cash', 'Venmo', 'PayPal'].includes(orderData.paymentMethod) 
                                       ? orderData.paymentMethod 
                                       : 'Credit Card');
    
    // Create transaction record
    const [transactionResult] = await connection.execute(
      `INSERT INTO Customer_Purchase_Transaction (customer_id, transaction_date, total_amount, payment_method, status)
       VALUES (?, ?, ?, ?, 'Completed')`,
      [customerId, orderData.date || new Date(), orderData.total, normalizedPaymentMethod]
    );
    
    const transactionId = transactionResult.insertId;
    
    // Create transaction details for each item
    for (const orderItem of orderData.items) {
      await connection.execute(
        `INSERT INTO Transaction_Details (transaction_id, furniture_id, quantity, price_each)
         VALUES (?, ?, ?, ?)`,
        [transactionId, orderItem.item.furniture_id, orderItem.quantity, orderItem.item.price]
      );
    }
    
    await connection.commit();
    console.log(`✅ Migrated order ${orderData.orderId} to transaction ${transactionId}`);
    return transactionId;
  } catch (error) {
    await connection.rollback();
    console.error(`❌ Error migrating order ${orderData.orderId}:`, error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// This would need to be called with order data from localStorage
// Example usage (you'd need to get this from browser console):
// const orders = JSON.parse(localStorage.getItem('campus_rehome_orders'));
// Then call migrateOrder for each order

console.log(`
To migrate existing localStorage orders:
1. Open browser console on the frontend
2. Run: JSON.parse(localStorage.getItem('campus_rehome_orders'))
3. Copy the orders array
4. For each order, you'd need to call this script with the order data and customer_id
`);

process.exit(0);






