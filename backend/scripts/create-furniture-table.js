import { pool } from '../db/connection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createFurnitureTable() {
  try {
    console.log('Creating furniture table...\n');

    // First check if employee table exists
    let employeeTableExists = false;
    try {
      await pool.execute('SELECT 1 FROM employee LIMIT 1');
      employeeTableExists = true;
    } catch (e) {
      employeeTableExists = false;
    }

    let sql = `
      CREATE TABLE IF NOT EXISTS furniture (
        furniture_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        condition_status ENUM('New', 'Like New', 'Good', 'Fair', 'Poor') DEFAULT 'Good',
        quantity INT DEFAULT 0,
        image_url VARCHAR(500),
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by_employee_id INT
    `;

    if (employeeTableExists) {
      sql += `,
        FOREIGN KEY (added_by_employee_id) REFERENCES employee(employee_id) ON DELETE SET NULL
      )`;
    } else {
      sql += ')';
    }

    await pool.execute(sql);
    console.log('✅ Furniture table created successfully!\n');

    // Check if table is empty and add sample data
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM furniture');
    
    if (count[0].count === 0) {
      console.log('Adding sample furniture items...\n');
      
      const sampleItems = [
        ['Wooden Desk Chair', 'Furniture', 'Comfortable wooden desk chair with armrests', 45.99, 'Good', 3, null, null],
        ['Coffee Table', 'Furniture', 'Modern glass-top coffee table', 75.50, 'Like New', 2, null, null],
        ['Twin Size Bed Frame', 'Furniture', 'Metal bed frame for twin size mattress', 120.00, 'Good', 1, null, null],
        ['Desk Lamp', 'Lighting', 'Adjustable desk lamp with LED bulb', 25.99, 'New', 5, null, null],
        ['Bookshelf', 'Furniture', '5-shelf wooden bookshelf', 89.99, 'Fair', 2, null, null],
        ['Dresser', 'Furniture', '6-drawer dresser with mirror', 150.00, 'Like New', 1, null, null],
        ['Nightstand', 'Furniture', 'Bedside table with drawer', 35.00, 'Good', 4, null, null],
        ['Area Rug', 'Furniture', 'Soft area rug 5x7 feet', 55.99, 'Good', 3, null, null],
      ];

      for (const item of sampleItems) {
        await pool.execute(
          'INSERT INTO furniture (name, category, description, price, condition_status, quantity, image_url, added_by_employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          item
        );
      }

      console.log(`✅ Added ${sampleItems.length} sample furniture items!\n`);
    } else {
      console.log(`ℹ️  Table already has ${count[0].count} items.\n`);
    }

    // Show current items
    const [items] = await pool.execute('SELECT * FROM furniture ORDER BY furniture_id DESC LIMIT 10');
    console.log('Current furniture items:');
    items.forEach((item, i) => {
      console.log(`${i + 1}. ${item.name} - $${item.price} (Qty: ${item.quantity}, Condition: ${item.condition_status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating furniture table:', error.message);
    if (error.message.includes('employee')) {
      console.error('\n⚠️  Note: If employee table doesn\'t exist, the foreign key constraint will fail.');
      console.error('You may need to create the employee table first or remove the foreign key constraint.');
    }
    process.exit(1);
  }
}

createFurnitureTable();

