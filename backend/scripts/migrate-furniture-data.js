import { pool } from '../db/connection.js';

async function migrateFurnitureData() {
  try {
    console.log('Migrating furniture data from lowercase to proper table...\n');

    // Check if lowercase furniture table exists
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
    );
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    
    if (!tableNames.includes('furniture')) {
      console.log('ℹ️  Lowercase furniture table does not exist');
      return;
    }

    if (!tableNames.includes('Furniture')) {
      console.log('❌ Proper Furniture table does not exist');
      return;
    }

    // Get all items from lowercase furniture table
    const [lowercaseItems] = await pool.execute(
      'SELECT * FROM furniture'
    );

    console.log(`Found ${lowercaseItems.length} items in lowercase furniture table`);
    console.log(`Furniture table has ${(await pool.execute('SELECT COUNT(*) as count FROM Furniture'))[0][0].count} items\n`);

    let migrated = 0;
    let skipped = 0;

    for (const item of lowercaseItems) {
      // Check if item already exists in Furniture table (by name or furniture_id)
      const [existing] = await pool.execute(
        'SELECT furniture_id FROM Furniture WHERE furniture_id = ? OR name = ?',
        [item.furniture_id, item.name]
      );

      if (existing.length === 0) {
        // Get a default employee ID if needed (use the demo admin employee)
        let employeeId = item.added_by_employee_id;
        if (!employeeId) {
          const [employees] = await pool.execute(
            'SELECT employee_id FROM Employee WHERE email = ? LIMIT 1',
            ['admin@campusrehome.com']
          );
          if (employees.length > 0) {
            employeeId = employees[0].employee_id;
          }
        }

        // Insert into Furniture table (only include added_by_employee_id if we have a value)
        if (employeeId) {
          await pool.execute(
            `INSERT INTO Furniture (name, category, description, price, condition_status, quantity, image_url, date_added, added_by_employee_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.name,
              item.category,
              item.description,
              item.price,
              item.condition_status,
              item.quantity,
              item.image_url,
              item.date_added,
              employeeId
            ]
          );
        } else {
          // If no employee ID available, try without it (if column allows null)
          try {
            await pool.execute(
              `INSERT INTO Furniture (name, category, description, price, condition_status, quantity, image_url, date_added)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.name,
                item.category,
                item.description,
                item.price,
                item.condition_status,
                item.quantity,
                item.image_url,
                item.date_added
              ]
            );
          } catch (err) {
            // If that fails, we need an employee ID - skip this item
            console.log(`⚠️  Skipping ${item.name} - no employee ID available and column requires it`);
            skipped++;
            continue;
          }
        }
        migrated++;
        console.log(`✅ Migrated: ${item.name}`);
      } else {
        skipped++;
        console.log(`⏭️  Skipped (already exists): ${item.name}`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Migrated: ${migrated} items`);
    console.log(`   Skipped: ${skipped} items (already exist)`);

    // Now drop the lowercase furniture table
    if (migrated > 0 || skipped === lowercaseItems.length) {
      console.log('\nDropping lowercase furniture table...');
      await pool.execute('DROP TABLE IF EXISTS `furniture`');
      console.log('✅ Dropped lowercase furniture table');
    }

  } catch (error) {
    console.error('❌ Error migrating furniture data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateFurnitureData();

