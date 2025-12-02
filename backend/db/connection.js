import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL or use individual environment variables
function getDbConfig() {
  // Option 1: Use JAWSDB_URL (JawsDB connection string)
  const dbUrl = process.env.JAWSDB_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      return {
        host: match[3],
        port: parseInt(match[4]),
        user: match[1],
        password: match[2],
        database: match[5],
      };
    }
    // Try parsing without explicit port (defaults to 3306)
    const matchNoPort = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
    if (matchNoPort) {
      return {
        host: matchNoPort[3],
        port: 3306,
        user: matchNoPort[1],
        password: matchNoPort[2],
        database: matchNoPort[4],
      };
    }
  }
  
  // Option 2: Use individual environment variables
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }
  
  throw new Error('Database configuration not found. Please set either DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (and optionally DB_PORT) in your .env file.');
}

const dbConfig = getDbConfig();

// Create connection pool
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection
pool.getConnection()
  .then((connection) => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

export default pool;

