import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// POST drop image_url column (admin endpoint)
router.post('/drop-image-url-column', async (req, res, next) => {
  let connection = null;
  try {
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
      return res.json({ message: 'image_url column does not exist' });
    }

    // Drop the column
    await connection.execute(`ALTER TABLE Furniture DROP COLUMN image_url`);
    
    connection.release();
    res.json({ message: 'image_url column dropped successfully' });
  } catch (error) {
    if (connection) connection.release();
    console.error('Error dropping image_url column:', error);
    next(error);
  }
});

export default router;


