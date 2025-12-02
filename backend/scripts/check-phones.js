import { pool } from '../db/connection.js';

async function checkPhones() {
  try {
    console.log('Checking phone number formats...\n');
    
    const [customers] = await pool.execute('SELECT customer_id, email, phone FROM Customer WHERE phone IS NOT NULL');
    console.log(`Customer phone numbers (${customers.length} total):`);
    customers.forEach(c => {
      const match = /^\(\d{3}\) \d{3}-\d{4}$/.test(c.phone);
      console.log(`  ${c.customer_id}. ${c.email}: ${c.phone} ${match ? '✅' : '❌'}`);
    });
    
    console.log('\n');
    const [employees] = await pool.execute('SELECT employee_id, email, phone FROM Employee WHERE phone IS NOT NULL');
    console.log(`Employee phone numbers (${employees.length} total):`);
    employees.forEach(e => {
      const match = /^\(\d{3}\) \d{3}-\d{4}$/.test(e.phone);
      console.log(`  ${e.employee_id}. ${e.email}: ${e.phone} ${match ? '✅' : '❌'}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkPhones();

