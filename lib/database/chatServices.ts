import {
  ConversationOverviewReturnType,
  Conversation,
  Message,
} from "../supabase";
import { getDb } from "./db";

export const getAllConversationOverviews = async ({
  range,
}: {
  range: Array<number | number>;
}): Promise<Array<ConversationOverviewReturnType>> => {
  const offset = range[0];
  const limit = range[1] - range[0];
  const db = getDb();

  // Step 1: Get latest messages per conversation and join with Conversation table
  const convResult: Array<
    Conversation & {
      latest_message_time: string;
    }
  > = await db.getAllAsync(
    `
    SELECT 
      c.*,
      MAX(m.created_at) as latest_message_time
    FROM Conversation c
    LEFT JOIN Message m ON c.conversation_id = m.conversation_id
    GROUP BY c.conversation_id
    ORDER BY latest_message_time DESC
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );

  const overviews: Array<ConversationOverviewReturnType> = [];

  for (const conv of convResult) {
    // Step 2: Get latest message for this conversation
    const msgResult: Message[] = await db.getAllAsync(
      `SELECT * FROM Message WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
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
      last_message: latestMessage?.message ?? null,
      last_file: latestMessage?.file ?? null,
      last_property_ref: latestMessage?.property_ref ?? null,
      last_message_time: latestMessage?.created_at ?? null,
      last_message_status: latestMessage?.status ?? null,
      last_message_sender_id: latestMessage?.sender_id ?? null,
      unread_count: conv.unread_count ?? 0,
    });
  }

  return overviews;
};

export const getConversationOverview = async (
  conversationId: string
): Promise<Array<ConversationOverviewReturnType>> => {
  // Step 1: Get paginated conversations sorted by last_message (DESC)
  const db = getDb();
  const convResult: Conversation[] = await db.getAllAsync(
    `SELECT * FROM Conversation WHERE conversation_id = ?`,
    [conversationId]
  );
  const overviews: Array<ConversationOverviewReturnType> = [];

  const msgResult: Message[] = await db.getAllAsync(
    `SELECT * FROM Message WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
    [conversationId]
  );

  const latestMessage = msgResult?.[0] ?? null;

  // Step 3: Push overview
  overviews.push({
    conversation_id: convResult[0].conversation_id,
    agent_id: convResult[0].agent_id,
    agent_name: convResult[0].agent_name,
    agent_avatar: convResult[0].agent_avatar,
    avatar_last_update: convResult[0].avatar_last_update,
    last_message: latestMessage?.message ?? null,
    last_file: latestMessage?.file ?? null,
    last_property_ref: latestMessage?.property_ref ?? null,
    last_message_time: latestMessage?.created_at ?? null,
    last_message_status: latestMessage?.status ?? null,
    last_message_sender_id: latestMessage?.sender_id ?? null,
    unread_count: convResult[0].unread_count ?? 0,
  });

  return overviews;
};

export const insertMessages = async (msg: Array<Message>) => {
  const db = getDb();
  try {
    await db?.execAsync("BEGIN TRANSACTION");
    let insertQuery = `
    INSERT OR REPLACE INTO Message (
      id,
      message,
      conversation_id,
      sender_id,
      receiver_id,
      file,
      property_ref,
      created_at,
      status
    ) VALUES `;

    let valueList: string[] = [];
    let placeholderList: string[] = [];

    msg.forEach((element) => {
      let values = [
        element.id,
        element.message,
        element.conversation_id,
        element.sender_id,
        element.receiver_id,
        JSON.stringify(element.file),
        JSON.stringify(element.property_ref),
        element.created_at,
        element.status,
      ] as string[];
      valueList = valueList.concat(values);
      placeholderList.push("(?, ?, ?, ?, ?, ?, ?, ?, ?)");
    });

    insertQuery = insertQuery + placeholderList.join(", ");
    await db?.runAsync(insertQuery, valueList);

    await db?.execAsync("COMMIT");
  } catch (error) {
    console.error("Failed to insert message:", error);
    await db?.execAsync("ROLLBACK"); // Revert changes if there's an error
  }
};

export const updateMessage = async ({
  msg,
  checkCondition,
  conditionSeperator,
  conditionOperator,
}: {
  msg: Record<string, any>;
  checkCondition: Record<string, any>;
  conditionSeperator?: string;
  conditionOperator: Record<string, string>;
}) => {
  const db = getDb();
  try {
    await db?.execAsync("BEGIN TRANSACTION");
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
    const query = `UPDATE Message SET ${setClause} WHERE ${conditionClause}`;
    await db.runAsync(query, values);
    await db?.execAsync("COMMIT");
  } catch (error) {
    console.error("Failed to update message:", error);
    await db?.execAsync("ROLLBACK"); // Revert changes if there's an error
  }
};

export const insertConversation = async (conv: Conversation) => {
  const db = getDb();
  try {
    await db?.execAsync("BEGIN TRANSACTION");
    const {
      conversation_id,
      agent_id,
      agent_name,
      agent_avatar,
      avatar_last_update,
      unread_count,
    } = conv;

    const query = `
      INSERT OR REPLACE INTO Conversation (
        conversation_id,
        agent_id,
        agent_name,
        agent_avatar,
        avatar_last_update,
        unread_count
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      conversation_id,
      agent_id,
      agent_name,
      agent_avatar,
      avatar_last_update,
      unread_count ?? 0,
    ];

    await db.runAsync(query, values);
    await db?.execAsync("COMMIT");
  } catch (error) {
    console.error("Failed to insert conversation:", error);
    await db?.execAsync("ROLLBACK"); // Revert changes if there's an error
  }
};

