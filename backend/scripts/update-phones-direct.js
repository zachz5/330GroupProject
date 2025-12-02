import { pool } from '../db/connection.js';

function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  
  // If already in correct format, return as is
  if (/^\(\d{3}\) \d{3}-\d{4}$/.test(phone)) {
    return phone;
  }
  
  // Handle 10-digit numbers
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  
  // Handle 11-digit numbers starting with 1
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  
  // Handle 7-digit numbers - pad with 555 area code
  if (digits.length === 7) {
    return `(555) ${digits.slice(0,3)}-${digits.slice(3)}`;
  }
  
  // Can't format
  return null;
}

async function main() {
  try {
    console.log('Updating phone numbers...\n');
    
    // Update Customer table
    const [customers] = await pool.execute('SELECT customer_id, phone FROM Customer WHERE phone IS NOT NULL');
    let customerCount = 0;
    for (const c of customers) {
      const formatted = formatPhone(c.phone);
      if (formatted && formatted !== c.phone) {
        await pool.execute('UPDATE Customer SET phone = ? WHERE customer_id = ?', [formatted, c.customer_id]);
        customerCount++;
      }
    }
    console.log(`Updated ${customerCount} customer phone numbers`);
    
    // Update Employee table
    const [employees] = await pool.execute('SELECT employee_id, phone FROM Employee WHERE phone IS NOT NULL');
    let employeeCount = 0;
    for (const e of employees) {
      const formatted = formatPhone(e.phone);
      if (formatted && formatted !== e.phone) {
        await pool.execute('UPDATE Employee SET phone = ? WHERE employee_id = ?', [formatted, e.employee_id]);
        employeeCount++;
      }
    }
    console.log(`Updated ${employeeCount} employee phone numbers`);
    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();

