import { pool } from '../db/connection.js';

async function updateAllPhones() {
  try {
    console.log('Updating all phone numbers to (XXX) XXX-XXXX format...\n');

    // Update Customer table - 10 digit numbers
    const [customerResult1] = await pool.execute(`
      UPDATE Customer 
      SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 3), ') ', 
                        SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 4, 3), '-',
                        SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 7, 4))
      WHERE phone IS NOT NULL 
        AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 10
        AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$'
    `);
    console.log(`✅ Updated ${customerResult1.affectedRows} customer phone numbers (10 digits)`);

    // Update Customer table - 11 digit numbers starting with 1
    const [customerResult2] = await pool.execute(`
      UPDATE Customer 
      SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 2, 3), ') ', 
                        SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 5, 3), '-',
                        SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 8, 4))
      WHERE phone IS NOT NULL 
        AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 11
        AND SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 1) = '1'
        AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$'
    `);
    console.log(`✅ Updated ${customerResult2.affectedRows} customer phone numbers (11 digits)`);

    // Update Employee table - 10 digit numbers
    const [employeeResult1] = await pool.execute(`
      UPDATE Employee 
      SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 3), ') ', 
                        SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 4, 3), '-',
                        SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 7, 4))
      WHERE phone IS NOT NULL 
        AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 10
        AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$'
    `);
    console.log(`✅ Updated ${employeeResult1.affectedRows} employee phone numbers (10 digits)`);

    // Update Employee table - 11 digit numbers starting with 1
    const [employeeResult2] = await pool.execute(`
      UPDATE Employee 
      SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 2, 3), ') ', 
                        SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 5, 3), '-',
                        SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 8, 4))
      WHERE phone IS NOT NULL 
        AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 11
        AND SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 1) = '1'
        AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$'
    `);
    console.log(`✅ Updated ${employeeResult2.affectedRows} employee phone numbers (11 digits)`);

    // Verify results
    console.log('\n📋 Verification:');
    const [customers] = await pool.execute(
      'SELECT customer_id, email, phone FROM Customer WHERE phone IS NOT NULL ORDER BY customer_id LIMIT 10'
    );
    console.log('\nSample Customer phone numbers:');
    customers.forEach(c => {
      console.log(`  ${c.customer_id}. ${c.email}: ${c.phone}`);
    });

    const [employees] = await pool.execute(
      'SELECT employee_id, email, phone FROM Employee WHERE phone IS NOT NULL ORDER BY employee_id LIMIT 10'
    );
    console.log('\nSample Employee phone numbers:');
    employees.forEach(e => {
      console.log(`  ${e.employee_id}. ${e.email}: ${e.phone}`);
    });

    console.log('\n✅ All phone numbers updated!');

  } catch (error) {
    console.error('❌ Error updating phone numbers:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateAllPhones();


