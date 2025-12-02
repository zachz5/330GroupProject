import { pool } from '../db/connection.js';

async function removeDuplicateTables() {
  try {
    console.log('Removing duplicate lowercase tables...\n');

    // Check what tables exist
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
    );
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    console.log('Current tables:', tableNames.join(', '));
    console.log('');

    const tablesToRemove = ['customer', 'employee', 'furniture'];
    const properTables = ['Customer', 'Employee', 'Furniture'];

    for (const tableName of tablesToRemove) {
      const properTableName = properTables[tablesToRemove.indexOf(tableName)];
      
      if (tableNames.includes(tableName)) {
        // Check if the proper table exists
        if (tableNames.includes(properTableName)) {
          // Check if lowercase table has any data
          try {
            const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            const count = rows[0].count;
            
            if (count > 0) {
              console.log(`⚠️  Table '${tableName}' contains ${count} row(s). Checking if data is already in '${properTableName}'...`);
              
              // For safety, let's not drop if there's data unless we're sure it's migrated
              const [properRows] = await pool.execute(`SELECT COUNT(*) as count FROM \`${properTableName}\``);
              console.log(`   '${properTableName}' contains ${properRows[0].count} row(s)`);
              
              if (properRows[0].count >= count) {
                console.log(`✅ Data appears to be migrated. Dropping '${tableName}' table...`);
                await pool.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
                console.log(`✅ Dropped table '${tableName}'`);
              } else {
                console.log(`⚠️  Skipping '${tableName}' - data may not be fully migrated`);
              }
            } else {
              console.log(`✅ Table '${tableName}' is empty. Dropping...`);
              await pool.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
              console.log(`✅ Dropped table '${tableName}'`);
            }
          } catch (err) {
            console.log(`⚠️  Could not check '${tableName}': ${err.message}`);
            // Try to drop anyway if it exists
            try {
              await pool.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
              console.log(`✅ Dropped table '${tableName}'`);
            } catch (dropErr) {
              console.log(`❌ Could not drop '${tableName}': ${dropErr.message}`);
            }
          }
        } else {
          console.log(`⚠️  Skipping '${tableName}' - proper table '${properTableName}' does not exist`);
        }
      } else {
        console.log(`ℹ️  Table '${tableName}' does not exist, skipping`);
      }
    }

    // Verify tables were removed
    console.log('\nVerifying tables after cleanup...');
    const [remainingTables] = await pool.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
    );
    
    const remainingTableNames = remainingTables.map(t => t.TABLE_NAME);
    console.log('\nRemaining tables:', remainingTableNames.join(', '));
    
    const stillHasDuplicates = tablesToRemove.some(t => remainingTableNames.includes(t));
    if (stillHasDuplicates) {
      console.log('\n⚠️  Some duplicate tables still exist');
    } else {
      console.log('\n✅ All duplicate lowercase tables have been removed');
    }

  } catch (error) {
    console.error('❌ Error removing duplicate tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

removeDuplicateTables();


