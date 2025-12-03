import { pool } from '../db/connection.js';

async function dropImageUrlColumn() {
  let connection = null;
  try {
    console.log('Checking for image_url column...\n');
    
    connection = await pool.getConnection();
    
    // Check if column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Furniture' 
      AND COLUMN_NAME = 'image_url'
    `);

    if (columns.length === 0) {
      console.log('✅ image_url column does not exist - nothing to remove\n');
      return;
    }

    console.log('Dropping image_url column from Furniture table...');
    await connection.execute(`ALTER TABLE Furniture DROP COLUMN image_url`);
    console.log('✅ image_url column dropped successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

dropImageUrlColumn();





