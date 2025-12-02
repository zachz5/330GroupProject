import { pool } from '../db/connection.js';

async function checkDuplicates() {
  try {
    console.log('Checking for duplicate transactions...\n');
    
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
      `SELECT t.*, 
              (SELECT SUM(td.quantity) FROM Transaction_Details td WHERE td.transaction_id = t.transaction_id) as total_items
       FROM Customer_Purchase_Transaction t
       WHERE t.customer_id = ?
       ORDER BY t.transaction_date DESC`,
      [customerId]
    );
    
    console.log(`Total transactions: ${transactions.length}\n`);
    
    // Group by total_amount and total_items to find duplicates
    const groups = new Map();
    transactions.forEach(t => {
      const key = `${t.total_amount}_${t.total_items}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(t);
    });
    
    // Find duplicates
    let duplicateCount = 0;
    groups.forEach((group, key) => {
      if (group.length > 1) {
        duplicateCount += group.length - 1;
        console.log(`\n⚠️  Found ${group.length} transactions with same total ($${group[0].total_amount}) and item count (${group[0].total_items}):`);
        group.forEach(t => {
          console.log(`  Transaction ${t.transaction_id}: ${t.transaction_date}`);
        });
      }
    });
    
    if (duplicateCount === 0) {
      console.log('✅ No duplicate transactions found');
    } else {
      console.log(`\n📊 Total duplicate transactions: ${duplicateCount}`);
    }
    
    // Show all transactions
    console.log('\n\nAll transactions:');
    transactions.forEach((t, i) => {
      console.log(`  ${i + 1}. Transaction ${t.transaction_id}: $${t.total_amount}, ${t.total_items} items, ${t.transaction_date}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkDuplicates();


