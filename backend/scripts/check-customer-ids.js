import { pool } from '../db/connection.js';

async function checkCustomerIds() {
  try {
    console.log('Checking customer IDs...\n');
    
    // Get all customers ordered by customer_id
    const [customers] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM Customer ORDER BY customer_id'
    );
    
    console.log('All customers in database:');
    customers.forEach(c => {
      console.log(`  Customer ID ${c.customer_id}: ${c.email} (${c.first_name} ${c.last_name})`);
    });
    
    // Check for gaps in the sequence
    console.log('\n\nChecking for gaps in customer_id sequence:');
    for (let i = 1; i <= customers.length + 5; i++) {
      const exists = customers.find(c => c.customer_id === i);
      if (!exists) {
        console.log(`  ⚠️  Customer ID ${i} is missing`);
      }
    }
    
    // Check the auto-increment value
    const [autoIncrement] = await pool.execute(
      `SELECT AUTO_INCREMENT 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Customer'`
    );
    
    if (autoIncrement.length > 0) {
      console.log(`\nAuto-increment value: ${autoIncrement[0].AUTO_INCREMENT}`);
    }
    
    // Check if there are any deleted customers (check transaction table for references)
    const [transactions] = await pool.execute(
      'SELECT DISTINCT customer_id FROM Customer_Purchase_Transaction ORDER BY customer_id'
    );
    
    console.log('\nCustomer IDs referenced in transactions:');
    transactions.forEach(t => {
      const customer = customers.find(c => c.customer_id === t.customer_id);
      if (customer) {
        console.log(`  Customer ID ${t.customer_id}: ${customer.email} (exists)`);
      } else {
        console.log(`  Customer ID ${t.customer_id}: (deleted or missing)`);
      }
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkCustomerIds();

