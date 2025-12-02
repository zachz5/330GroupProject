import { pool } from '../db/connection.js';

async function checkDeletedCustomers() {
  try {
    console.log('Checking for deleted customers...\n');
    
    // Get current customers
    const [customers] = await pool.execute(
      'SELECT customer_id, email FROM Customer ORDER BY customer_id'
    );
    
    const existingIds = new Set(customers.map(c => c.customer_id));
    console.log('Existing customer IDs:', Array.from(existingIds).sort((a, b) => a - b).join(', '));
    
    // Check if customer_id 7 is referenced anywhere
    const [transactions7] = await pool.execute(
      'SELECT * FROM Customer_Purchase_Transaction WHERE customer_id = ?',
      [7]
    );
    
    if (transactions7.length > 0) {
      console.log(`\n⚠️  Customer ID 7 has ${transactions7.length} transaction(s) but the customer doesn't exist!`);
      console.log('This suggests customer_id 7 was deleted but transactions remain.');
    } else {
      console.log('\n✅ Customer ID 7 has no transactions');
    }
    
    // Check the actual auto-increment value more carefully
    const [tableInfo] = await pool.execute(
      `SHOW TABLE STATUS LIKE 'Customer'`
    );
    
    if (tableInfo.length > 0) {
      console.log(`\nTable status:`);
      console.log(`  Auto_increment: ${tableInfo[0].Auto_increment}`);
      console.log(`  Rows: ${tableInfo[0].Rows}`);
    }
    
    // Get max customer_id
    const [maxId] = await pool.execute(
      'SELECT MAX(customer_id) as max_id FROM Customer'
    );
    
    console.log(`\nMaximum customer_id in database: ${maxId[0].max_id}`);
    console.log(`Next auto-increment should be: ${maxId[0].max_id + 1}`);
    
    // Check if there are any foreign key constraints that might prevent deletion
    const [constraints] = await pool.execute(
      `SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
       AND REFERENCED_TABLE_NAME = 'Customer'
       AND REFERENCED_COLUMN_NAME = 'customer_id'`
    );
    
    if (constraints.length > 0) {
      console.log('\n\nTables that reference Customer.customer_id:');
      constraints.forEach(c => {
        console.log(`  ${c.TABLE_NAME}.${c.COLUMN_NAME} -> Customer.customer_id`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkDeletedCustomers();


