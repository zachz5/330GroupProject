import { pool } from '../db/connection.js';

async function checkEnum() {
  try {
    const [enumValues] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Customer_Purchase_Transaction' 
      AND COLUMN_NAME = 'payment_method'
    `);
    
    console.log('Payment method enum values:');
    console.log(enumValues[0]?.COLUMN_TYPE || 'Not found');
    
    const [statusEnum] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Customer_Purchase_Transaction' 
      AND COLUMN_NAME = 'status'
    `);
    
    console.log('\nStatus enum values:');
    console.log(statusEnum[0]?.COLUMN_TYPE || 'Not found');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkEnum();

