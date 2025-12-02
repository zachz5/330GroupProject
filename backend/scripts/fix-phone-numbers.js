import { pool } from '../db/connection.js';

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    const tenDigits = digits.substring(1);
    return `(${tenDigits.substring(0, 3)}) ${tenDigits.substring(3, 6)}-${tenDigits.substring(6)}`;
  }
  return null;
}

async function fixPhoneNumbers() {
  try {
    console.log('Fixing phone numbers...\n');

    // Fix Customer table
    const [customers] = await pool.execute('SELECT customer_id, email, phone FROM Customer');
    let customerUpdates = 0;
    
    for (const customer of customers) {
      const normalized = normalizePhone(customer.phone);
      if (normalized && normalized !== customer.phone) {
        await pool.execute('UPDATE Customer SET phone = ? WHERE customer_id = ?', [normalized, customer.customer_id]);
        customerUpdates++;
        console.log(`Updated Customer ${customer.customer_id} (${customer.email}): ${customer.phone} -> ${normalized}`);
      }
    }

    // Fix Employee table
    const [employees] = await pool.execute('SELECT employee_id, email, phone FROM Employee');
    let employeeUpdates = 0;
    
    for (const employee of employees) {
      const normalized = normalizePhone(employee.phone);
      if (normalized && normalized !== employee.phone) {
        await pool.execute('UPDATE Employee SET phone = ? WHERE employee_id = ?', [normalized, employee.employee_id]);
        employeeUpdates++;
        console.log(`Updated Employee ${employee.employee_id} (${employee.email}): ${employee.phone} -> ${normalized}`);
      }
    }

    console.log(`\n✅ Updated ${customerUpdates} customer phone numbers`);
    console.log(`✅ Updated ${employeeUpdates} employee phone numbers`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixPhoneNumbers();



