import { pool } from '../db/connection.js';

async function checkTable() {
  try {
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Customer_Purchase_Transaction'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Customer_Purchase_Transaction table structure:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(required)'}`);
    });
    
    const [sample] = await pool.execute('SELECT * FROM Customer_Purchase_Transaction LIMIT 3');
    console.log(`\nSample rows (${sample.length}):`);
    sample.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTable();


