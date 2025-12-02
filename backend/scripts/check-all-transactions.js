import { pool } from '../db/connection.js';

async function checkAll() {
  try {
    console.log('Checking all transactions...\n');
    
    // Get demo customer ID
    const [demoCustomer] = await pool.execute(
      'SELECT customer_id, email FROM Customer WHERE email = ?',
      ['demo@campusrehome.com']
    );
    
    if (demoCustomer.length === 0) {
      console.log('❌ Demo customer not found');
      return;
    }
    
    const customerId = demoCustomer[0].customer_id;
    console.log(`Demo customer ID: ${customerId} (${demoCustomer[0].email})\n`);
    
    // Get all transactions for demo customer
    const [transactions] = await pool.execute(
      `SELECT * FROM Customer_Purchase_Transaction 
       WHERE customer_id = ? 
       ORDER BY transaction_date DESC`,
      [customerId]
    );
    
    console.log(`Transactions in database for demo customer: ${transactions.length}\n`);
    
    transactions.forEach((t, i) => {
      console.log(`Transaction ${i + 1}:`);
      console.log(`  ID: ${t.transaction_id}`);
      console.log(`  Date: ${t.transaction_date}`);
      console.log(`  Total: $${t.total_amount}`);
      console.log(`  Payment: ${t.payment_method}`);
      console.log(`  Status: ${t.status}`);
    });
    
    // Get transaction details
    if (transactions.length > 0) {
      console.log('\nTransaction Details:');
      for (const t of transactions) {
        const [details] = await pool.execute(
          `SELECT td.*, f.name 
           FROM Transaction_Details td
           JOIN Furniture f ON td.furniture_id = f.furniture_id
           WHERE td.transaction_id = ?`,
          [t.transaction_id]
        );
        console.log(`\nTransaction ${t.transaction_id} items:`);
        details.forEach(d => {
          console.log(`  - ${d.name}: ${d.quantity} × $${d.price_each} = $${(d.quantity * d.price_each).toFixed(2)}`);
        });
      }
    }
    
    // Check all customers' transactions
    const [allTransactions] = await pool.execute(
      `SELECT t.*, c.email 
       FROM Customer_Purchase_Transaction t
       JOIN Customer c ON t.customer_id = c.customer_id
       ORDER BY t.transaction_date DESC 
       LIMIT 20`
    );
    console.log(`\n\nAll transactions in database (last 20):`);
    allTransactions.forEach((t, i) => {
      console.log(`  ${i + 1}. Customer ${t.customer_id} (${t.email}): $${t.total_amount} on ${t.transaction_date}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAll();



