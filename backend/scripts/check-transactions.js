import { pool } from '../db/connection.js';

async function checkTransactions() {
  try {
    console.log('Checking transactions in database...\n');
    
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
    
    console.log(`Total transactions for demo customer: ${transactions.length}\n`);
    
    if (transactions.length > 0) {
      transactions.forEach((t, i) => {
        console.log(`Transaction ${i + 1}:`);
        console.log(`  ID: ${t.transaction_id}`);
        console.log(`  Date: ${t.transaction_date}`);
        console.log(`  Total: $${t.total_amount}`);
        console.log(`  Payment: ${t.payment_method}`);
        console.log(`  Status: ${t.status}`);
      });
    } else {
      console.log('No transactions found for demo customer');
    }
    
    // Check all transactions
    const [allTransactions] = await pool.execute(
      'SELECT * FROM Customer_Purchase_Transaction ORDER BY transaction_date DESC LIMIT 10'
    );
    console.log(`\nTotal transactions in database: ${allTransactions.length}`);
    allTransactions.forEach((t, i) => {
      console.log(`  ${i + 1}. Customer ${t.customer_id}: $${t.total_amount} on ${t.transaction_date}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTransactions();


