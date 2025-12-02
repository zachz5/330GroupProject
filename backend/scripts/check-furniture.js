import { pool } from '../db/connection.js';

async function checkFurniture() {
  try {
    console.log('Checking furniture table...\n');

    // Check if table exists and get count
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM furniture');
    console.log(`Total furniture items in database: ${count[0].count}\n`);

    if (count[0].count === 0) {
      console.log('⚠️  No furniture items found in database.');
      console.log('Would you like to add some sample items? (This script can be extended to do that)\n');
    } else {
      // Get all items
      const [items] = await pool.execute('SELECT * FROM furniture ORDER BY furniture_id DESC LIMIT 10');
      console.log('Sample items:');
      items.forEach((item, i) => {
        console.log(`${i + 1}. ${item.name} - $${item.price} (ID: ${item.furniture_id})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking furniture:', error.message);
    if (error.message.includes("doesn't exist")) {
      console.error('\n⚠️  The furniture table does not exist. You may need to create it.');
    }
    process.exit(1);
  }
}

checkFurniture();



