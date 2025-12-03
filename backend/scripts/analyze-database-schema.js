import { pool } from '../db/connection.js';

async function analyzeDatabase() {
  try {
    console.log('📊 Database Schema Analysis\n');
    console.log('='.repeat(60));
    
    // Get all tables
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log(`\n📋 Tables Found: ${tables.length}\n`);
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📦 Table: ${tableName}`);
      console.log('─'.repeat(60));
      
      // Get columns
      const [columns] = await pool.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY,
          EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      
      console.log('\nColumns:');
      columns.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
        const extra = col.EXTRA ? ` ${col.EXTRA}` : '';
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const defaultVal = col.COLUMN_DEFAULT !== null ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        console.log(`  • ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}${defaultVal}${key}${extra}`);
      });
      
      // Get foreign keys
      const [foreignKeys] = await pool.execute(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [tableName]);
      
      if (foreignKeys.length > 0) {
        console.log('\nForeign Keys:');
        foreignKeys.forEach(fk => {
          console.log(`  • ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });
      }
      
      // Get indexes
      const [indexes] = await pool.execute(`
        SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          SEQ_IN_INDEX
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME != 'PRIMARY'
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [tableName]);
      
      if (indexes.length > 0) {
        const indexGroups = {};
        indexes.forEach(idx => {
          if (!indexGroups[idx.INDEX_NAME]) {
            indexGroups[idx.INDEX_NAME] = {
              unique: idx.NON_UNIQUE === 0,
              columns: []
            };
          }
          indexGroups[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
        });
        
        console.log('\nIndexes:');
        Object.entries(indexGroups).forEach(([name, info]) => {
          const unique = info.unique ? 'UNIQUE ' : '';
          console.log(`  • ${unique}${name}: (${info.columns.join(', ')})`);
        });
      }
      
      // Get row count
      const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\nRow Count: ${count[0].count}`);
    }
    
    // Check for potential issues
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('🔍 Schema Analysis');
    console.log('='.repeat(60));
    
    // Check for missing foreign keys
    console.log('\n⚠️  Checking for missing foreign key relationships...\n');
    
    // Customer_Purchase_Transaction should reference Customer
    const [customerFk] = await pool.execute(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Customer_Purchase_Transaction'
      AND COLUMN_NAME = 'customer_id'
      AND REFERENCED_TABLE_NAME = 'Customer'
    `);
    
    if (customerFk.length === 0) {
      console.log('  ⚠️  Missing: Customer_Purchase_Transaction.customer_id → Customer.customer_id');
    } else {
      console.log('  ✅ Customer_Purchase_Transaction.customer_id → Customer.customer_id');
    }
    
    // Transaction_Details should reference Customer_Purchase_Transaction
    const [transactionFk] = await pool.execute(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Transaction_Details'
      AND COLUMN_NAME = 'transaction_id'
      AND REFERENCED_TABLE_NAME = 'Customer_Purchase_Transaction'
    `);
    
    if (transactionFk.length === 0) {
      console.log('  ⚠️  Missing: Transaction_Details.transaction_id → Customer_Purchase_Transaction.transaction_id');
    } else {
      console.log('  ✅ Transaction_Details.transaction_id → Customer_Purchase_Transaction.transaction_id');
    }
    
    // Transaction_Details should reference Furniture
    const [furnitureFk] = await pool.execute(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Transaction_Details'
      AND COLUMN_NAME = 'furniture_id'
      AND REFERENCED_TABLE_NAME = 'Furniture'
    `);
    
    if (furnitureFk.length === 0) {
      console.log('  ⚠️  Missing: Transaction_Details.furniture_id → Furniture.furniture_id');
    } else {
      console.log('  ✅ Transaction_Details.furniture_id → Furniture.furniture_id');
    }
    
    // Furniture should reference Employee
    const [employeeFk] = await pool.execute(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Furniture'
      AND COLUMN_NAME = 'added_by_employee_id'
      AND REFERENCED_TABLE_NAME = 'Employee'
    `);
    
    if (employeeFk.length === 0) {
      console.log('  ⚠️  Missing: Furniture.added_by_employee_id → Employee.employee_id');
    } else {
      console.log('  ✅ Furniture.added_by_employee_id → Employee.employee_id');
    }
    
    // Inventory_Log should reference Furniture and Employee
    const [inventoryLogExists] = await pool.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Inventory_Log'
    `);
    
    if (inventoryLogExists.length > 0) {
      const [inventoryFurnitureFk] = await pool.execute(`
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Inventory_Log'
        AND COLUMN_NAME = 'furniture_id'
        AND REFERENCED_TABLE_NAME = 'Furniture'
      `);
      
      if (inventoryFurnitureFk.length === 0) {
        console.log('  ⚠️  Missing: Inventory_Log.furniture_id → Furniture.furniture_id');
      } else {
        console.log('  ✅ Inventory_Log.furniture_id → Furniture.furniture_id');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Analysis Complete');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error);
  } finally {
    await pool.end();
  }
}

analyzeDatabase();


