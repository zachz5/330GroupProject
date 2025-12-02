import { pool } from '../db/connection.js';

async function updateStatusEnum() {
  try {
    console.log('Updating status enum in Customer_Purchase_Transaction table...\n');
    
    // Check current enum values
    const [currentEnum] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Customer_Purchase_Transaction' 
      AND COLUMN_NAME = 'status'
    `);
    
    console.log('Current status enum:', currentEnum[0]?.COLUMN_TYPE || 'Not found');
    
    // Update the enum to include all statuses
    await pool.execute(`
      ALTER TABLE Customer_Purchase_Transaction 
      MODIFY COLUMN status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled', 'Refunded') 
      DEFAULT 'Pending'
    `);
    
    console.log('✅ Successfully updated status enum');
    console.log('   New enum values: Pending, Processing, Shipped, Delivered, Completed, Cancelled, Refunded');
    
    // Verify the update
    const [newEnum] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Customer_Purchase_Transaction' 
      AND COLUMN_NAME = 'status'
    `);
    
    console.log('\nVerified new enum:', newEnum[0]?.COLUMN_TYPE);
    
  } catch (err) {
    console.error('❌ Error updating status enum:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

updateStatusEnum();



