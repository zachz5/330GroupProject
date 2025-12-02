import { pool } from '../db/connection.js';

async function addIsActiveColumn() {
  try {
    console.log('Adding is_active column to Customer table...\n');
    
    // Check if column already exists
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Customer' 
       AND COLUMN_NAME = 'is_active'`
    );
    
    if (columns.length > 0) {
      console.log('✅ is_active column already exists');
      return;
    }
    
    // Add is_active column with default value of 1 (true/active)
    await pool.execute(
      'ALTER TABLE Customer ADD COLUMN is_active TINYINT(1) DEFAULT 1 NOT NULL'
    );
    
    console.log('✅ Successfully added is_active column to Customer table');
    console.log('   All existing customers are set to active (is_active = 1)');
    
  } catch (err) {
    console.error('❌ Error adding is_active column:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

addIsActiveColumn();



