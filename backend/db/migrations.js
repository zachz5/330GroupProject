import { pool } from './connection.js';

/**
 * Get emoji for a furniture item based on its name and category
 */
function getFurnitureEmoji(name, category) {
  const itemName = (name || '').toLowerCase();
  const itemCategory = (category || '').toLowerCase();

  // Check for specific furniture types in the name
  if (itemName.includes('table') || itemName.includes('desk')) {
    return '📋';
  }
  if (itemName.includes('chair') || itemName.includes('seat')) {
    return '🪑';
  }
  if (itemName.includes('bed') || itemName.includes('mattress')) {
    return '🛏️';
  }
  if (itemName.includes('sofa') || itemName.includes('couch') || itemName.includes('loveseat')) {
    return '🛋️';
  }
  if (itemName.includes('dresser') || itemName.includes('drawer') || itemName.includes('cabinet')) {
    return '🗄️';
  }
  if (itemName.includes('lamp') || itemName.includes('light')) {
    return '💡';
  }
  if (itemName.includes('mirror')) {
    return '🪞';
  }
  if (itemName.includes('bookshelf') || itemName.includes('shelf')) {
    return '📚';
  }
  if (itemName.includes('pillow') || itemName.includes('cushion')) {
    return '🪶';
  }
  if (itemName.includes('rug') || itemName.includes('carpet')) {
    return '🧶';
  }
  if (itemName.includes('curtain') || itemName.includes('drape')) {
    return '🪟';
  }
  if (itemName.includes('nightstand') || itemName.includes('end table')) {
    return '📋';
  }
  if (itemName.includes('wardrobe') || itemName.includes('closet')) {
    return '👔';
  }
  if (itemName.includes('ottoman') || itemName.includes('footstool')) {
    return '🪑';
  }

  // Check category
  if (itemCategory.includes('bedding')) {
    return '🛏️';
  }
  if (itemCategory.includes('lighting')) {
    return '💡';
  }
  if (itemCategory.includes('furniture')) {
    return '🪑';
  }

  // Default emoji for furniture
  return '🪑';
}

/**
 * Run database migrations on startup
 */
