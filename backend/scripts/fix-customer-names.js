import { pool } from '../db/connection.js';

async function fixCustomerNames() {
  try {
    console.log('Fixing customer names...\n');
    
    // Fix Olivia Brown's name
    const [result1] = await pool.execute(
      'UPDATE Customer SET first_name = ?, last_name = ? WHERE customer_id = ?',
      ['Olivia', 'Brown', 4]
    );
    
    if (result1.affectedRows > 0) {
      console.log('✅ Fixed Olivia Brown (customer_id 4)');
    }
    
    // Verify the fix
    const [olivia] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM Customer WHERE customer_id = ?',
      [4]
    );
    
    console.log('\nOlivia Brown after fix:');
    console.log(`  ID: ${olivia[0].customer_id}`);
    console.log(`  Email: ${olivia[0].email}`);
    console.log(`  Name: ${olivia[0].first_name} ${olivia[0].last_name}`);
    
    // Check demo user
    const [demo] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM Customer WHERE email = ?',
      ['demo@campusrehome.com']
    );
    
    console.log('\nDemo user:');
    if (demo.length > 0) {
      console.log(`  ID: ${demo[0].customer_id}`);
      console.log(`  Email: ${demo[0].email}`);
      console.log(`  Name: ${demo[0].first_name} ${demo[0].last_name}`);
    } else {
      console.log('  ❌ Demo user not found');
    }
    
    // List all customers to verify
    const [allCustomers] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM Customer ORDER BY customer_id'
    );
    
    console.log('\n\nAll customers after fix:');
    allCustomers.forEach(c => {
      console.log(`  ID: ${c.customer_id}, Email: ${c.email}, Name: ${c.first_name} ${c.last_name}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixCustomerNames();



