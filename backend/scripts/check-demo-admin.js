import { pool } from '../db/connection.js';

async function checkDemoAdmin() {
  try {
    console.log('Checking demo admin account...\n');
    
    const [admin] = await pool.execute(
      'SELECT employee_id, email, first_name, last_name, role, password_hash FROM Employee WHERE email = ?',
      ['admin@campusrehome.com']
    );
    
    if (admin.length > 0) {
      console.log('Demo admin account:');
      console.log(`  Employee ID: ${admin[0].employee_id}`);
      console.log(`  Email: ${admin[0].email}`);
      console.log(`  Name: ${admin[0].first_name} ${admin[0].last_name}`);
      console.log(`  Role: ${admin[0].role}`);
      console.log(`  Has password_hash: ${admin[0].password_hash ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Demo admin account not found');
    }
    
    // Check if admin is also in Customer table
    const [adminAsCustomer] = await pool.execute(
      'SELECT customer_id, email FROM Customer WHERE email = ?',
      ['admin@campusrehome.com']
    );
    
    if (adminAsCustomer.length > 0) {
      console.log('\n⚠️  Admin account also exists in Customer table:');
      console.log(`  Customer ID: ${adminAsCustomer[0].customer_id}`);
    } else {
      console.log('\n✅ Admin account is NOT in Customer table (correct)');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkDemoAdmin();