export async function runMigrations() {
  let connection = null;
  try {
    console.log('Checking database migrations...\n');

    // Use a single connection for all migration operations
    try {
      connection = await pool.getConnection();
    } catch (connError) {
      console.error('⚠️  Could not get connection for migrations:', connError.message);
      console.error('   Migrations will be skipped. Server will continue running.\n');
      return;
    }

    // Drop image_url column if it exists
    try {
      const [imageUrlColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Furniture' 
        AND COLUMN_NAME = 'image_url'
      `);

      if (imageUrlColumns.length > 0) {
        console.log('Removing image_url column from Furniture table...');
        await connection.execute(`ALTER TABLE Furniture DROP COLUMN image_url`);
        console.log('✅ image_url column removed successfully!\n');
      } else {
        console.log('✅ image_url column does not exist (already removed)\n');
      }
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        // Column doesn't exist, that's fine
        console.log('✅ image_url column does not exist\n');
      } else {
        console.error('⚠️  Could not remove image_url column:', error.message);
        console.error('   You can run: ALTER TABLE Furniture DROP COLUMN image_url;\n');
      }
    }

    // Check if emoji column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Furniture' 
      AND COLUMN_NAME = 'emoji'
    `);

    if (columns.length === 0) {
      console.log('Adding emoji column to Furniture table...');
      try {
        await connection.execute(`
          ALTER TABLE Furniture 
          ADD COLUMN emoji VARCHAR(10) NULL
        `);
        console.log('✅ Emoji column added successfully!\n');
      } catch (error) {
        // If it fails, log but don't crash the server
        if (error.code === 'ER_DUP_FIELD_NAME') {
          console.log('✅ Emoji column already exists\n');
        } else {
          console.error('⚠️  Could not add emoji column:', error.message);
          console.error('   You can add it manually with: ALTER TABLE Furniture ADD COLUMN emoji VARCHAR(10) NULL;\n');
        }
      }
    } else {
      console.log('✅ Emoji column already exists\n');
    }

    // Update NULL emoji values for existing items using CASE statements (single query)
    console.log('Updating NULL emoji values for existing items...');
    try {
      const [result] = await connection.execute(`
        UPDATE Furniture 
        SET emoji = CASE
          WHEN (LOWER(name) LIKE '%table%' OR LOWER(name) LIKE '%desk%' OR LOWER(name) LIKE '%nightstand%' OR LOWER(name) LIKE '%end table%') THEN '📋'
          WHEN (LOWER(name) LIKE '%chair%' OR LOWER(name) LIKE '%seat%' OR LOWER(name) LIKE '%ottoman%' OR LOWER(name) LIKE '%footstool%') THEN '🪑'
          WHEN (LOWER(name) LIKE '%bed%' OR LOWER(name) LIKE '%mattress%') THEN '🛏️'
          WHEN (LOWER(name) LIKE '%sofa%' OR LOWER(name) LIKE '%couch%' OR LOWER(name) LIKE '%loveseat%') THEN '🛋️'
          WHEN (LOWER(name) LIKE '%dresser%' OR LOWER(name) LIKE '%drawer%' OR LOWER(name) LIKE '%cabinet%') THEN '🗄️'
          WHEN (LOWER(name) LIKE '%lamp%' OR LOWER(name) LIKE '%light%') THEN '💡'
          WHEN LOWER(name) LIKE '%mirror%' THEN '🪞'
          WHEN (LOWER(name) LIKE '%bookshelf%' OR LOWER(name) LIKE '%shelf%') THEN '📚'
          WHEN (LOWER(name) LIKE '%pillow%' OR LOWER(name) LIKE '%cushion%') THEN '🪶'
          WHEN (LOWER(name) LIKE '%rug%' OR LOWER(name) LIKE '%carpet%') THEN '🧶'
          WHEN (LOWER(name) LIKE '%curtain%' OR LOWER(name) LIKE '%drape%') THEN '🪟'
          WHEN (LOWER(name) LIKE '%wardrobe%' OR LOWER(name) LIKE '%closet%') THEN '👔'
          WHEN (LOWER(category) LIKE '%bedding%') THEN '🛏️'
          WHEN (LOWER(category) LIKE '%lighting%') THEN '💡'
          WHEN (LOWER(category) LIKE '%furniture%') THEN '🪑'
          ELSE '🪑'
        END
        WHERE emoji IS NULL OR emoji = ''
      `);
      
      if (result.affectedRows > 0) {
        console.log(`✅ Updated ${result.affectedRows} item(s) with default emojis\n`);
      } else {
        console.log('✅ All items already have emoji values\n');
      }
    } catch (error) {
      console.error('⚠️  Could not update emoji values:', error.message);
      console.error('   This is not critical - the server will continue running\n');
    }

    // Check if notes column exists in Customer_Purchase_Transaction table
    const [notesColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Customer_Purchase_Transaction' 
      AND COLUMN_NAME = 'notes'
    `);

    if (notesColumns.length === 0) {
      console.log('Adding notes column to Customer_Purchase_Transaction table...');
      try {
        await connection.execute(`
          ALTER TABLE Customer_Purchase_Transaction 
          ADD COLUMN notes TEXT NULL
        `);
        console.log('✅ Notes column added successfully!\n');
      } catch (error) {
        // If it fails, log but don't crash the server
        if (error.code === 'ER_DUP_FIELD_NAME') {
          console.log('✅ Notes column already exists\n');
        } else {
          console.error('⚠️  Could not add notes column:', error.message);
          console.error('   You can add it manually with: ALTER TABLE Customer_Purchase_Transaction ADD COLUMN notes TEXT NULL;\n');
        }
      }
    } else {
      console.log('✅ Notes column already exists\n');
    }

    // Check if tax_amount column exists in Customer_Purchase_Transaction table
    const [taxColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Customer_Purchase_Transaction' 
      AND COLUMN_NAME = 'tax_amount'
    `);

    if (taxColumns.length === 0) {
      console.log('Adding tax_amount column to Customer_Purchase_Transaction table...');
      try {
        await connection.execute(`
          ALTER TABLE Customer_Purchase_Transaction 
          ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0.00
        `);
        console.log('✅ Tax amount column added successfully!\n');
      } catch (error) {
        // If it fails, log but don't crash the server
        if (error.code === 'ER_DUP_FIELD_NAME') {
          console.log('✅ Tax amount column already exists\n');
        } else {
          console.error('⚠️  Could not add tax_amount column:', error.message);
          console.error('   You can add it manually with: ALTER TABLE Customer_Purchase_Transaction ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0.00;\n');
        }
      }
    } else {
      console.log('✅ Tax amount column already exists\n');
    }

    // Backfill tax_amount and update total_amount for existing transactions
    try {
      // Get all transactions to check and update
      const [allTransactions] = await connection.execute(`
        SELECT transaction_id, total_amount, tax_amount
        FROM Customer_Purchase_Transaction
      `);

      if (allTransactions.length > 0) {
        let updatedCount = 0;
        console.log(`Checking and updating tax for ${allTransactions.length} transaction(s)...`);
        
        for (const transaction of allTransactions) {
          // Get subtotal from transaction details
          const [details] = await connection.execute(
            'SELECT quantity, price_each FROM Transaction_Details WHERE transaction_id = ?',
            [transaction.transaction_id]
          );
          
          if (details.length === 0) continue; // Skip if no items
          
          const subtotal = details.reduce((sum, detail) => sum + (detail.quantity * detail.price_each), 0);
          const TAX_RATE = 0.04;
          const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
          const expectedTotal = subtotal + taxAmount;
          
          // Check if tax_amount needs updating or total_amount doesn't match expected total
          const needsUpdate = 
            transaction.tax_amount === null || 
            transaction.tax_amount === 0 || 
            Math.abs(transaction.total_amount - expectedTotal) > 0.01; // Allow small rounding differences
          
          if (needsUpdate) {
            // Update both tax_amount and total_amount to include tax
            await connection.execute(
              'UPDATE Customer_Purchase_Transaction SET tax_amount = ?, total_amount = ? WHERE transaction_id = ?',
              [taxAmount, expectedTotal, transaction.transaction_id]
            );
            updatedCount++;
          }
        }
        
        if (updatedCount > 0) {
          console.log(`✅ Successfully updated tax and totals for ${updatedCount} transaction(s)\n`);
        } else {
          console.log('✅ All transactions already have correct tax and totals\n');
        }
      } else {
        console.log('✅ No transactions to update\n');
      }
    } catch (error) {
      console.error('⚠️  Could not backfill tax for existing transactions:', error.message);
      console.error('   This is not critical - the server will continue running\n');
    }

    // Check if shipping_address column exists in Customer_Purchase_Transaction table
    const [shippingColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Customer_Purchase_Transaction' 
      AND COLUMN_NAME = 'shipping_address'
    `);

    if (shippingColumns.length === 0) {
      console.log('Adding shipping_address column to Customer_Purchase_Transaction table...');
      try {
        await connection.execute(`
          ALTER TABLE Customer_Purchase_Transaction 
          ADD COLUMN shipping_address VARCHAR(500) NULL
        `);
        console.log('✅ Shipping address column added successfully!\n');
      } catch (error) {
        // If it fails, log but don't crash the server
        if (error.code === 'ER_DUP_FIELD_NAME') {
          console.log('✅ Shipping address column already exists\n');
        } else {
          console.error('⚠️  Could not add shipping_address column:', error.message);
          console.error('   You can add it manually with: ALTER TABLE Customer_Purchase_Transaction ADD COLUMN shipping_address VARCHAR(500) NULL;\n');
        }
      }
    } else {
      console.log('✅ Shipping address column already exists\n');
    }

    // Backfill shipping_address for existing transactions using customer's address
    try {
      const [transactionsNeedingAddress] = await connection.execute(`
        SELECT t.transaction_id, t.customer_id, c.address
        FROM Customer_Purchase_Transaction t
        JOIN Customer c ON t.customer_id = c.customer_id
        WHERE t.shipping_address IS NULL AND c.address IS NOT NULL
      `);

      if (transactionsNeedingAddress.length > 0) {
        console.log(`Backfilling shipping addresses for ${transactionsNeedingAddress.length} existing transaction(s)...`);
        
        for (const transaction of transactionsNeedingAddress) {
          await connection.execute(
            'UPDATE Customer_Purchase_Transaction SET shipping_address = ? WHERE transaction_id = ?',
            [transaction.address, transaction.transaction_id]
          );
        }
        
        console.log(`✅ Successfully backfilled shipping addresses for ${transactionsNeedingAddress.length} transaction(s)\n`);
      } else {
        console.log('✅ All transactions already have shipping addresses or customers have no address\n');
      }
    } catch (error) {
      console.error('⚠️  Could not backfill shipping addresses for existing transactions:', error.message);
      console.error('   This is not critical - the server will continue running\n');
    }

    // Check if is_for_sale column exists in Furniture table
    const [isForSaleColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Furniture' 
      AND COLUMN_NAME = 'is_for_sale'
    `);

    if (isForSaleColumns.length === 0) {
      console.log('Adding is_for_sale column to Furniture table...');
      try {
        await connection.execute(`
          ALTER TABLE Furniture 
          ADD COLUMN is_for_sale BOOLEAN DEFAULT TRUE NOT NULL
        `);
        console.log('✅ is_for_sale column added successfully!\n');
      } catch (error) {
        // If it fails, log but don't crash the server
        if (error.code === 'ER_DUP_FIELD_NAME') {
          console.log('✅ is_for_sale column already exists\n');
        } else {
          console.error('⚠️  Could not add is_for_sale column:', error.message);
          console.error('   You can add it manually with: ALTER TABLE Furniture ADD COLUMN is_for_sale BOOLEAN DEFAULT TRUE NOT NULL;\n');
        }
      }
    } else {
      console.log('✅ is_for_sale column already exists\n');
    }
  } catch (error) {
    // Don't crash the server if migrations fail
    console.error('⚠️  Migration check failed:', error.message);
    console.error('   This is not critical - the server will continue running\n');
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
