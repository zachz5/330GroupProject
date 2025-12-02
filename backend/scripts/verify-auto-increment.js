import { pool } from '../db/connection.js';

async function verifyAutoIncrement() {
  try {
    console.log('Verifying Customer table auto-increment...\n');
    
    // Check using INFORMATION_SCHEMA
    const [autoIncrement] = await pool.execute(
      `SELECT AUTO_INCREMENT 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Customer'`
    );
    
    console.log(`Auto-increment value (INFORMATION_SCHEMA): ${autoIncrement[0]?.AUTO_INCREMENT || 'Not found'}`);
    
    // Check using SHOW TABLE STATUS
    const [tableInfo] = await pool.execute(
      `SHOW TABLE STATUS LIKE 'Customer'`
    );
    
    if (tableInfo.length > 0) {
      console.log(`Auto-increment value (SHOW TABLE STATUS): ${tableInfo[0].Auto_increment}`);
    }
    
    // Get max customer_id
    const [maxId] = await pool.execute(
      'SELECT MAX(customer_id) as max_id FROM Customer'
    );
    
    console.log(`\nMaximum customer_id: ${maxId[0].max_id}`);
    console.log(`Expected next customer_id: ${maxId[0].max_id + 1}`);
    
    // The auto-increment should be at least max_id + 1
    const expectedAutoIncrement = maxId[0].max_id + 1;
    const actualAutoIncrement = autoIncrement[0]?.AUTO_INCREMENT || tableInfo[0]?.Auto_increment;
    
    if (actualAutoIncrement >= expectedAutoIncrement) {
      console.log(`\n✅ Auto-increment is correct (${actualAutoIncrement} >= ${expectedAutoIncrement})`);
    } else {
      console.log(`\n⚠️  Auto-increment might be incorrect (${actualAutoIncrement} < ${expectedAutoIncrement})`);
      console.log(`   However, MySQL will use max_id + 1 when inserting, so this should still work.`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

verifyAutoIncrement();


