import { pool } from '../db/connection.js';

async function checkDemoUsers() {
  try {
    console.log('Checking for demo users in Customer table...\n');
    
    // Get all customers with "demo" in their email or name
    const [allCustomers] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone FROM Customer ORDER BY customer_id'
    );
    
    console.log('All customers:');
    allCustomers.forEach(c => {
      console.log(`  ID: ${c.customer_id}, Email: ${c.email}, Name: ${c.first_name} ${c.last_name}, Phone: ${c.phone}`);
    });
    
    // Check specifically for demo accounts
    const [demoAccounts] = await pool.execute(
      `SELECT customer_id, email, first_name, last_name, phone 
       FROM Customer 
       WHERE email LIKE '%demo%' OR first_name LIKE '%demo%' OR last_name LIKE '%demo%'
       ORDER BY customer_id`
    );
    
    console.log(`\n\nDemo-related accounts (${demoAccounts.length}):`);
    demoAccounts.forEach(c => {
      console.log(`  ID: ${c.customer_id}`);
      console.log(`  Email: ${c.email}`);
      console.log(`  Name: ${c.first_name} ${c.last_name}`);
      console.log(`  Phone: ${c.phone}`);
      console.log('');
    });
    
    // Check for olivia brown
    const [olivia] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM Customer WHERE email = ?',
      ['olivia.brown@university.edu']
    );
    
    if (olivia.length > 0) {
      console.log('\nOlivia Brown account:');
      console.log(`  ID: ${olivia[0].customer_id}`);
      console.log(`  Email: ${olivia[0].email}`);
      console.log(`  Name: ${olivia[0].first_name} ${olivia[0].last_name}`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkDemoUsers();

