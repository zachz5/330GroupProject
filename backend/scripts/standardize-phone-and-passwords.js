import { pool } from '../db/connection.js';
import bcrypt from 'bcryptjs';

/**
 * Normalize phone number to 10 digits, removing all non-digit characters
 * Returns formatted as (XXX) XXX-XXXX
 */
function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If we have exactly 10 digits, format it
  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  
  // If we have 11 digits and starts with 1, remove the 1
  if (digits.length === 11 && digits.startsWith('1')) {
    const tenDigits = digits.substring(1);
    return `(${tenDigits.substring(0, 3)}) ${tenDigits.substring(3, 6)}-${tenDigits.substring(6)}`;
  }
  
  // If we can't normalize it, return null
  return null;
}

async function standardizePhoneAndPasswords() {
  try {
    console.log('Standardizing phone numbers and ensuring password hashes...\n');

    // Ensure password_hash column exists in Employee table
    const [empColumns] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Employee' 
       AND COLUMN_NAME = 'password_hash'`
    );

    if (empColumns.length === 0) {
      console.log('Adding password_hash column to Employee table...');
      await pool.execute(
        `ALTER TABLE Employee ADD COLUMN password_hash VARCHAR(255) NULL`
      );
      console.log('✅ Added password_hash column to Employee table\n');
    }

    // Process Customer table
    console.log('Processing Customer table...');
    const [customers] = await pool.execute(
      'SELECT customer_id, email, phone, password_hash FROM Customer'
    );

    let customerPhoneUpdates = 0;
    let customerPasswordUpdates = 0;

    for (const customer of customers) {
      let needsUpdate = false;
      const updates = [];
      const values = [];

      // Normalize phone number
      const normalizedPhone = normalizePhone(customer.phone);
      if (normalizedPhone && normalizedPhone !== customer.phone) {
        updates.push('phone = ?');
        values.push(normalizedPhone);
        needsUpdate = true;
        customerPhoneUpdates++;
      } else if (!normalizedPhone && customer.phone) {
        // Phone exists but can't be normalized - set to null or keep as is
        console.log(`⚠️  Customer ${customer.customer_id} (${customer.email}) has unnormalizable phone: ${customer.phone}`);
      }

      // Ensure password hash exists
      if (!customer.password_hash) {
        // Generate a default password: "password123" for demo purposes
        // In production, you'd want to force password reset
        const defaultPassword = 'password123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        updates.push('password_hash = ?');
        values.push(passwordHash);
        needsUpdate = true;
        customerPasswordUpdates++;
        console.log(`⚠️  Customer ${customer.customer_id} (${customer.email}) missing password - setting default password`);
      }

      if (needsUpdate) {
        values.push(customer.customer_id);
        await pool.execute(
          `UPDATE Customer SET ${updates.join(', ')} WHERE customer_id = ?`,
          values
        );
      }
    }

    console.log(`✅ Customer table: Updated ${customerPhoneUpdates} phone numbers, ${customerPasswordUpdates} passwords\n`);

    // Process Employee table
    console.log('Processing Employee table...');
    const [employees] = await pool.execute(
      'SELECT employee_id, email, phone, password_hash FROM Employee'
    );

    let employeePhoneUpdates = 0;
    let employeePasswordUpdates = 0;

    for (const employee of employees) {
      let needsUpdate = false;
      const updates = [];
      const values = [];

      // Normalize phone number
      const normalizedPhone = normalizePhone(employee.phone);
      if (normalizedPhone && normalizedPhone !== employee.phone) {
        updates.push('phone = ?');
        values.push(normalizedPhone);
        needsUpdate = true;
        employeePhoneUpdates++;
      } else if (!normalizedPhone && employee.phone) {
        console.log(`⚠️  Employee ${employee.employee_id} (${employee.email}) has unnormalizable phone: ${employee.phone}`);
      }

      // Ensure password hash exists
      if (!employee.password_hash) {
        // For demo admin, use admin123, for others use default
        const defaultPassword = employee.email === 'admin@campusrehome.com' ? 'admin123' : 'password123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        updates.push('password_hash = ?');
        values.push(passwordHash);
        needsUpdate = true;
        employeePasswordUpdates++;
        console.log(`⚠️  Employee ${employee.employee_id} (${employee.email}) missing password - setting default password`);
      }

      if (needsUpdate) {
        values.push(employee.employee_id);
        await pool.execute(
          `UPDATE Employee SET ${updates.join(', ')} WHERE employee_id = ?`,
          values
        );
      }
    }

    console.log(`✅ Employee table: Updated ${employeePhoneUpdates} phone numbers, ${employeePasswordUpdates} passwords\n`);

    // Summary
    console.log('📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Customer table:`);
    console.log(`  Total customers: ${customers.length}`);
    console.log(`  Phone numbers standardized: ${customerPhoneUpdates}`);
    console.log(`  Passwords added: ${customerPasswordUpdates}`);
    console.log(`Employee table:`);
    console.log(`  Total employees: ${employees.length}`);
    console.log(`  Phone numbers standardized: ${employeePhoneUpdates}`);
    console.log(`  Passwords added: ${employeePasswordUpdates}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Verify demo accounts
    console.log('\n🔍 Verifying demo accounts:');
    const [demoUser] = await pool.execute(
      'SELECT customer_id, email, phone, password_hash FROM Customer WHERE email = ?',
      ['demo@campusrehome.com']
    );
    if (demoUser.length > 0) {
      console.log(`✅ Demo User: phone=${demoUser[0].phone}, has_password=${!!demoUser[0].password_hash}`);
    }

    const [demoAdmin] = await pool.execute(
      'SELECT employee_id, email, phone, password_hash FROM Employee WHERE email = ?',
      ['admin@campusrehome.com']
    );
    if (demoAdmin.length > 0) {
      console.log(`✅ Demo Admin: phone=${demoAdmin[0].phone}, has_password=${!!demoAdmin[0].password_hash}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

standardizePhoneAndPasswords();

