import { pool } from '../db/connection.js';

async function removeDuplicateTransactions() {
  try {
    console.log('🔍 Finding duplicate transactions...\n');
    
    // Find transactions with the same customer_id, total_amount, and items
    const [duplicates] = await pool.execute(`
      SELECT 
        t1.transaction_id as id1,
        t2.transaction_id as id2,
        t1.customer_id,
        t1.total_amount,
        t1.transaction_date as date1,
        t2.transaction_date as date2,
        COUNT(DISTINCT td1.detail_id) as item_count
      FROM Customer_Purchase_Transaction t1
      JOIN Customer_Purchase_Transaction t2 
        ON t1.customer_id = t2.customer_id
        AND t1.transaction_id < t2.transaction_id
        AND ABS(t1.total_amount - t2.total_amount) < 0.01
      LEFT JOIN Transaction_Details td1 ON t1.transaction_id = td1.transaction_id
      LEFT JOIN Transaction_Details td2 ON t2.transaction_id = td2.transaction_id
      GROUP BY t1.transaction_id, t2.transaction_id, t1.customer_id, t1.total_amount, t1.transaction_date, t2.transaction_date
      HAVING COUNT(DISTINCT td1.detail_id) = COUNT(DISTINCT td2.detail_id)
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate transactions found!\n');
      return;
    }
    
    console.log(`Found ${duplicates.length} potential duplicate pairs\n`);
    
    // For each duplicate pair, check if items match exactly
    const toDelete = [];
    
    for (const dup of duplicates) {
      const [items1] = await pool.execute(
        'SELECT furniture_id, quantity, price_each FROM Transaction_Details WHERE transaction_id = ? ORDER BY furniture_id, quantity',
        [dup.id1]
      );
      
      const [items2] = await pool.execute(
        'SELECT furniture_id, quantity, price_each FROM Transaction_Details WHERE transaction_id = ? ORDER BY furniture_id, quantity',
        [dup.id2]
      );
      
      if (items1.length !== items2.length) continue;
      
      const itemsMatch = items1.every((item1, index) => {
        const item2 = items2[index];
        return item1.furniture_id === item2.furniture_id &&
               item1.quantity === item2.quantity &&
               Math.abs(item1.price_each - item2.price_each) < 0.01;
      });
      
      if (itemsMatch) {
        // Keep the older transaction, delete the newer one
        const keepId = new Date(dup.date1) < new Date(dup.date2) ? dup.id1 : dup.id2;
        const deleteId = keepId === dup.id1 ? dup.id2 : dup.id1;
        toDelete.push(deleteId);
        console.log(`  🗑️  Will delete transaction ${deleteId} (duplicate of ${keepId})`);
      }
    }
    
    if (toDelete.length === 0) {
      console.log('\n✅ No exact duplicates found (items don\'t match exactly)\n');
      return;
    }
    
    // Remove duplicate IDs from the list
    const uniqueToDelete = [...new Set(toDelete)];
    
    console.log(`\n⚠️  Found ${uniqueToDelete.length} unique duplicate transactions to delete`);
    console.log('   Transaction IDs:', uniqueToDelete.join(', '));
    console.log('\n🗑️  Deleting duplicate transactions...\n');
    
    // Delete the duplicates
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      let deletedCount = 0;
      for (const id of uniqueToDelete) {
        // Delete transaction details first
        await connection.execute('DELETE FROM Transaction_Details WHERE transaction_id = ?', [id]);
        // Then delete the transaction
        await connection.execute('DELETE FROM Customer_Purchase_Transaction WHERE transaction_id = ?', [id]);
        deletedCount++;
        if (deletedCount % 10 === 0) {
          console.log(`   Deleted ${deletedCount}/${uniqueToDelete.length} transactions...`);
        }
      }
      
      await connection.commit();
      console.log(`\n✅ Successfully deleted ${deletedCount} duplicate transactions\n`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  } finally {
    await pool.end();
  }
}

removeDuplicateTransactions();
