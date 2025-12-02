import { pool } from '../db/connection.js';

async function fixMissingConditions() {
  try {
    console.log('Checking for items with missing condition_status...\n');

    // Find items with NULL or empty condition_status
    const [itemsWithNullCondition] = await pool.execute(
      'SELECT furniture_id, name, condition_status FROM Furniture WHERE condition_status IS NULL OR condition_status = ""'
    );

    console.log(`Found ${itemsWithNullCondition.length} item(s) with missing condition_status\n`);

    if (itemsWithNullCondition.length === 0) {
      console.log('✅ All items already have a condition status!');
      return;
    }

    // Update all items with NULL condition_status to 'Good'
    const [result] = await pool.execute(
      "UPDATE Furniture SET condition_status = 'Good' WHERE condition_status IS NULL OR condition_status = ''"
    );

    console.log(`✅ Updated ${result.affectedRows} item(s) to have condition_status = 'Good'\n`);

    // Verify the update
    const [remaining] = await pool.execute(
      'SELECT COUNT(*) as count FROM Furniture WHERE condition_status IS NULL OR condition_status = ""'
    );

    if (remaining[0].count === 0) {
      console.log('✅ All items now have a valid condition status!');
    } else {
      console.log(`⚠️  Warning: ${remaining[0].count} item(s) still have missing condition_status`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

fixMissingConditions();


