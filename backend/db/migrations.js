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
