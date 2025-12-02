import { pool } from '../db/connection.js';
import bcrypt from 'bcryptjs';

async function testDemoLogin() {
  try {
    console.log('Testing demo account login...\n');
    
    const email = 'demo@campusrehome.com';
    const password = 'demo123';
    
    // Check what's in the database for demo account
    const [demoCustomer] = await pool.execute(
      'SELECT customer_id, email, password_hash, first_name, last_name FROM Customer WHERE email = ?',
      [email]
    );
    
    if (demoCustomer.length === 0) {
      console.log('❌ Demo customer not found in database');
      return;
    }
    
    const customer = demoCustomer[0];
    console.log('Demo customer in database:');
    console.log(`  Customer ID: ${customer.customer_id}`);
    console.log(`  Email: ${customer.email}`);
    console.log(`  Name: ${customer.first_name} ${customer.last_name}`);
    console.log(`  Has password_hash: ${customer.password_hash ? 'Yes' : 'No'}\n`);
    
    // Test password verification
    if (customer.password_hash) {
      const isValid = await bcrypt.compare(password, customer.password_hash);
      console.log(`Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}\n`);
    }
    
    // Check what customer_id 4 is
    const [customer4] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM Customer WHERE customer_id = ?',
      [4]
    );
    
    if (customer4.length > 0) {
      console.log('Customer ID 4 (Olivia Brown):');
      console.log(`  Email: ${customer4[0].email}`);
      console.log(`  Name: ${customer4[0].first_name} ${customer4[0].last_name}`);
    }
    
    // Check if there are any other customers with demo email
    const [allDemos] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM Customer WHERE email LIKE ?',
      ['%demo%']
    );
    
    console.log(`\nAll customers with 'demo' in email (${allDemos.length}):`);
    allDemos.forEach(c => {
      console.log(`  ID: ${c.customer_id}, Email: ${c.email}, Name: ${c.first_name} ${c.last_name}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

testDemoLogin();



