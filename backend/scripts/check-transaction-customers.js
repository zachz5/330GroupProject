import { pool } from '../db/connection.js';

async function checkTransactionCustomers() {
  try {
    console.log('Checking transaction customer assignments...\n');
    
    // Get all transactions with customer info
    const [transactions] = await pool.execute(
      `SELECT t.*, c.email, c.first_name, c.last_name
       FROM Customer_Purchase_Transaction t
       JOIN Customer c ON t.customer_id = c.customer_id
       ORDER BY t.transaction_date DESC`
    );
    
    console.log(`Total transactions: ${transactions.length}\n`);
    
    transactions.forEach((t, i) => {
      console.log(`Transaction ${t.transaction_id}:`);
      console.log(`  Customer ID: ${t.customer_id}`);
      console.log(`  Customer: ${t.first_name} ${t.last_name} (${t.email})`);
      console.log(`  Amount: $${t.total_amount}`);
      console.log(`  Date: ${t.transaction_date}`);
      console.log('');
    });
    
    // Check for demo customer specifically
    const [demoCustomer] = await pool.execute(
      'SELECT customer_id, email FROM Customer WHERE email = ?',
      ['demo@campusrehome.com']
    );
    
    if (demoCustomer.length > 0) {
      const demoId = demoCustomer[0].customer_id;
      const [demoTransactions] = await pool.execute(
        'SELECT * FROM Customer_Purchase_Transaction WHERE customer_id = ?',
        [demoId]
      );
      console.log(`\nDemo customer (ID ${demoId}) transactions: ${demoTransactions.length}`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTransactionCustomers();



