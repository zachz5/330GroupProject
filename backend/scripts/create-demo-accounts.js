import { pool } from '../db/connection.js';
import bcrypt from 'bcryptjs';

async function createDemoAccounts() {
  try {
    console.log('Creating demo accounts...');

    // Demo User Account
    const demoUserEmail = 'demo@campusrehome.com';
    const demoUserPassword = 'demo123';
    const demoUserPasswordHash = await bcrypt.hash(demoUserPassword, 10);

    // Check if demo user already exists
    const [existingUser] = await pool.execute(
      'SELECT customer_id FROM Customer WHERE email = ?',
      [demoUserEmail]
    );

    if (existingUser.length === 0) {
      // Create demo customer
      await pool.execute(
        'INSERT INTO Customer (email, password_hash, first_name, last_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
        [
          demoUserEmail,
          demoUserPasswordHash,
          'Demo',
          'User',
          '(555) 111-2222',
          '123 Campus Ave, University City, ST 12345'
        ]
      );
      console.log('✅ Demo user account created');
      console.log(`   Email: ${demoUserEmail}`);
      console.log(`   Password: ${demoUserPassword}`);
    } else {
      // Update password hash in case it was changed
      await pool.execute(
        'UPDATE Customer SET password_hash = ? WHERE email = ?',
        [demoUserPasswordHash, demoUserEmail]
      );
      console.log('✅ Demo user account already exists - password updated');
      console.log(`   Email: ${demoUserEmail}`);
      console.log(`   Password: ${demoUserPassword}`);
    }

    // Demo Admin Account (Employee ONLY - not a customer)
    const demoAdminEmail = 'admin@campusrehome.com';
    const demoAdminPassword = 'admin123';
    const demoAdminPasswordHash = await bcrypt.hash(demoAdminPassword, 10);

    // Ensure password_hash column exists in Employee table
    try {
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'Employee' 
         AND COLUMN_NAME = 'password_hash'`
      );
      if (columns.length === 0) {
        await pool.execute(
          `ALTER TABLE Employee ADD COLUMN password_hash VARCHAR(255) NULL`
        );
        console.log('✅ Added password_hash column to Employee table');
      }
    } catch (err) {
      // Column might already exist or table might not exist
    }

    // Check if demo admin employee already exists
    const [existingAdminEmployee] = await pool.execute(
      'SELECT employee_id FROM Employee WHERE email = ?',
      [demoAdminEmail]
    );

    if (existingAdminEmployee.length === 0) {
      // Create demo admin employee record with password
      await pool.execute(
        'INSERT INTO Employee (first_name, last_name, email, phone, role, hire_date, password_hash) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)',
        [
          'Demo',
          'Admin',
          demoAdminEmail,
          '(555) 999-8888',
          'Administrator',
          demoAdminPasswordHash
        ]
      );
      console.log('✅ Demo admin employee record created');
      console.log(`   Email: ${demoAdminEmail}`);
      console.log(`   Password: ${demoAdminPassword}`);
      console.log(`   Role: Administrator`);
    } else {
      // Update employee record with password
      await pool.execute(
        'UPDATE Employee SET role = ?, first_name = ?, last_name = ?, password_hash = ? WHERE email = ?',
        ['Administrator', 'Demo', 'Admin', demoAdminPasswordHash, demoAdminEmail]
      );
      console.log('✅ Demo admin employee record updated with password');
      console.log(`   Email: ${demoAdminEmail}`);
      console.log(`   Password: ${demoAdminPassword}`);
      console.log(`   Role: Administrator`);
    }

    // Remove admin from Customer table if it exists (should not be there)
    const [adminInCustomer] = await pool.execute(
      'SELECT customer_id FROM Customer WHERE email = ?',
      [demoAdminEmail]
    );
    if (adminInCustomer.length > 0) {
      await pool.execute('DELETE FROM Customer WHERE email = ?', [demoAdminEmail]);
      console.log('✅ Removed demo admin from Customer table (employees should not be customers)');
    }

    console.log('\n📋 Demo Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo User:');
    console.log(`  Email: ${demoUserEmail}`);
    console.log(`  Password: ${demoUserPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo Admin:');
    console.log(`  Email: ${demoAdminEmail}`);
    console.log(`  Password: ${demoAdminPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error creating demo accounts:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createDemoAccounts();

