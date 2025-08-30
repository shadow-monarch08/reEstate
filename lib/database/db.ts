import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export const initializeDatabase = async () => {
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
      create table if not exists Messages (
        id integer primary key autoincrement,
        server_id text null,
        local_id text null,
        conversation_id text not null,
        sender_role text not null,
        sender_id text not null,
        receiver_id text not null,
        body text not null,
        content_type text default 'text/plain',
        created_at text not null,
        pending integer default 0,
        status text default 'pending',
        unique(server_id)
      );
    `);

    await db.execAsync(`
        create table if not exists read_state (
          conversation_id text primary key,
          last_read_at text default '1970-01-01T00:00:00.000Z'
        );
    `);

    await db.execAsync(`
        create table if not exists pending_status_syncs (
          local_id text primary key,
          conversation_id text not null,
          status text not null,
          ack_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await db.execAsync(`
        create index if not exists idx_messages_conv_time on Messages(conversation_id, created_at);
    `);
  }
};

export const getDb = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};
