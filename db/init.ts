/**
 * Database Initialization Script
 * Creates SQLite database and runs schema migrations
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'sqlite.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

/**
 * Initialize the SQLite database
 * - Creates database file if it doesn't exist
 * - Runs schema.sql to create tables
 * - Returns database connection
 */
export function initializeDatabase(): Database.Database {
  console.log('[DB Init] Initializing database...');
  
  // Ensure db directory exists
  const dbDir = dirname(DB_PATH);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    console.log(`[DB Init] Created directory: ${dbDir}`);
  }
  
  const isNewDb = !existsSync(DB_PATH);
  
  // Create/open database connection
  const db = new Database(DB_PATH, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  if (isNewDb) {
    console.log('[DB Init] New database detected. Running schema...');
    runSchema(db);
  } else {
    console.log('[DB Init] Existing database found.');
  }
  
  console.log(`[DB Init] Database ready at: ${DB_PATH}`);
  return db;
}

/**
 * Run schema.sql to create tables
 */
function runSchema(db: Database.Database): void {
  try {
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    
    // SQLite better-sqlite3 doesn't support multi-statement exec well
    // Split by semicolon and execute individually
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    db.transaction(() => {
      statements.forEach(statement => {
        if (statement) {
          db.exec(statement);
        }
      });
    })();
    
    console.log('[DB Init] Schema applied successfully.');
  } catch (error) {
    console.error('[DB Init] Error running schema:', error);
    throw error;
  }
}

/**
 * Reset database (drop all tables and recreate)
 * CAUTION: This deletes all data!
 */
export function resetDatabase(db: Database.Database): void {
  console.warn('[DB Init] Resetting database - ALL DATA WILL BE LOST');
  
  // Drop all tables
  const tables = [
    'waitlist',
    'settings',
    'audit_log',
    'bookings',
    'technicians',
    'services',
    'businesses',
    'customers',
  ];
  
  db.transaction(() => {
    tables.forEach(table => {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    });
  })();
  
  // Recreate schema
  runSchema(db);
  console.log('[DB Init] Database reset complete.');
}

/**
 * Get database connection (singleton pattern)
 */
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[DB Init] Database connection closed.');
  }
}

// Auto-initialize on import if not in test environment
if (process.env.NODE_ENV !== 'test') {
  getDatabase();
}

export default {
  initializeDatabase,
  getDatabase,
  resetDatabase,
  closeDatabase,
};
