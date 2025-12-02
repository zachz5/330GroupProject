import { pool } from '../db/connection.js';

async function checkDemoAccounts() {
  try {
    console.log('Checking for demo accounts...\n');

    const demoUserEmail = 'demo@campusrehome.com';
    const demoAdminEmail = 'admin@campusrehome.com';

    // Check demo user
    const [demoUser] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM customer WHERE email = ?',
      [demoUserEmail]
    );

    if (demoUser.length > 0) {
      console.log('✅ Demo user account found:');
      console.log(`   ID: ${demoUser[0].customer_id}`);
      console.log(`   Email: ${demoUser[0].email}`);
      console.log(`   Name: ${demoUser[0].first_name} ${demoUser[0].last_name}`);
    } else {
      console.log('❌ Demo user account NOT found');
    }

    // Check demo admin customer
    const [demoAdminCustomer] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM customer WHERE email = ?',
      [demoAdminEmail]
    );

    if (demoAdminCustomer.length > 0) {
      console.log('\n✅ Demo admin customer account found:');
      console.log(`   ID: ${demoAdminCustomer[0].customer_id}`);
      console.log(`   Email: ${demoAdminCustomer[0].email}`);
      console.log(`   Name: ${demoAdminCustomer[0].first_name} ${demoAdminCustomer[0].last_name}`);
    } else {
      console.log('\n❌ Demo admin customer account NOT found');
    }

    // Check demo admin employee
    const [demoAdminEmployee] = await pool.execute(
      'SELECT employee_id, email, first_name, last_name, role FROM employee WHERE email = ?',
      [demoAdminEmail]
    );

    if (demoAdminEmployee.length > 0) {
      console.log('\n✅ Demo admin employee record found:');
      console.log(`   ID: ${demoAdminEmployee[0].employee_id}`);
      console.log(`   Email: ${demoAdminEmployee[0].email}`);
      console.log(`   Name: ${demoAdminEmployee[0].first_name} ${demoAdminEmployee[0].last_name}`);
      console.log(`   Role: ${demoAdminEmployee[0].role}`);
    } else {
      console.log('\n❌ Demo admin employee record NOT found');
    }

    // List all customers
    console.log('\n📋 All customers in database:');
    const [allCustomers] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name FROM customer ORDER BY customer_id'
    );
    allCustomers.forEach(customer => {
      console.log(`   ${customer.customer_id}. ${customer.first_name} ${customer.last_name} (${customer.email})`);
    });

  } catch (error) {
    console.error('❌ Error checking demo accounts:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkDemoAccounts();


