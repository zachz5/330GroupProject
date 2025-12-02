import { pool } from '../db/connection.js';

async function addPasswordToEmployee() {
  try {
    console.log('Adding password_hash column to Employee table...\n');

    // Check if column already exists
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'Employee' 
       AND COLUMN_NAME = 'password_hash'`
    );

    if (columns.length === 0) {
      // Add password_hash column to Employee table
      await pool.execute(
        `ALTER TABLE Employee ADD COLUMN password_hash VARCHAR(255) NULL`
      );
      console.log('✅ Added password_hash column to Employee table');
    } else {
      console.log('ℹ️  password_hash column already exists in Employee table');
    }

  } catch (error) {
    console.error('❌ Error adding password column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addPasswordToEmployee();



