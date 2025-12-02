import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// GET all furniture items
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Furniture ORDER BY furniture_id DESC');
    
    // Get notes from Inventory_Log for all items
    const furnitureIds = rows.map(row => row.furniture_id);
    let notesMap = new Map();
    if (furnitureIds.length > 0) {
      try {
        const placeholders = furnitureIds.map(() => '?').join(',');
        const [notesRows] = await pool.execute(
          `SELECT furniture_id, notes FROM Inventory_Log WHERE furniture_id IN (${placeholders})`,
          furnitureIds
        );
        notesRows.forEach(row => {
          notesMap.set(row.furniture_id, row.notes || null);
        });
      } catch (notesError) {
        // If Inventory_Log table doesn't exist, continue without notes
        console.log('Note: Inventory_Log table may not exist:', notesError.message);
      }
    }
    
    // Remove image_url if it exists and ensure emoji field exists, add notes
    const rowsWithEmoji = rows.map(row => {
      const { image_url, ...rest } = row;
      return { ...rest, emoji: row.emoji || null, notes: notesMap.get(row.furniture_id) || null };
    });
    res.json(rowsWithEmoji);
  } catch (error) {
    // If emoji column doesn't exist, try without it
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('emoji')) {
      try {
        const [rows] = await pool.execute('SELECT * FROM Furniture ORDER BY furniture_id DESC');
        // Get notes
        const furnitureIds = rows.map(row => row.furniture_id);
        let notesMap = new Map();
        if (furnitureIds.length > 0) {
          try {
            const placeholders = furnitureIds.map(() => '?').join(',');
            const [notesRows] = await pool.execute(
              `SELECT furniture_id, notes FROM Inventory_Log WHERE furniture_id IN (${placeholders})`,
              furnitureIds
            );
            notesRows.forEach(row => {
              notesMap.set(row.furniture_id, row.notes || null);
            });
          } catch (notesError) {
            console.log('Note: Inventory_Log table may not exist:', notesError.message);
          }
        }
        // Add null emoji to each row and remove image_url, add notes
        const rowsWithEmoji = rows.map(row => {
          const { image_url, ...rest } = row;
          return { ...rest, emoji: null, notes: notesMap.get(row.furniture_id) || null };
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
    
    // Get notes from Inventory_Log
    let notes = null;
    try {
      const [notesRows] = await pool.execute(
        'SELECT notes FROM Inventory_Log WHERE furniture_id = ? LIMIT 1',
        [id]
      );
      if (notesRows.length > 0) {
        notes = notesRows[0].notes || null;
      }
    } catch (notesError) {
      console.log('Note: Inventory_Log table may not exist:', notesError.message);
    }
    
    // Ensure emoji field exists and remove image_url if it exists
    const item = rows[0];
    const { image_url, ...itemWithoutImageUrl } = item;
    res.json({ ...itemWithoutImageUrl, emoji: item.emoji || null, notes });
  } catch (error) {
    // If emoji column doesn't exist, try without it
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('emoji')) {
      try {
        const [rows] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [id]);
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }
        // Get notes
        let notes = null;
        try {
          const [notesRows] = await pool.execute(
            'SELECT notes FROM Inventory_Log WHERE furniture_id = ? LIMIT 1',
            [id]
          );
          if (notesRows.length > 0) {
            notes = notesRows[0].notes || null;
          }
        } catch (notesError) {
          console.log('Note: Inventory_Log table may not exist:', notesError.message);
        }
        const item = rows[0];
        const { image_url, ...itemWithoutImageUrl } = item;
        return res.json({ ...itemWithoutImageUrl, emoji: null, notes });
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
    
    // Convert price to number if it's a string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({ error: 'Price must be a valid number' });
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
          numericPrice,
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
            numericPrice,
            validConditionStatus,
            quantity === undefined ? 0 : (quantity || 0),
            added_by_employee_id === undefined ? null : (added_by_employee_id || null)
          ]
        );
      } else {
        console.error('Error inserting furniture item:', insertError);
        console.error('Insert error details:', {
          code: insertError.code,
          sqlState: insertError.sqlState,
          sqlMessage: insertError.sqlMessage,
          message: insertError.message
        });
        throw insertError;
      }
    }
    
    const [newItem] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [result.insertId]);
    // Remove image_url from response
    const { image_url, ...itemWithoutImageUrl } = newItem[0];
    res.status(201).json({ ...itemWithoutImageUrl, emoji: newItem[0].emoji || null });
  } catch (error) {
    console.error('Error in POST /items:', error);
    console.error('Error details:', {
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

// PUT update furniture item
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, condition_status, quantity, emoji, notes, employee_id } = req.body;
    
    console.log('PUT /items/:id - Request body:', JSON.stringify(req.body, null, 2));
    console.log('PUT /items/:id - Notes value:', notes, 'Type:', typeof notes);
    console.log('PUT /items/:id - Employee ID:', employee_id);
    
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
    
    // Update or insert notes in Inventory_Log
    if (notes !== undefined) {
      try {
        // Process notes: convert to string, trim, truncate to 255 chars for varchar(255)
        // Allow empty strings (they should be saved as empty string, not null)
        let notesValue = null;
        if (notes !== null && notes !== undefined) {
          const notesString = String(notes).trim();
          // Truncate to 255 characters to match varchar(255) column
          // Save empty string as empty string (not null) if user cleared the field
          notesValue = notesString.substring(0, 255);
        }
        
        // Get employee_id from request body (required for foreign key constraint)
        const employeeId = employee_id || null;
        
        console.log(`Updating notes for furniture_id ${id}:`, notesValue);
        console.log(`Notes length: ${notesValue !== null ? notesValue.length : 0}, Original: "${notes}"`);
        console.log(`Employee ID: ${employeeId}`);
        
        // Check if log entry exists
        const [existingLog] = await pool.execute(
          'SELECT log_id FROM Inventory_Log WHERE furniture_id = ? LIMIT 1',
          [id]
        );
        
        if (existingLog.length > 0) {
          // Update existing log (include employee_id if provided)
          if (employeeId) {
            const [updateResult] = await pool.execute(
              'UPDATE Inventory_Log SET notes = ?, employee_id = ? WHERE furniture_id = ?',
              [notesValue, employeeId, id]
            );
            console.log(`✅ Updated notes for furniture_id ${id}, affected rows:`, updateResult.affectedRows);
          } else {
            const [updateResult] = await pool.execute(
              'UPDATE Inventory_Log SET notes = ? WHERE furniture_id = ?',
              [notesValue, id]
            );
            console.log(`✅ Updated notes for furniture_id ${id}, affected rows:`, updateResult.affectedRows);
          }
        } else {
          // Insert new log entry (employee_id is required for foreign key)
          if (!employeeId) {
            throw new Error('employee_id is required when creating a new Inventory_Log entry');
          }
          const [insertResult] = await pool.execute(
            'INSERT INTO Inventory_Log (furniture_id, notes, employee_id) VALUES (?, ?, ?)',
            [id, notesValue, employeeId]
          );
          console.log(`✅ Inserted notes for furniture_id ${id}, insertId:`, insertResult.insertId);
        }
      } catch (notesError) {
        // Log the full error for debugging
        console.error('❌ Error updating Inventory_Log:', notesError);
        console.error('Error details:', {
          message: notesError.message,
          code: notesError.code,
          sqlState: notesError.sqlState,
          sqlMessage: notesError.sqlMessage,
          notesValue: notes,
          notesType: typeof notes,
          furniture_id: id,
          employee_id: employee_id
        });
        // Re-throw the error so the request fails and user sees the error
        throw notesError;
      }
    }
    
    const [updatedItem] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [id]);
    
    // Get notes from Inventory_Log
    let itemNotes = null;
    try {
      const [notesRows] = await pool.execute(
        'SELECT notes FROM Inventory_Log WHERE furniture_id = ? LIMIT 1',
        [id]
      );
      if (notesRows.length > 0) {
        itemNotes = notesRows[0].notes || null;
      }
    } catch (notesError) {
      console.log('Note: Inventory_Log table may not exist:', notesError.message);
    }
    
    // Remove image_url from response
    const { image_url, ...itemWithoutImageUrl } = updatedItem[0];
    res.json({ ...itemWithoutImageUrl, emoji: updatedItem[0].emoji || null, notes: itemNotes });
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

