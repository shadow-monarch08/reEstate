import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export const initializeDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("chat.db");
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Conversation (
        conversation_id TEXT PRIMARY KEY NOT NULL,
        agent_id TEXT,
        agent_name TEXT,
        agent_avatar TEXT,
        avatar_last_update TEXT,
        unread_count INTEGER
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Message (
        id TEXT PRIMARY KEY NOT NULL,
        message TEXT,
        conversation_id TEXT,
        sender_id TEXT,
        receiver_id TEXT,
        file TEXT,
        property_ref TEXT,
        created_at TEXT,
        status TEXT,
        FOREIGN KEY (conversation_id)
        REFERENCES Conversation(conversation_id)
        ON DELETE CASCADE
      );
      `);
  }
};

export const getDb = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};
