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
    
    const [result] = await pool.execute(
      'UPDATE Furniture SET name = ?, category = ?, description = ?, price = ?, condition_status = ?, quantity = ?, image_url = ? WHERE furniture_id = ?',
      [name, category, description, price, condition_status, quantity, image_url, id]
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

