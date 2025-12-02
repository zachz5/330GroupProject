import { pool } from '../db/connection.js';

async function createTables() {
  try {
    console.log('Creating database tables...\n');

    // Create customer table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS customer (
        customer_id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        address VARCHAR(500),
        date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Customer table created successfully');

    // Create employee table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS employee (
        employee_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(100) NOT NULL,
        hire_date DATE NOT NULL
      )
    `);
    console.log('✅ Employee table created successfully\n');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTables();


