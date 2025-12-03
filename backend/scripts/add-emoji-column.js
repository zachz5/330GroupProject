import { pool } from '../db/connection.js';

async function addEmojiColumn() {
  try {
    console.log('Adding emoji column to Furniture table...\n');

    // Check if column already exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Furniture' 
      AND COLUMN_NAME = 'emoji'
    `);

    if (columns.length > 0) {
      console.log('✅ Emoji column already exists!');
      return;
    }

    // Add emoji column
    await pool.execute(`
      ALTER TABLE Furniture 
      ADD COLUMN emoji VARCHAR(10) NULL AFTER image_url
    `);

    console.log('✅ Emoji column added successfully!\n');

    // Check the table structure
    const [newColumns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Furniture' 
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Furniture table structure:');
    newColumns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(required)'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

addEmojiColumn();





