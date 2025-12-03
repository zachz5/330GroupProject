import { pool } from '../db/connection.js';

function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  return phone;
}

async function main() {
  try {
    const [customers] = await pool.execute('SELECT customer_id, phone FROM Customer WHERE phone IS NOT NULL');
    for (const c of customers) {
      const formatted = formatPhone(c.phone);
      if (formatted && formatted !== c.phone) {
        await pool.execute('UPDATE Customer SET phone = ? WHERE customer_id = ?', [formatted, c.customer_id]);
        console.log(`Customer ${c.customer_id}: ${c.phone} -> ${formatted}`);
      }
    }
    const [employees] = await pool.execute('SELECT employee_id, phone FROM Employee WHERE phone IS NOT NULL');
    for (const e of employees) {
      const formatted = formatPhone(e.phone);
      if (formatted && formatted !== e.phone) {
        await pool.execute('UPDATE Employee SET phone = ? WHERE employee_id = ?', [formatted, e.employee_id]);
        console.log(`Employee ${e.employee_id}: ${e.phone} -> ${formatted}`);
      }
    }
    console.log('Done');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();






