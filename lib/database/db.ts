import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export const initializeDatabase = async () => {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync("chat.db");
      await db.execAsync(`PRAGMA journal_mode = WAL;`);
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Conversations (
    conversation_id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT,
    agent_name TEXT,
    agent_avatar TEXT,
    avatar_last_update TEXT
    );
    `);

      await db.execAsync(`
  CREATE TABLE IF NOT EXISTS Messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT UNIQUE,
    local_id TEXT,
    conversation_id TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    body TEXT NOT NULL,
    content_type TEXT DEFAULT 'text/plain',
    created_at TEXT NOT NULL,
    pending INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',

    -- file related metadata
    file_bucket TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    device_path TEXT,
    storage_path TEXT,

    -- upload state
    upload_status TEXT DEFAULT 'idle', -- 'idle'|'uploading'|'uploaded'|'failed'

    -- timestamps
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

      await db.execAsync(`
  CREATE TABLE IF NOT EXISTS read_state (
    conversation_id TEXT PRIMARY KEY,
    last_read_at TEXT DEFAULT '1970-01-01T00:00:00.000Z'
  );
`);

      await db.execAsync(`
  CREATE TABLE IF NOT EXISTS pending_status_syncs (
    local_id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    status TEXT NOT NULL,
    ack_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `);

      await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_messages_conv_time
    ON Messages (conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_localid
    ON Messages (local_id);
    `);
    }
  } catch (error) {
    console.warn(error);
  }
};

export const getDb = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};
