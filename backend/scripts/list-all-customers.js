import { pool } from '../db/connection.js';

async function listAllCustomers() {
  try {
    console.log('Listing all customers in database...\n');

    const [customers] = await pool.execute(
      'SELECT customer_id, first_name, last_name, email, phone, address, date_registered FROM customer ORDER BY customer_id'
    );

    console.log(`Total customers: ${customers.length}\n`);
    
    customers.forEach(customer => {
      console.log(`${customer.customer_id}\t${customer.first_name}\t${customer.last_name}\t${customer.email}\t${customer.phone || 'N/A'}\t${customer.address || 'N/A'}\t${customer.date_registered || 'N/A'}`);
    });

    // Check specifically for demo accounts
    console.log('\n🔍 Checking for demo accounts:');
    const [demoUser] = await pool.execute(
      'SELECT customer_id, email FROM customer WHERE email = ?',
      ['demo@campusrehome.com']
    );
    const [demoAdmin] = await pool.execute(
      'SELECT customer_id, email FROM customer WHERE email = ?',
      ['admin@campusrehome.com']
    );

    if (demoUser.length > 0) {
      console.log(`✅ Demo user found (ID: ${demoUser[0].customer_id})`);
    } else {
      console.log('❌ Demo user NOT found');
    }

    if (demoAdmin.length > 0) {
      console.log(`✅ Demo admin found (ID: ${demoAdmin[0].customer_id})`);
    } else {
      console.log('❌ Demo admin NOT found');
    }

  } catch (error) {
    console.error('❌ Error listing customers:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

listAllCustomers();






