import {
  Conversation,
  ConversationOverview,
  RawMessage,
} from "@/types/domain/chat";
import { getDb } from "./db";
import { LocalMessage } from "@/types/api/localDatabase";

export const getAllConversationOverviews = async ({
  range,
  user_id,
}: {
  range: Array<number | number>;
  user_id: string;
}): Promise<Array<ConversationOverview>> => {
  const offset = range[0];
  const limit = range[1] - range[0];
  const db = getDb();

  // Step 1: Get conversations with latest message timestamp + unread count
  const convResult: Array<
    Conversation & {
      latest_message_time: string | null;
      unread_count: number;
    }
  > = await db.getAllAsync(
    `
    SELECT 
      c.*,
      MAX(m.created_at) as latest_message_time,
      -- count messages newer than last_read_at (or epoch if null)
      COUNT(
        CASE 
          WHEN m.created_at > IFNULL(rs.last_read_at, '1970-01-01T00:00:00.000Z') AND m.sender_role <> 'user'
          THEN 1 
        END
      ) as unread_count
    FROM Conversations c
    LEFT JOIN Messages m ON c.conversation_id = m.conversation_id
    LEFT JOIN read_state rs ON c.conversation_id = rs.conversation_id
    -- highlight-start
    WHERE c.user_id = ? -- Filter conversations by the user's ID
    -- highlight-end
    GROUP BY c.conversation_id
    ORDER BY latest_message_time DESC
    LIMIT ? OFFSET ?
    `,
    // highlight-start
    [user_id, limit, offset] // Add user_id to the parameters array
    // highlight-end
  );

  const overviews: Array<ConversationOverview> = [];

  for (const conv of convResult) {
    // Step 2: Get the latest message for this conversation
    const msgResult: RawMessage[] = await db.getAllAsync(
      `SELECT * FROM Messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
      [conv.conversation_id]
    );

    const latestMessage = msgResult?.[0] ?? null;

    // Step 3: Push overview
    overviews.push({
      conversation_id: conv.conversation_id,
      agent_id: conv.agent_id,
      agent_name: conv.agent_name,
      agent_avatar: conv.agent_avatar,
      avatar_last_update: conv.avatar_last_update,
      last_message: latestMessage?.body,
      last_message_time: latestMessage?.created_at,
      last_message_status: latestMessage?.status,
      last_message_file_name: latestMessage?.file_name,
      last_message_mime_type: latestMessage?.mime_type,
      last_message_content_type: latestMessage?.content_type,
      last_message_sender_role: latestMessage?.sender_role,
      unread_count: conv.unread_count ?? 0,
    });
  }

  return overviews;
};

export const getConversationOverview = async (
  conversationId: string,
  user_id: string
): Promise<ConversationOverview | null> => {
  const db = getDb();

  // Step 1: Get conversation + unread_count
  const convResult: Array<
    Conversation & {
      unread_count: number;
    }
  > = await db.getAllAsync(
    `
    SELECT 
      c.*,
      COUNT(
        CASE 
          WHEN m.created_at > IFNULL(rs.last_read_at, '1970-01-01T00:00:00.000Z') AND m.sender_role <> 'user'
          THEN 1 
        END
      ) as unread_count
    FROM Conversations c
    LEFT JOIN Messages m ON c.conversation_id = m.conversation_id
    LEFT JOIN read_state rs ON c.conversation_id = rs.conversation_id
    WHERE c.conversation_id = ? AND c.user_id = ?
    GROUP BY c.conversation_id
    `,
    [conversationId, user_id]
  );

  if (convResult.length === 0) return null;

  const conv = convResult[0];

  // Step 2: Get latest message
  const msgResult: RawMessage[] = await db.getAllAsync(
    `SELECT * FROM Messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
    [conversationId]
  );

  const latestMessage = msgResult?.[0] ?? null;

  // Step 3: Build overview
  const overview: ConversationOverview = {
    conversation_id: conv.conversation_id,
    agent_id: conv.agent_id,
    agent_name: conv.agent_name,
    agent_avatar: conv.agent_avatar,
    avatar_last_update: conv.avatar_last_update,
    last_message: latestMessage?.body,
    last_message_time: latestMessage?.created_at,
    last_message_status: latestMessage?.status,
    last_message_file_name: latestMessage?.file_name,
    last_message_mime_type: latestMessage?.mime_type,
    last_message_content_type: latestMessage?.content_type,
    last_message_sender_role: latestMessage?.sender_role,
    unread_count: conv.unread_count ?? 0,
  };

  return overview;
};

export async function insertLocalMessage(m: LocalMessage) {
  const db = getDb();

  try {
    const res = await db.runAsync(
      `insert into Messages (server_id, local_id, conversation_id, sender_role, sender_id, receiver_id, body, content_type, created_at, pending, status, file_name, file_size, mime_type, upload_status, device_path, storage_path, img_height, img_width, inserted_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        m.server_id ?? null,
        m.local_id ?? null,
        m.conversation_id,
        m.sender_role,
        m.sender_id,
        m.receiver_id,
        m.body,
        m.content_type ?? "text/plain",
        m.created_at,
        m.pending ?? 0,
        m.status ?? "sending",
        m.file_name || null,
        m.file_size || null,
        m.mime_type || null,
        m.upload_status || "uploading",
        m.device_path || null,
        m.storage_path || null,
        m.img_height || null,
        m.img_width || null,
        new Date().toISOString(),
      ]
    );
    return res.lastInsertRowId as number | undefined;
  } catch (error) {
    console.error("Error while inserting local message: ", error);
  }
}

export const updateMessage = async ({
  msg,
  checkCondition,
  conditionSeperator = "AND",
  conditionOperator,
}: {
  msg: Record<string, any>;
  checkCondition: Record<string, any>;
  conditionSeperator?: string;
  conditionOperator: Record<string, string>;
}) => {
  const db = getDb();
  try {
    // Build dynamic SET clause based on provided fields
    const fields = Object.keys(msg);
    const conditions = Object.keys(checkCondition);
    if (fields.length === 0 || conditions.length === 0) return;

    const setClause = fields.map((key) => `${key} = ?`).join(", ");
    const conditionClause = conditions
      .map((key) => `${key} ${conditionOperator[key]} ?`)
      .join(" " + (conditionSeperator ?? "") + " ");
    const values = [
      ...fields.map((key) => msg[key]),
      ...conditions.map((key) => checkCondition[key]),
    ];
    const query = `UPDATE Messages SET ${setClause} WHERE ${conditionClause}`;
    await db.runAsync(query, values);
  } catch (error: any) {
    console.error("Failed to update message:", error);
    throw new Error("failed to update message: ", error);
  }
};

export const upsertConversation = async (conv: Conversation) => {
  const db = getDb();
  try {
    const {
      user_id,
      conversation_id,
      agent_id,
      agent_name,
      agent_avatar,
      avatar_last_update,
    } = conv;

    const query = `
      INSERT OR REPLACE INTO Conversations (
        conversation_id,
        user_id,
        agent_id,
        agent_name,
        agent_avatar,
        avatar_last_update
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      conversation_id,
      user_id,
      agent_id,
      agent_name,
      agent_avatar,
      avatar_last_update,
    ];

    await db.runAsync(query, values);
  } catch (error: any) {
    console.error("Failed to insert conversation:", error);
    throw new Error("failed to insert conversation: ", error);
  }
};

export const updateConversation = async (
  conversationId: string,
  updates: Partial<Conversation & { "unread_count+": string | number }>
) => {
  const db = getDb();
  try {
    const updateKeys = Object.keys(updates);
    if (updateKeys.length === 0) return;

    const setClause = updateKeys
      .map((key) => {
        if (key === "unread_count+") {
          return `${key.slice(0, -1)} = ${key.slice(0, -1)} + ?`;
        }
        return `${key} = ?`;
      })
      .join(", ");
    const values = updateKeys.map((key) => (updates as any)[key]);

    const query = `
        UPDATE Conversations
        SET ${setClause}
        WHERE conversation_id = ?
      `;

    await db.runAsync(query, [...values, conversationId]);
  } catch (error) {
    console.error("Failed to update conversation:", error);
  }
};

export const getMessagesByConversation = async ({
  conversationId,
  range,
}: {
  conversationId: string;
  range: [number, number]; // more accurate typing
}): Promise<Array<RawMessage>> => {
  try {
    if (!conversationId) return [];

    const db = getDb();

    const limit = range[1] - range[0];
    const offset = range[0];

    const messages = await db.getAllAsync<RawMessage>(
      `
      SELECT * FROM Messages
      WHERE conversation_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ? OFFSET ?
      `,
      [conversationId, limit, offset]
    );

    return messages;
  } catch (error) {
    console.error("Failed to get messages:", error);
    return [];
  }
};

export const getConversation = async <T>(
  column: Array<string>,
  comparisionClaus?: Record<string, string>,
  conditionSeperator: string = "AND"
): Promise<T[] | []> => {
  try {
    if (column.length === 0) return [];
    let query = "";
    let values: any = [];
    const db = getDb();
    const col = column.join(", ");

    if (comparisionClaus) {
      const setClause = Object.keys(comparisionClaus)
        .map((item) => `${item} = ?`)
        .join(" " + conditionSeperator + " ");
      values = Object.values(comparisionClaus);
      query = `SELECT ${col} FROM Conversations WHERE ${setClause}`;
    } else {
      query = `SELECT ${col} FROM Conversations`;
    }

    const conversation = await db.getAllAsync<Record<string, string>>(
      query,
      values
    );

    return conversation as T[];
  } catch (error) {
    console.error("Failed to get conversation: ", error);
    return [];
  }
};

export const getMessage = async <T>(
  column: Array<string>,
  conditionOperator: Record<string, string>,
  comparisionClaus?: Record<string, string>,
  conditionSeperator: string = "AND"
): Promise<T[] | []> => {
  try {
    if (column.length === 0) return [];
    let query = "";
    let values: any = [];
    const db = getDb();
    const col = column.join(", ");

    if (comparisionClaus) {
      const setClause = Object.keys(comparisionClaus)
        .map((item) => `${item} ${conditionOperator[item]} ?`)
        .join(" " + conditionSeperator + " ");
      values = Object.values(comparisionClaus);
      query = `SELECT ${col} FROM Messages WHERE ${setClause}`;
    } else {
      query = `SELECT ${col} FROM Messages`;
    }

    const message = await db.getAllAsync<Record<string, string>>(query, values);

    return message as T[];
  } catch (error) {
    console.error("Failed to get Message: ", error);
    return [];
  }
};

export async function markConversationRead(
  conversationId: string,
  isoTime: string
) {
  try {
    const db = getDb();
    await db.runAsync(
      `insert into read_state (conversation_id, last_read_at) values (?, ?) on conflict(conversation_id) do update set last_read_at=excluded.last_read_at;`,
      [conversationId, isoTime]
    );
  } catch (error: any) {
    console.error("Failed to mark conversation read: ", error);
    throw new Error("Failed to mark conversation read:", error);
  }
}

export const deleteMessage = async (messageId: string) => {
  try {
    const db = getDb();

    await db.runAsync(`DELETE FROM Messages WHERE id = ?`, [messageId]);
  } catch (error) {
    console.error("Failed to delete message:", error);
  }
};

export async function messageExists(
  serverId?: string | null,
  localId?: string | null
) {
  try {
    const db = getDb();
    if (serverId) {
      const res = await db.getAllAsync(
        `select 1 from Messages where server_id=? limit 1;`,
        [serverId]
      );
      return res.length > 0;
    }
    if (localId) {
      const res = await db.getAllAsync(
        `select 1 from Messages where local_id=? limit 1;`,
        [localId]
      );
      return res.length > 0;
    }
    return false;
  } catch (error: any) {
    console.error("Failed to check message exists:", error);
    throw new Error("Failed to check message exists:", error);
  }
}

export async function markMessageSyncedByLocalId(
  localId: string,
  serverId?: string
) {
  const db = getDb();
  try {
    if (serverId) {
      await db.runAsync(
        `update Messages set server_id=?, pending=0, status='sent' where local_id=?;`,
        [serverId, localId]
      );
    } else {
      await db.runAsync(
        `update Messages set pending=0, status='sent' where local_id=?;`,
        [localId]
      );
    }
  } catch (error) {
    console.error("Failed to mark message synced:", error);
  }
}

export async function markMessagePendingClearedByCreatedAt(
  conversationId: string,
  localId: string
) {
  const db = getDb();
  try {
    await db.runAsync(
      `update Messages set pending=0, status='sent' where conversation_id=? and local_id=? and sender_role='user';`,
      [conversationId, localId]
    );
  } catch (error) {
    console.error(
      "Failed to mark messsage pending cleared by created at:",
      error
    );
  }
}

export async function markMessagePendingByLocalId(
  localId: string,
  pending: 0 | 1,
  status: string
) {
  const db = getDb();
  try {
    await db.runAsync(
      `update Messages set pending=?, status=? where local_id=?;`,
      [pending, status, localId]
    );
  } catch (error) {
    console.error(
      "Failed to mark messsage pending cleared by local id:",
      error
    );
  }
}

export async function getPendingMessages(): Promise<RawMessage[] | null> {
  const db = getDb();
  try {
    const res = await db.getAllAsync(
      `select * from Messages where pending=1 order by created_at asc;`
    );
    return res as RawMessage[];
  } catch (error) {
    console.error(
      "Failed to mark messsage pending cleared by local id:",
      error
    );
    return null;
  }
}

export async function getLastKnownMessageTime(
  conversationId: string
): Promise<string | null> {
  const db = getDb();
  try {
    const res = await db.getAllAsync(
      `select max(inserted_at) as t from Messages where conversation_id=?;`,
      [conversationId]
    );
    const rows = res as { t: string }[];
    return rows[0]?.t ?? null;
  } catch (error) {
    console.error(
      "Failed to mark Messsage pending cleared by local id:",
      error
    );
    return null;
  }
}

export async function getLastReadMessageTime(
  conversation_id: string
): Promise<string | null> {
  const db = getDb();
  try {
    const res = await db.getAllAsync(
      `
      select last_read_at from read_state where conversation_id=?;
    `,
      [conversation_id]
    );
    const rows = res as { last_read_at: string }[];
    if (rows.length === 0) return null;
    return rows[0].last_read_at ?? null;
  } catch (error) {
    console.error("Failed to get last read message time: ", error);
    return null;
  }
}

export async function queuePendingStatusSync(
  conversation_id: string,
  local_id: string,
  status: string
) {
  const db = getDb();
  try {
    const query = `
      INSERT OR REPLACE INTO pending_status_syncs (
        local_id,
        conversation_id,
        status
      ) VALUES (?, ?, ?)
    `;
    db.runAsync(query, [local_id, conversation_id, status]);
  } catch (error) {
    console.error("Failed to queue pending status: ", error);
    throw error;
  }
}

export async function fetchQueuedPendingStatusSync(conversation_id: string) {
  const db = getDb();
  try {
    const res = await db.getAllAsync(
      `
      SELECT * FROM pending_status_syncs WHERE conversation_id=?;
    `,
      [conversation_id]
    );
    const row = res as {
      local_id: string;
      conversation_id: string;
      status: string;
      ack_at: string;
    }[];

    return row;
  } catch (error) {
    console.error("Failed to fetch queued pending status: ", error);
    throw error;
  }
}

export async function deleteQueuedPendingStatus(conversation_id: string) {
  const db = getDb();
  try {
    const query = `
      DELETE FROM pending_status_syncs WHERE conversation_id=?
    `;

    db.runAsync(query, [conversation_id]);
  } catch (error) {
    console.error("Failed to delete queued pending status: ", error);
    throw error;
  }
}

export async function markMessageFileUploadedByLocalIdSql(
  local_id: string,
  file_bucket: string,
  file_path: string
) {
  const db = getDb();
  try {
    const query = `UPDATE messages SET file_bucket = ?, file_path = ?, upload_status = 'uploaded', updated_at = CURRENT_TIMESTAMP WHERE local_id = ?`;
    await db.runAsync(query, [file_bucket, file_path, local_id]);
  } catch (error) {}
}

export async function markMessageSyncedByLocalIdSql(
  local_id: string,
  server_id: string
) {
  const db = getDb();
  try {
    const query = `UPDATE messages SET server_id = ?, pending = 0, status = 'sent', updated_at = datetime('now') WHERE local_id = ?`;
    await db.runAsync(query, [server_id, local_id]);
  } catch (error) {}
}
