import { pool } from '../db/connection.js';

async function checkProfileUpdate() {
  try {
    console.log('Checking profile update endpoint...\n');
    
    // Check what customer_id 4 and 6 have
    const [customer4] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone, address FROM Customer WHERE customer_id = ?',
      [4]
    );
    
    const [customer6] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone, address FROM Customer WHERE customer_id = ?',
      [6]
    );
    
    console.log('Customer ID 4 (Olivia Brown):');
    if (customer4.length > 0) {
      console.log(`  Email: ${customer4[0].email}`);
      console.log(`  Name: ${customer4[0].first_name} ${customer4[0].last_name}`);
      console.log(`  Phone: ${customer4[0].phone}`);
      console.log(`  Address: ${customer4[0].address || 'None'}`);
    }
    
    console.log('\nCustomer ID 6 (Demo User):');
    if (customer6.length > 0) {
      console.log(`  Email: ${customer6[0].email}`);
      console.log(`  Name: ${customer6[0].first_name} ${customer6[0].last_name}`);
      console.log(`  Phone: ${customer6[0].phone}`);
      console.log(`  Address: ${customer6[0].address || 'None'}`);
    }
    
    // Check if there's any confusion - maybe customer 4 has demo email?
    const [customer4ByEmail] = await pool.execute(
      'SELECT customer_id, email FROM Customer WHERE email = ?',
      ['demo@campusrehome.com']
    );
    
    console.log('\n\nCustomers with demo@campusrehome.com email:');
    customer4ByEmail.forEach(c => {
      console.log(`  Customer ID: ${c.customer_id}, Email: ${c.email}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkProfileUpdate();



