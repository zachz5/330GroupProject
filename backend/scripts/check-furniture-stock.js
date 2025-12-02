import { pool } from '../db/connection.js';

async function checkStock() {
  try {
    console.log('Checking furniture stock...\n');
    
    // Check furniture_id 7 (Nightstand)
    const [furniture] = await pool.execute(
      'SELECT furniture_id, name, quantity FROM Furniture WHERE furniture_id = ?',
      [7]
    );
    
    if (furniture.length > 0) {
      console.log(`Furniture ID 7 (${furniture[0].name}):`);
      console.log(`  Current stock: ${furniture[0].quantity}`);
    } else {
      console.log('Furniture ID 7 not found');
    }
    
    // Check all furniture
    const [allFurniture] = await pool.execute(
      'SELECT furniture_id, name, quantity FROM Furniture ORDER BY furniture_id'
    );
    
    console.log('\nAll furniture stock:');
    allFurniture.forEach(f => {
      console.log(`  ID ${f.furniture_id}: ${f.name} - ${f.quantity} in stock`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkStock();



