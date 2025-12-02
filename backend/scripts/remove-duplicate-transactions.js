import { pool } from '../db/connection.js';

async function removeDuplicates() {
  try {
    console.log('Removing duplicate transactions...\n');
    
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
    
    // Group by total_amount and total_items to find duplicates
    const groups = new Map();
    transactions.forEach(t => {
      const key = `${t.total_amount}_${t.total_items}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(t);
    });
    
    // Find duplicates and keep only the first (most recent) one
    let removedCount = 0;
    const transactionsToRemove = [];
    
    groups.forEach((group, key) => {
      if (group.length > 1) {
        // Sort by transaction_id descending (most recent first)
        group.sort((a, b) => b.transaction_id - a.transaction_id);
        
        // Keep the first one, remove the rest
        console.log(`\nFound ${group.length} duplicates for $${group[0].total_amount} / ${group[0].total_items} items:`);
        console.log(`  Keeping transaction ${group[0].transaction_id} (most recent)`);
        
        for (let i = 1; i < group.length; i++) {
          console.log(`  Removing transaction ${group[i].transaction_id}`);
          transactionsToRemove.push(group[i].transaction_id);
        }
      }
    });
    
    if (transactionsToRemove.length === 0) {
      console.log('\n✅ No duplicate transactions to remove');
      return;
    }
    
    console.log(`\n\nRemoving ${transactionsToRemove.length} duplicate transactions...`);
    
    // Remove transaction details first (foreign key constraint)
    for (const transactionId of transactionsToRemove) {
      await pool.execute(
        'DELETE FROM Transaction_Details WHERE transaction_id = ?',
        [transactionId]
      );
    }
    
    // Then remove the transactions
    for (const transactionId of transactionsToRemove) {
      await pool.execute(
        'DELETE FROM Customer_Purchase_Transaction WHERE transaction_id = ?',
        [transactionId]
      );
      removedCount++;
    }
    
    console.log(`✅ Removed ${removedCount} duplicate transactions`);
    
    // Verify
    const [remaining] = await pool.execute(
      `SELECT COUNT(*) as count FROM Customer_Purchase_Transaction WHERE customer_id = ?`,
      [customerId]
    );
    
    console.log(`\nRemaining transactions for demo customer: ${remaining[0].count}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

removeDuplicates();

