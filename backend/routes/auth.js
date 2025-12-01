import express from 'express';
import { pool } from '../db/connection.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// POST register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone, address } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if customer exists
    const [existingCustomers] = await pool.execute(
      'SELECT customer_id FROM customer WHERE email = ?',
      [email]
    );
    
    if (existingCustomers.length > 0) {
      return res.status(400).json({ error: 'Customer already exists' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Create customer
    const [result] = await pool.execute(
      'INSERT INTO customer (email, password_hash, first_name, last_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password_hash, first_name || null, last_name || null, phone || null, address || null]
    );
    
    // Check if this email is also in the employee table
    const [employeeCheck] = await pool.execute(
      'SELECT employee_id FROM employee WHERE email = ?',
      [email]
    );
    
    const [newCustomer] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone, address, date_registered FROM customer WHERE customer_id = ?',
      [result.insertId]
    );
    
    const response = { ...newCustomer[0], isEmployee: employeeCheck.length > 0 };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user is an employee first
    const [employees] = await pool.execute(
      'SELECT employee_id, email, first_name, last_name FROM employee WHERE email = ?',
      [email]
    );
    
    if (employees.length > 0) {
      // Employee login - check if they also have a customer account
      const employee = employees[0];
      
      // Check if employee also has customer account
      const [customers] = await pool.execute(
        'SELECT customer_id, password_hash, phone, address FROM customer WHERE email = ?',
        [email]
      );
      
      if (customers.length > 0) {
        // Employee with customer account - verify password
        const customer = customers[0];
        const isValid = await bcrypt.compare(password, customer.password_hash);
        
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Return with employee flag
        return res.json({
          customer_id: customer.customer_id,
          email: employee.email,
          first_name: employee.first_name,
          last_name: employee.last_name,
          phone: customer.phone,
          address: customer.address,
          isEmployee: true,
        });
      } else {
        // Employee without customer account - for now, they can't login
        // You might want to create a separate employee login system
        return res.status(401).json({ error: 'Employee accounts must be set up through customer registration' });
      }
    }
    
    // Regular customer login
    const [customers] = await pool.execute(
      'SELECT customer_id, email, password_hash, first_name, last_name, phone, address FROM customer WHERE email = ?',
      [email]
    );
    
    if (customers.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const customer = customers[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, customer.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if this customer is also an employee
    const [employeeCheck] = await pool.execute(
      'SELECT employee_id FROM employee WHERE email = ?',
      [email]
    );
    
    // Return customer (without password)
    res.json({
      customer_id: customer.customer_id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      address: customer.address,
      isEmployee: employeeCheck.length > 0,
    });
  } catch (error) {
    next(error);
  }
});

// PUT update profile
router.put('/profile/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, address } = req.body;
    
    const [result] = await pool.execute(
      'UPDATE customer SET first_name = ?, last_name = ?, phone = ?, address = ? WHERE customer_id = ?',
      [first_name || null, last_name || null, phone || null, address || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const [updatedCustomer] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone, address, date_registered FROM customer WHERE customer_id = ?',
      [id]
    );
    
    // Check if this customer is also an employee
    const [employeeCheck] = await pool.execute(
      'SELECT employee_id FROM employee WHERE email = ?',
      [updatedCustomer[0].email]
    );
    
    const response = { ...updatedCustomer[0], isEmployee: employeeCheck.length > 0 };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

