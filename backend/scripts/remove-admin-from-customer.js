import { pool } from '../db/connection.js';
import bcrypt from 'bcryptjs';

async function removeAdminFromCustomer() {
  try {
    console.log('Removing demo admin from Customer table and setting up Employee-only login...\n');

    const demoAdminEmail = 'admin@campusrehome.com';
    const demoAdminPassword = 'admin123';
    const demoAdminPasswordHash = await bcrypt.hash(demoAdminPassword, 10);

    // Check if password_hash column exists in Employee table
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Employee' 
       AND COLUMN_NAME = 'password_hash'`
    );

    if (columns.length === 0) {
      console.log('Adding password_hash column to Employee table...');
      await pool.execute(
        `ALTER TABLE Employee ADD COLUMN password_hash VARCHAR(255) NULL`
      );
      console.log('✅ Added password_hash column to Employee table\n');
    }

    // Update employee with password
    const [employee] = await pool.execute(
      'SELECT employee_id FROM Employee WHERE email = ?',
      [demoAdminEmail]
    );

    if (employee.length > 0) {
      await pool.execute(
        'UPDATE Employee SET password_hash = ? WHERE email = ?',
        [demoAdminPasswordHash, demoAdminEmail]
      );
      console.log('✅ Updated Employee table with password hash');
    } else {
      console.log('❌ Demo admin not found in Employee table');
    }

    // Remove from Customer table
    const [customer] = await pool.execute(
      'SELECT customer_id FROM Customer WHERE email = ?',
      [demoAdminEmail]
    );

    if (customer.length > 0) {
      await pool.execute(
        'DELETE FROM Customer WHERE email = ?',
        [demoAdminEmail]
      );
      console.log('✅ Removed demo admin from Customer table');
    } else {
      console.log('ℹ️  Demo admin not found in Customer table (already removed)');
    }

    console.log('\n📋 Final Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const [finalEmployee] = await pool.execute(
      'SELECT employee_id, email, role FROM Employee WHERE email = ?',
      [demoAdminEmail]
    );
    if (finalEmployee.length > 0) {
      console.log(`✅ Demo Admin in Employee table (ID: ${finalEmployee[0].employee_id}, Role: ${finalEmployee[0].role})`);
      console.log(`   Email: ${demoAdminEmail}`);
      console.log(`   Password: ${demoAdminPassword}`);
    }

    const [finalCustomer] = await pool.execute(
      'SELECT customer_id FROM Customer WHERE email = ?',
      [demoAdminEmail]
    );
    if (finalCustomer.length > 0) {
      console.log(`⚠️  Demo Admin still in Customer table (ID: ${finalCustomer[0].customer_id})`);
    } else {
      console.log('✅ Demo Admin NOT in Customer table (correct)');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

removeAdminFromCustomer();



