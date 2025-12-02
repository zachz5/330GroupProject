import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// GET all furniture items
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Furniture ORDER BY furniture_id DESC');
    res.json(rows);
  } catch (error) {
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
    
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST create new furniture item
router.post('/', async (req, res, next) => {
  try {
    const { name, category, description, price, condition_status, quantity, image_url, added_by_employee_id } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO Furniture (name, category, description, price, condition_status, quantity, image_url, added_by_employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        category || null,
        description || null,
        price,
        condition_status || 'Good',
        quantity || 0,
        image_url || null,
        added_by_employee_id || null
      ]
    );
    
    const [newItem] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (error) {
    next(error);
  }
});

// PUT update furniture item
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, condition_status, quantity, image_url } = req.body;
    
    // Build dynamic UPDATE query with only provided fields
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category || null);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (condition_status !== undefined) {
      updates.push('condition_status = ?');
      values.push(condition_status);
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(quantity);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Add id to values array for WHERE clause
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE Furniture SET ${updates.join(', ')} WHERE furniture_id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const [updatedItem] = await pool.execute('SELECT * FROM Furniture WHERE furniture_id = ?', [id]);
    res.json(updatedItem[0]);
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

