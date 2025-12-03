import { pool } from '../db/connection.js';

async function manuallyMigrateDemoOrders() {
  try {
    console.log('Manually migrating demo user orders...\n');
    
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
    
    // Check existing transactions
    const [existing] = await pool.execute(
      'SELECT * FROM Customer_Purchase_Transaction WHERE customer_id = ? ORDER BY transaction_date DESC',
      [customerId]
    );
    
    console.log(`Existing transactions for demo customer: ${existing.length}`);
    existing.forEach(t => {
      console.log(`  Transaction ${t.transaction_id}: $${t.total_amount} on ${t.transaction_date}`);
    });
    
    // The orders to migrate (based on user's description):
    // ORD-1764642901687-h5iuita34 - $140.00, 4 items, December 1, 2025
    // ORD-1764642146833-0hzy3sv6m - $210.00, 6 items, December 1, 2025
    
    // Since we can't access localStorage from Node.js, I'll create a script that the user can run
    // Or we can check if there are any transactions with these amounts/dates
    
    console.log('\n⚠️  Cannot access localStorage from Node.js.');
    console.log('To migrate these orders, you need to:');
    console.log('1. Open browser console (F12)');
    console.log('2. Run: JSON.parse(localStorage.getItem("campus_rehome_orders"))');
    console.log('3. Find the orders with IDs: ORD-1764642901687-h5iuita34 and ORD-1764642146833-0hzy3sv6m');
    console.log('4. Then we can manually insert them into the database\n');
    
    // Check if there are any transactions with these amounts on Dec 1, 2025
    const [dec1Transactions] = await pool.execute(
      `SELECT * FROM Customer_Purchase_Transaction 
       WHERE DATE(transaction_date) = '2025-12-01' 
       AND total_amount IN (140.00, 210.00)
       ORDER BY transaction_date DESC`
    );
    
    console.log(`Transactions on Dec 1, 2025 with amounts $140 or $210: ${dec1Transactions.length}`);
    dec1Transactions.forEach(t => {
      console.log(`  Transaction ${t.transaction_id}: Customer ${t.customer_id}, $${t.total_amount}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

manuallyMigrateDemoOrders();






