import express from 'express';
import { pool } from '../db/connection.js';
import { formatPhone } from '../utils/phoneFormatter.js';

const router = express.Router();

// GET all employees
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Employee ORDER BY employee_id DESC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST create new employee
router.post('/', async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, role, hire_date } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if employee already exists
    const [existingEmployees] = await pool.execute(
      'SELECT employee_id FROM Employee WHERE email = ?',
      [email]
    );
    
    if (existingEmployees.length > 0) {
      return res.status(400).json({ error: 'Employee with this email already exists' });
    }
    
    // Format phone number
    const formattedPhone = phone ? formatPhone(phone) : null;
    
    const [result] = await pool.execute(
      'INSERT INTO Employee (first_name, last_name, email, phone, role, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        first_name || null,
        last_name || null,
        email,
        formattedPhone,
        role || null,
        hire_date || new Date().toISOString().split('T')[0]
      ]
    );
    
    const [newEmployee] = await pool.execute(
      'SELECT * FROM Employee WHERE employee_id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newEmployee[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE employee
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM Employee WHERE employee_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

