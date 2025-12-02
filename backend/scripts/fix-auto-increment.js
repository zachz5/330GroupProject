import { pool } from '../db/connection.js';

async function fixAutoIncrement() {
  try {
    console.log('Fixing Customer table auto-increment...\n');
    
    // Get max customer_id
    const [maxId] = await pool.execute(
      'SELECT MAX(customer_id) as max_id FROM Customer'
    );
    
    const nextId = (maxId[0].max_id || 0) + 1;
    console.log(`Current max customer_id: ${maxId[0].max_id}`);
    console.log(`Setting auto-increment to: ${nextId}\n`);
    
    // Reset auto-increment to next available ID
    // Note: AUTO_INCREMENT value must be a literal, not a parameter
    await pool.execute(
      `ALTER TABLE Customer AUTO_INCREMENT = ${nextId}`
    );
    
    console.log(`✅ Auto-increment set to ${nextId}`);
    console.log(`   Next new customer will get customer_id ${nextId}`);
    
    // Verify
    const [tableInfo] = await pool.execute(
      `SHOW TABLE STATUS LIKE 'Customer'`
    );
    
    if (tableInfo.length > 0) {
      console.log(`\nVerified auto-increment: ${tableInfo[0].Auto_increment}`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixAutoIncrement();

