import { pool } from '../db/connection.js';
import bcrypt from 'bcryptjs';

async function migrateDemoAccounts() {
  try {
    console.log('Migrating demo accounts to Customer and Employee tables...\n');

    // Check what tables exist
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
    );
    console.log('Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    console.log('');

    const demoUserEmail = 'demo@campusrehome.com';
    const demoUserPassword = 'demo123';
    const demoUserPasswordHash = await bcrypt.hash(demoUserPassword, 10);

    const demoAdminEmail = 'admin@campusrehome.com';
    const demoAdminPassword = 'admin123';
    const demoAdminPasswordHash = await bcrypt.hash(demoAdminPassword, 10);

    // Check if lowercase customer table exists and has demo accounts
    let customerTableName = 'customer';
    let employeeTableName = 'employee';
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    if (tableNames.includes('Customer')) {
      customerTableName = 'Customer';
    }
    if (tableNames.includes('Employee')) {
      employeeTableName = 'Employee';
    }

    console.log(`Using tables: ${customerTableName} and ${employeeTableName}\n`);

    // Check for demo user in lowercase table
    try {
      const [demoUserLower] = await pool.execute(
        `SELECT * FROM customer WHERE email = ?`,
        [demoUserEmail]
      );

      if (demoUserLower.length > 0 && customerTableName === 'Customer') {
        console.log('Found demo user in lowercase customer table, moving to Customer table...');
        const user = demoUserLower[0];
        
        // Check if already exists in Customer table
        const [existingInCustomer] = await pool.execute(
          `SELECT customer_id FROM Customer WHERE email = ?`,
          [demoUserEmail]
        );

        if (existingInCustomer.length === 0) {
          await pool.execute(
            `INSERT INTO Customer (email, password_hash, first_name, last_name, phone, address, date_registered) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              user.email,
              demoUserPasswordHash, // Use fresh hash
              user.first_name,
              user.last_name,
              user.phone,
              user.address,
              user.date_registered || new Date()
            ]
          );
          console.log('✅ Demo user moved to Customer table');
        } else {
          // Update password if exists
          await pool.execute(
            `UPDATE Customer SET password_hash = ? WHERE email = ?`,
            [demoUserPasswordHash, demoUserEmail]
          );
          console.log('✅ Demo user already in Customer table - password updated');
        }

        // Delete from lowercase table
        await pool.execute(`DELETE FROM customer WHERE email = ?`, [demoUserEmail]);
        console.log('✅ Removed demo user from lowercase customer table');
      }
    } catch (err) {
      console.log('ℹ️  No lowercase customer table or demo user not found there');
    }

    // Check for demo admin in lowercase customer table
    try {
      const [demoAdminLower] = await pool.execute(
        `SELECT * FROM customer WHERE email = ?`,
        [demoAdminEmail]
      );

      if (demoAdminLower.length > 0 && customerTableName === 'Customer') {
        console.log('Found demo admin in lowercase customer table, moving to Customer table...');
        const admin = demoAdminLower[0];
        
        // Check if already exists in Customer table
        const [existingInCustomer] = await pool.execute(
          `SELECT customer_id FROM Customer WHERE email = ?`,
          [demoAdminEmail]
        );

        if (existingInCustomer.length === 0) {
          await pool.execute(
            `INSERT INTO Customer (email, password_hash, first_name, last_name, phone, address, date_registered) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              admin.email,
              demoAdminPasswordHash, // Use fresh hash
              admin.first_name,
              admin.last_name,
              admin.phone,
              admin.address,
              admin.date_registered || new Date()
            ]
          );
          console.log('✅ Demo admin moved to Customer table');
        } else {
          // Update password if exists
          await pool.execute(
            `UPDATE Customer SET password_hash = ? WHERE email = ?`,
            [demoAdminPasswordHash, demoAdminEmail]
          );
          console.log('✅ Demo admin already in Customer table - password updated');
        }

        // Delete from lowercase table
        await pool.execute(`DELETE FROM customer WHERE email = ?`, [demoAdminEmail]);
        console.log('✅ Removed demo admin from lowercase customer table');
      }
    } catch (err) {
      console.log('ℹ️  No lowercase customer table or demo admin not found there');
    }

    // Check for demo admin in lowercase employee table
    try {
      const [demoAdminEmpLower] = await pool.execute(
        `SELECT * FROM employee WHERE email = ?`,
        [demoAdminEmail]
      );

      if (demoAdminEmpLower.length > 0 && employeeTableName === 'Employee') {
        console.log('Found demo admin in lowercase employee table, moving to Employee table...');
        const emp = demoAdminEmpLower[0];
        
        // Check if already exists in Employee table
        const [existingInEmployee] = await pool.execute(
          `SELECT employee_id FROM Employee WHERE email = ?`,
          [demoAdminEmail]
        );

        if (existingInEmployee.length === 0) {
          await pool.execute(
            `INSERT INTO Employee (first_name, last_name, email, phone, role, hire_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              emp.first_name,
              emp.last_name,
              emp.email,
              emp.phone,
              emp.role || 'Administrator',
              emp.hire_date || new Date()
            ]
          );
          console.log('✅ Demo admin employee moved to Employee table');
        } else {
          // Update role if exists
          await pool.execute(
            `UPDATE Employee SET role = ?, first_name = ?, last_name = ? WHERE email = ?`,
            ['Administrator', 'Demo', 'Admin', demoAdminEmail]
          );
          console.log('✅ Demo admin employee already in Employee table - updated');
        }

        // Delete from lowercase table
        await pool.execute(`DELETE FROM employee WHERE email = ?`, [demoAdminEmail]);
        console.log('✅ Removed demo admin from lowercase employee table');
      }
    } catch (err) {
      console.log('ℹ️  No lowercase employee table or demo admin not found there');
    }

    // Ensure demo accounts exist in proper tables (create if they don't exist)
    console.log('\nEnsuring demo accounts exist in proper tables...');
    
    // Demo User in Customer table
    const [demoUserCheck] = await pool.execute(
      `SELECT customer_id FROM ${customerTableName} WHERE email = ?`,
      [demoUserEmail]
    );
    
    if (demoUserCheck.length === 0) {
      await pool.execute(
        `INSERT INTO ${customerTableName} (email, password_hash, first_name, last_name, phone, address) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          demoUserEmail,
          demoUserPasswordHash,
          'Demo',
          'User',
          '(555) 111-2222',
          '123 Campus Ave, University City, ST 12345'
        ]
      );
      console.log('✅ Demo user created in Customer table');
    } else {
      await pool.execute(
        `UPDATE ${customerTableName} SET password_hash = ? WHERE email = ?`,
        [demoUserPasswordHash, demoUserEmail]
      );
      console.log('✅ Demo user exists in Customer table - password updated');
    }

    // Demo Admin in Customer table
    const [demoAdminCheck] = await pool.execute(
      `SELECT customer_id FROM ${customerTableName} WHERE email = ?`,
      [demoAdminEmail]
    );
    
    if (demoAdminCheck.length === 0) {
      await pool.execute(
        `INSERT INTO ${customerTableName} (email, password_hash, first_name, last_name, phone, address) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          demoAdminEmail,
          demoAdminPasswordHash,
          'Demo',
          'Admin',
          '(555) 999-8888',
          '456 Admin St, University City, ST 12345'
        ]
      );
      console.log('✅ Demo admin created in Customer table');
    } else {
      await pool.execute(
        `UPDATE ${customerTableName} SET password_hash = ? WHERE email = ?`,
        [demoAdminPasswordHash, demoAdminEmail]
      );
      console.log('✅ Demo admin exists in Customer table - password updated');
    }

    // Demo Admin in Employee table
    const [demoAdminEmpCheck] = await pool.execute(
      `SELECT employee_id FROM ${employeeTableName} WHERE email = ?`,
      [demoAdminEmail]
    );
    
    if (demoAdminEmpCheck.length === 0) {
      await pool.execute(
        `INSERT INTO ${employeeTableName} (first_name, last_name, email, phone, role, hire_date) 
         VALUES (?, ?, ?, ?, ?, CURDATE())`,
        [
          'Demo',
          'Admin',
          demoAdminEmail,
          '(555) 999-8888',
          'Administrator'
        ]
      );
      console.log('✅ Demo admin created in Employee table');
    } else {
      await pool.execute(
        `UPDATE ${employeeTableName} SET role = ?, first_name = ?, last_name = ? WHERE email = ?`,
        ['Administrator', 'Demo', 'Admin', demoAdminEmail]
      );
      console.log('✅ Demo admin exists in Employee table - updated');
    }

    // Remove any duplicates in Customer table
    console.log('\nChecking for duplicates in Customer table...');
    const [duplicates] = await pool.execute(
      `SELECT email, COUNT(*) as count FROM ${customerTableName} 
       WHERE email IN (?, ?) 
       GROUP BY email 
       HAVING count > 1`,
      [demoUserEmail, demoAdminEmail]
    );

    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicates, removing...');
      for (const dup of duplicates) {
        const [records] = await pool.execute(
          `SELECT customer_id FROM ${customerTableName} WHERE email = ? ORDER BY customer_id`,
          [dup.email]
        );
        // Keep the first one, delete the rest
        for (let i = 1; i < records.length; i++) {
          await pool.execute(
            `DELETE FROM ${customerTableName} WHERE customer_id = ?`,
            [records[i].customer_id]
          );
          console.log(`✅ Removed duplicate customer_id ${records[i].customer_id} for ${dup.email}`);
        }
      }
    } else {
      console.log('✅ No duplicates found in Customer table');
    }

    // Remove any duplicates in Employee table
    console.log('\nChecking for duplicates in Employee table...');
    const [empDuplicates] = await pool.execute(
      `SELECT email, COUNT(*) as count FROM ${employeeTableName} 
       WHERE email = ? 
       GROUP BY email 
       HAVING count > 1`,
      [demoAdminEmail]
    );

    if (empDuplicates.length > 0) {
      console.log('⚠️  Found duplicates, removing...');
      const [records] = await pool.execute(
        `SELECT employee_id FROM ${employeeTableName} WHERE email = ? ORDER BY employee_id`,
        [demoAdminEmail]
      );
      // Keep the first one, delete the rest
      for (let i = 1; i < records.length; i++) {
        await pool.execute(
          `DELETE FROM ${employeeTableName} WHERE employee_id = ?`,
          [records[i].employee_id]
        );
        console.log(`✅ Removed duplicate employee_id ${records[i].employee_id} for ${demoAdminEmail}`);
      }
    } else {
      console.log('✅ No duplicates found in Employee table');
    }

    console.log('\n📋 Final Demo Account Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const [finalDemoUser] = await pool.execute(
      `SELECT customer_id, email FROM ${customerTableName} WHERE email = ?`,
      [demoUserEmail]
    );
    if (finalDemoUser.length > 0) {
      console.log(`✅ Demo User in ${customerTableName} table (ID: ${finalDemoUser[0].customer_id})`);
    }

    const [finalDemoAdmin] = await pool.execute(
      `SELECT customer_id, email FROM ${customerTableName} WHERE email = ?`,
      [demoAdminEmail]
    );
    if (finalDemoAdmin.length > 0) {
      console.log(`✅ Demo Admin in ${customerTableName} table (ID: ${finalDemoAdmin[0].customer_id})`);
    }

    const [finalDemoAdminEmp] = await pool.execute(
      `SELECT employee_id, email, role FROM ${employeeTableName} WHERE email = ?`,
      [demoAdminEmail]
    );
    if (finalDemoAdminEmp.length > 0) {
      console.log(`✅ Demo Admin in ${employeeTableName} table (ID: ${finalDemoAdminEmp[0].employee_id}, Role: ${finalDemoAdminEmp[0].role})`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error migrating demo accounts:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateDemoAccounts();