export const updateConversation = async (
  conversationId: string,
  updates: Partial<Conversation & { "unread_count+": string | number }>
) => {
  const db = getDb();
  try {
    await db?.execAsync("BEGIN TRANSACTION");
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
        UPDATE Conversation
        SET ${setClause}
        WHERE conversation_id = ?
      `;

    await db.runAsync(query, [...values, conversationId]);
    await db?.execAsync("COMMIT");
  } catch (error) {
    console.error("Failed to update conversation:", error);
    await db?.execAsync("ROLLBACK");
  }
};

export const getMessagesByConversation = async ({
  conversationId,
  range,
}: {
  conversationId: string | undefined;
  range: [number, number]; // more accurate typing
}): Promise<Array<Message>> => {
  try {
    if (!conversationId) return [];

    const db = getDb();

    const limit = range[1] - range[0];
    const offset = range[0];

    const messages = await db.getAllAsync<Message>(
      `
      SELECT * FROM Message
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

export const getConversationByAgent = async (
  agentId: string
): Promise<Record<string, string>[] | []> => {
  try {
    if (!agentId) return [];

    const db = getDb();

    const conversation = await db.getAllAsync<Record<string, string>>(
      "SELECT conversation_id FROM Conversation WHERE agent_id = ?",
      [agentId]
    );

    return conversation;
  } catch (error) {
    console.error("Failed to get conversation: ", error);
    return [];
  }
};

export const getConversation = async (
  column: Array<string>,
  comparisionClaus: Record<string, string>,
  conditionSeperator: string
): Promise<Record<string, string>[] | []> => {
  try {
    if (column.length === 0) return [];

    const db = getDb();

    const col = column.join(", ");
    const setClause = Object.keys(comparisionClaus)
      .map((item) => `${item} = ?`)
      .join(" " + conditionSeperator + " ");
    const values = Object.values(comparisionClaus);

    const query = `SELECT ${col} FROM Conversation WHERE ${setClause}`;

    const conversation = await db.getAllAsync<Record<string, string>>(
      query,
      values
    );

    return conversation;
  } catch (error) {
    console.error("Failed to get conversation: ", error);
    return [];
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    const db = getDb();

    await db.runAsync(`DELETE FROM Message WHERE id = ?`, [messageId]);
  } catch (error) {
    console.error("Failed to delete message:", error);
  }
};
