import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// GET all furniture items
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Furniture ORDER BY furniture_id DESC');
    // Remove image_url if it exists and ensure emoji field exists
    const rowsWithEmoji = rows.map(row => {
      const { image_url, ...rest } = row;
      return { ...rest, emoji: row.emoji || null };
    });
    res.json(rowsWithEmoji);
  } catch (error) {
    // If emoji column doesn't exist, try without it
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('emoji')) {
      try {
        const [rows] = await pool.execute('SELECT * FROM Furniture ORDER BY furniture_id DESC');
        // Add null emoji to each row and remove image_url
        const rowsWithEmoji = rows.map(row => {
          const { image_url, ...rest } = row;
          return { ...rest, emoji: null };
        });
        return res.json(rowsWithEmoji);
      } catch (fallbackError) {
        return next(fallbackError);
      }
    }
    next(error);
  }
});

// GET single furniture item by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Ensure emoji field exists and remove image_url if it exists
    const item = rows[0];
    const { image_url, ...itemWithoutImageUrl } = item;
    res.json({ ...itemWithoutImageUrl, emoji: item.emoji || null });
  } catch (error) {
    // If emoji column doesn't exist, try without it
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('emoji')) {
      try {
        const [rows] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [id]);
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }
        const item = rows[0];
        const { image_url, ...itemWithoutImageUrl } = item;
        return res.json({ ...itemWithoutImageUrl, emoji: null });
      } catch (fallbackError) {
        return next(fallbackError);
      }
    }
    next(error);
  }
});

// POST create new furniture item
router.post('/', async (req, res, next) => {
  try {
    const { name, category, description, price, condition_status, quantity, emoji, added_by_employee_id } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    // Condition is required
    if (!condition_status || !['New', 'Like New', 'Good', 'Fair', 'Poor'].includes(condition_status)) {
      return res.status(400).json({ error: 'Valid condition status is required (New, Like New, Good, Fair, or Poor)' });
    }
    
    // Convert undefined to null explicitly for MySQL compatibility
    const validConditionStatus = condition_status;
    
    // Try to insert with emoji, fallback to without if column doesn't exist
    let result;
    try {
      [result] = await pool.execute(
        'INSERT INTO Furniture (name, category, description, price, condition_status, quantity, emoji, added_by_employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          name,
          category === undefined ? null : (category || null),
          description === undefined ? null : (description || null),
          price,
          validConditionStatus,
          quantity === undefined ? 0 : (quantity || 0),
          emoji === undefined ? null : (emoji || null),
          added_by_employee_id === undefined ? null : (added_by_employee_id || null)
        ]
      );
    } catch (insertError) {
      // If emoji column doesn't exist, insert without it
      if (insertError.code === 'ER_BAD_FIELD_ERROR' && insertError.message.includes('emoji')) {
        [result] = await pool.execute(
          'INSERT INTO Furniture (name, category, description, price, condition_status, quantity, added_by_employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            name,
            category === undefined ? null : (category || null),
            description === undefined ? null : (description || null),
            price,
            validConditionStatus,
            quantity === undefined ? 0 : (quantity || 0),
            added_by_employee_id === undefined ? null : (added_by_employee_id || null)
          ]
        );
      } else {
        throw insertError;
      }
    }
    
    const [newItem] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [result.insertId]);
    // Remove image_url from response
    const { image_url, ...itemWithoutImageUrl } = newItem[0];
    res.status(201).json({ ...itemWithoutImageUrl, emoji: newItem[0].emoji || null });
  } catch (error) {
    next(error);
  }
});

// PUT update furniture item
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, condition_status, quantity, emoji } = req.body;
    
    // Convert undefined to null explicitly for MySQL compatibility
    // Validate condition_status if provided, otherwise default to 'Good' to ensure all items have a condition
    let validConditionStatus = 'Good';
    if (condition_status !== undefined) {
      if (!condition_status || !['New', 'Like New', 'Good', 'Fair', 'Poor'].includes(condition_status)) {
        return res.status(400).json({ error: 'Invalid condition status. Must be one of: New, Like New, Good, Fair, Poor' });
      }
      validConditionStatus = condition_status;
    }
    
    // Try to update with emoji, fallback to without if column doesn't exist
    let result;
    try {
      // Always try to update emoji if it's provided in the request
      [result] = await pool.execute(
        'UPDATE Furniture SET name = ?, category = ?, description = ?, price = ?, condition_status = ?, quantity = ?, emoji = ? WHERE furniture_id = ?',
        [
          name,
          category === undefined ? null : category,
          description === undefined ? null : description,
          price,
          validConditionStatus,
          quantity === undefined ? 0 : quantity,
          emoji !== undefined ? (emoji || null) : null, // Use provided emoji or null
          id
        ]
      );
    } catch (updateError) {
      // If emoji column doesn't exist, update without it
      if (updateError.code === 'ER_BAD_FIELD_ERROR' && updateError.message.includes('emoji')) {
        console.log('Emoji column does not exist, updating without emoji');
        [result] = await pool.execute(
          'UPDATE Furniture SET name = ?, category = ?, description = ?, price = ?, condition_status = ?, quantity = ? WHERE furniture_id = ?',
          [
            name,
            category === undefined ? null : category,
            description === undefined ? null : description,
            price,
            validConditionStatus,
            quantity === undefined ? 0 : quantity,
            id
          ]
        );
      } else {
        throw updateError;
      }
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const [updatedItem] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [id]);
    // Remove image_url from response
    const { image_url, ...itemWithoutImageUrl } = updatedItem[0];
    res.json({ ...itemWithoutImageUrl, emoji: updatedItem[0].emoji || null });
  } catch (error) {
    next(error);
  }
});

// DELETE furniture item
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM Furniture WHERE furniture_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

