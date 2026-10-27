import * as SQLite from 'expo-sqlite';

let sqliteDb: SQLite.SQLiteDatabase | null = null;

export async function getPlatformDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (sqliteDb) {
    return sqliteDb;
  }
  try {
    const db = await SQLite.openDatabaseAsync('mustard.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    sqliteDb = db;
    return db;
  } catch {
    return null;
  }
}
