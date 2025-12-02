import express from 'express';
import { pool } from '../db/connection.js';
import bcrypt from 'bcryptjs';
import { formatPhone } from '../utils/phoneFormatter.js';

const router = express.Router();

// POST register customer
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone, address } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if customer exists
    const [existingCustomers] = await pool.execute(
      'SELECT customer_id FROM Customer WHERE email = ?',
      [email]
    );
    
    if (existingCustomers.length > 0) {
      return res.status(400).json({ error: 'Customer already exists' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Format phone number
    const formattedPhone = phone ? formatPhone(phone) : null;
    
    // Create customer
    const [result] = await pool.execute(
      'INSERT INTO Customer (email, password_hash, first_name, last_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password_hash, first_name || null, last_name || null, formattedPhone, address || null]
    );
    
    // Check if this email is also in the employee table
    const [employeeCheck] = await pool.execute(
      'SELECT employee_id FROM Employee WHERE email = ?',
      [email]
    );
    
    const [newCustomer] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone, address, date_registered FROM Customer WHERE customer_id = ?',
      [result.insertId]
    );
    
    const response = { ...newCustomer[0], isEmployee: employeeCheck.length > 0 };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST register employee
router.post('/register-employee', async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone, employee_code } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (!employee_code) {
      return res.status(400).json({ error: 'Employee code is required' });
    }
    
    // Validate employee code
    if (employee_code !== 'password') {
      return res.status(403).json({ error: 'Invalid employee code' });
    }
    
    // Check if employee exists
    const [existingEmployees] = await pool.execute(
      'SELECT employee_id FROM Employee WHERE email = ?',
      [email]
    );
    
    if (existingEmployees.length > 0) {
      return res.status(400).json({ error: 'Employee with this email already exists' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Format phone number
    const formattedPhone = phone ? formatPhone(phone) : null;
    
    // Create employee with default role of 'Admin' and today's date as hire_date
    const [result] = await pool.execute(
      'INSERT INTO Employee (first_name, last_name, email, phone, role, hire_date, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        first_name || null,
        last_name || null,
        email,
        formattedPhone,
        'Admin',
        new Date().toISOString().split('T')[0],
        password_hash
      ]
    );
    
    const [newEmployee] = await pool.execute(
      'SELECT employee_id, email, first_name, last_name, phone, role FROM Employee WHERE employee_id = ?',
      [result.insertId]
    );
    
    // Return employee in the same format as login
    const response = {
      employee_id: newEmployee[0].employee_id,
      email: newEmployee[0].email,
      first_name: newEmployee[0].first_name,
      last_name: newEmployee[0].last_name,
      phone: newEmployee[0].phone || null,
      address: null,
      isEmployee: true,
      role: newEmployee[0].role,
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST login
router.post('/login', async (req, res, next) => {
  let connection = null;
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user is an employee first
    const [employees] = await pool.execute(
      'SELECT employee_id, email, first_name, last_name, password_hash, phone, role FROM Employee WHERE email = ?',
      [email]
    );
    
    if (employees.length > 0) {
      // Employee login - verify password from Employee table
      const employee = employees[0];
      
      if (!employee.password_hash) {
        return res.status(401).json({ error: 'Employee account not properly configured' });
      }
      
      const isValid = await bcrypt.compare(password, employee.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Return employee (no customer_id since they're not a customer)
      return res.json({
        employee_id: employee.employee_id,
        email: employee.email,
        first_name: employee.first_name,
        last_name: employee.last_name,
        phone: employee.phone || null,
        address: null, // Employees don't have addresses in Employee table
        isEmployee: true,
        role: employee.role,
      });
    }
    
    // Regular customer login
    const [customers] = await pool.execute(
      'SELECT customer_id, email, password_hash, first_name, last_name, phone, address, date_registered, is_active FROM Customer WHERE email = ?',
      [email]
    );
    
    if (customers.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const customer = customers[0];
    
    // Check if account is active
    if (customer.is_active === 0 || customer.is_active === false) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, customer.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if this customer is also an employee
    const [employeeCheck] = await pool.execute(
      'SELECT employee_id FROM Employee WHERE email = ?',
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
    console.error('Login error:', error);
    console.error('Login error stack:', error.stack);
    // Make sure we always send a response
    if (!res.headersSent) {
      next(error);
    } else {
      // If headers were sent, log the error but don't try to send another response
      console.error('Response already sent, cannot send error response');
    }
  }
});

// GET customer by email (for migration purposes)
router.get('/customer-by-email/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    
    const [customers] = await pool.execute(
      'SELECT customer_id, email FROM Customer WHERE email = ?',
      [email]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ customer_id: customers[0].customer_id, email: customers[0].email });
  } catch (error) {
    next(error);
  }
});

// PUT update profile
router.put('/profile/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, address, email } = req.body;
    
    // Verify the customer exists and optionally verify email matches (if provided)
    const [existing] = await pool.execute(
      'SELECT customer_id, email FROM Customer WHERE customer_id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // If email is provided in the request, verify it matches the customer_id
    if (email && existing[0].email !== email) {
      return res.status(403).json({ error: 'Email does not match customer ID' });
    }
    
    // Format phone number
    const formattedPhone = phone ? formatPhone(phone) : null;
    
    const [result] = await pool.execute(
      'UPDATE Customer SET first_name = ?, last_name = ?, phone = ?, address = ? WHERE customer_id = ?',
      [first_name || null, last_name || null, formattedPhone, address || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const [updatedCustomer] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone, address, date_registered FROM Customer WHERE customer_id = ?',
      [id]
    );
    
    // Check if this customer is also an employee
    const [employeeCheck] = await pool.execute(
      'SELECT employee_id FROM Employee WHERE email = ?',
      [updatedCustomer[0].email]
    );
    
    const response = { ...updatedCustomer[0], isEmployee: employeeCheck.length > 0 };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET all customers (for admin/employee use)
router.get('/customers', async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    let query = 'SELECT customer_id, email, first_name, last_name, phone, address, date_registered, is_active FROM Customer';
    
    // Only show active customers by default, unless includeInactive is true
    if (includeInactive !== 'true') {
      query += ' WHERE is_active = 1';
    }
    
    query += ' ORDER BY customer_id DESC';
    
    const [customers] = await pool.execute(query);
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

// PUT update customer (for admin/employee use)
router.put('/customers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, address } = req.body;
    
    const formattedPhone = phone ? formatPhone(phone) : null;
    
    const [result] = await pool.execute(
      'UPDATE Customer SET first_name = ?, last_name = ?, phone = ?, address = ? WHERE customer_id = ?',
      [first_name || null, last_name || null, formattedPhone, address || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const [updatedCustomer] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone, address, date_registered, is_active FROM Customer WHERE customer_id = ?',
      [id]
    );
    
    res.json(updatedCustomer[0]);
  } catch (error) {
    next(error);
  }
});

// PUT deactivate/reactivate customer (for admin/employee use)
router.put('/customers/:id/deactivate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Validate is_active value
    const activeValue = is_active === true || is_active === 1 || is_active === '1' ? 1 : 0;
    
    const [result] = await pool.execute(
      'UPDATE Customer SET is_active = ? WHERE customer_id = ?',
      [activeValue, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const [updatedCustomer] = await pool.execute(
      'SELECT customer_id, email, first_name, last_name, phone, address, date_registered, is_active FROM Customer WHERE customer_id = ?',
      [id]
    );
    
    res.json({
      ...updatedCustomer[0],
      message: activeValue === 1 ? 'Customer reactivated successfully' : 'Customer deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

