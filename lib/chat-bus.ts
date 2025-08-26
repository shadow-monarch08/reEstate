import EventEmitter from "eventemitter3";
import {
  insertLocalMessage,
  getPendingMessages,
  markMessageSyncedByLocalId,
  messageExists,
  getLastKnownMessageTime,
  markMessagePendingByLocalId,
  markMessagePendingClearedByCreatedAt,
  LocalMessage,
  markConversationRead,
  getConversation,
  updateMessage,
  getMessage,
  getLastReadMessageTime,
  queuePendingStatusSync,
  fetchQueuedPendingStatusSync,
  deleteQueuedPendingStatus,
} from "./database/localStore";
import { Supabase } from "./supabase";
import {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";

// envelope types
export type BroadcastMessagePayload = {
  __type: "message";
  conversation_id: string;
  local_id: string; // sender's local UUID
  server_id?: string | null; // optional reference from server
  sender_id: string;
  receiver_id: string;
  content_type: string;
  sender_role: "user" | "agent";
  body: string;
  created_at: string; // ISO
};

export type PostgrestChangesMessagePayload = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  iv: string | null;
  created_at: string;
  status: string;
  local_id: string;
  content_type: string;
  sender_role: "user" | "agent";
};

export type BroadcastAckPayload = {
  __type: "ack";
  conversation_id: string;
  local_id: string;
  server_id?: string | null;
  sender_id: string; // ack sender (the device that received original message)
  acked_at: string; // ISO
  status: string;
};

export type AcknoledgmentAckPayload = {
  __type: "ack-2";
  conversation_id: string;
  local_id: string;
};

export class ChatBus extends EventEmitter {
  private globalChannel: RealtimeChannel | null = null; // inbox:user:{uid}
  private uid: string | null = null;
  private activeCId: string | null = null;
  private started = false;
  private ACK_TIMEOUT = 1000; // ms to wait for ack before fallback to server write

  async start(userId: string, activeConversationId: string | null) {
    if (this.started) return;
    this.started = true;
    this.uid = userId;
    this.activeCId = activeConversationId;

    // Subscribe to user's global inbox channel
    const channelName = `inbox:user:${userId}`;
    this.globalChannel = Supabase.channel(channelName, {
      config: { broadcast: { ack: true } },
    });

    // handle incoming messages
    this.globalChannel.on("broadcast", { event: "message" }, (e: any) => {
      const payload = e.payload as
        | BroadcastMessagePayload
        | BroadcastAckPayload
        | AcknoledgmentAckPayload;
      this._handleBroadcastPayload(payload).catch((err) =>
        console.error("handle broadcast err", err)
      );
    });
    this.globalChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${userId}`,
      },
      (e: RealtimePostgresInsertPayload<PostgrestChangesMessagePayload>) => {
        const payload = e.new;
        this._onPostgrestChangeMessage(payload);
      }
    );

    this.globalChannel.subscribe();

    // await this.syncMessageStatus();
    // initial sync from server (conversations + messages)
    await this.syncAll();

    // flush any pending messages that might exist locally
    await this.flushPendingToServer();
  }

  stop() {
    if (this.globalChannel) Supabase.removeChannel(this.globalChannel);
    this.globalChannel = null;
    this.started = false;
  }

  private async _createAckPromise(
    local_id: string,
    eventName: string = "acknowledgment:ack"
  ): Promise<{ success: boolean }> {
    return new Promise<{ success: boolean }>((resolve) => {
      const handler = (ack: AcknoledgmentAckPayload) => {
        if (ack.local_id === local_id) {
          this.off(eventName, handler as any);
          resolve({ success: true });
        }
      };

      this.on(eventName, handler as any);

      // timeout fallback
      setTimeout(() => {
        this.off(eventName, handler as any);
        resolve({ success: false });
      }, this.ACK_TIMEOUT);
    });
  }

  private async _handleBroadcastPayload(payload: any) {
    if (!payload || !payload.type) return;
    if (payload.type === "message") {
      await this._onIncomingMessage(payload as BroadcastMessagePayload);
    } else if (payload.type === "ack" || "ack-2") {
      await this._onAck(
        payload as BroadcastAckPayload | AcknoledgmentAckPayload
      );
    }
  }

  private async _onPostgrestChangeMessage(p: PostgrestChangesMessagePayload) {
    // dedupe: if this message already exists (by server_id or local_id), skip
    const exists = await messageExists(p.id ?? null, p.local_id);
    if (exists) return;

    await insertLocalMessage({
      server_id: p.id ?? null,
      local_id: p.local_id,
      conversation_id: p.conversation_id,
      sender_role: p.sender_role,
      sender_id: p.sender_id,
      receiver_id: p.receiver_id,
      body: p.body,
      content_type: p.content_type,
      created_at: p.created_at,
      pending: 0,
      status: "sent",
    });

    if (p.conversation_id === this.activeCId) {
      await markConversationRead(p.conversation_id, new Date().toISOString());
    }

    // optional: if we received this message and it's from agent to user, send ack back to sender
    if (p.sender_role === "agent") {
      const ack: BroadcastAckPayload = {
        __type: "ack",
        conversation_id: p.conversation_id,
        local_id: p.local_id,
        server_id: p.id ?? null,
        sender_id: this.uid!,
        acked_at: new Date().toISOString(),
        status:
          this.activeCId ?? "" === p.conversation_id ? "read" : "received",
      };
      try {
        // send ack to sender's global channel (sender_id is the user's id when agent sent, or vice versa)
        Supabase.channel(`inbox:agent:${p.sender_id}`).send({
          type: "broadcast",
          event: "message",
          payload: ack,
        });
        const ackResult = await this._createAckPromise(p.local_id);
        if (!ackResult.success) {
          const { data, error } = await Supabase.from(
            "pending_status_sync"
          ).insert([
            {
              local_id: p.local_id,
              conversation_id: p.conversation_id,
              ack_role: "user",
              status:
                this.activeCId === p.conversation_id ? "read" : "received",
            },
          ]);
          if (error)
            console.error(
              "Error while sycing status to server via postgrest change message: ",
              error
            );
          await queuePendingStatusSync(
            p.conversation_id,
            p.local_id,
            this.activeCId === p.conversation_id ? "read" : "received"
          );
        }
      } catch (e) {
        // ignore ack failures - it's best-effort
        console.warn("failed to send ack", e);
      }
    }

    // emit incoming event for UIs
    this.emit("message:incoming", p);
  }

  private async _onIncomingMessage(p: BroadcastMessagePayload) {
    // dedupe: if this message already exists (by server_id or local_id), skip
    const exists = await messageExists(p.server_id ?? null, p.local_id);
    if (exists) return;

    // insert local message
    await insertLocalMessage({
      server_id: p.server_id ?? null,
      local_id: p.local_id,
      conversation_id: p.conversation_id,
      sender_role: p.sender_role,
      sender_id: p.sender_id,
      receiver_id: p.receiver_id,
      body: p.body,
      content_type: p.content_type,
      created_at: p.created_at,
      pending: 0,
      status: "sent",
    });
    // emit incoming event for UIs
    this.emit("message:incoming", p);
    if (p.conversation_id === this.activeCId) {
      await markConversationRead(p.conversation_id, new Date().toISOString());
    }

    // optional: if we received this message and it's from agent to user, send ack back to sender
    if (p.sender_role === "agent") {
      const ack: BroadcastAckPayload = {
        __type: "ack",
        conversation_id: p.conversation_id,
        local_id: p.local_id,
        server_id: p.server_id ?? null,
        sender_id: this.uid!,
        acked_at: new Date().toISOString(),
        status: this.activeCId === p.conversation_id ? "read" : "received",
      };
      try {
        // send ack to sender's global channel (sender_id is the user's id when agent sent, or vice versa)
        Supabase.channel(`inbox:agent:${p.sender_id}`).send({
          type: "broadcast",
          event: "message",
          payload: ack,
        });

        const ackResult = await this._createAckPromise(p.local_id);
        if (!ackResult.success) {
          const { data, error } = await Supabase.from(
            "pending_status_sync"
          ).insert([
            {
              local_id: p.local_id,
              conversation_id: p.conversation_id,
              ack_role: "user",
              status:
                this.activeCId === p.conversation_id ? "read" : "received",
            },
          ]);
          if (error)
            console.error(
              "Error while sycing status to server via on incoming message: ",
              error
            );
          await queuePendingStatusSync(
            p.conversation_id,
            p.local_id,
            this.activeCId === p.conversation_id ? "read" : "received"
          );
        }
      } catch (e) {
        // ignore ack failures - it's best-effort
        console.warn("failed to send ack", e);
      }
    }
  }

  private async _onAck(p: BroadcastAckPayload | AcknoledgmentAckPayload) {
    // An ack for a previously sent message. If it contains server_id we can mark local message synced.
    if (!p.local_id) return;
    // mark pending cleared locally
    if (p.__type === "ack") {
      await markMessagePendingByLocalId(p.local_id, 0);
      this.emit("message:ack", p);
    } else {
      this.emit("acknowledgment:ack", p);
    }
  }

  // Send message: optimistic local insert + broadcast to agent inbox + wait for ack -> fallback to server write
  async sendMessage(message: LocalMessage) {
    if (!this.uid) throw new Error("not started");

    // 1) insert locally as pending
    await insertLocalMessage({
      conversation_id: message.conversation_id,
      local_id: message.local_id,
      server_id: null,
      sender_id: this.uid,
      receiver_id: message.receiver_id,
      sender_role: "user",
      body: message.body,
      created_at: message.created_at,
      pending: 1,
      content_type: message.content_type,
      status: message.status,
    });

    // 2) broadcast to agent's inbox
    const payload: BroadcastMessagePayload = {
      __type: "message",
      conversation_id: message.conversation_id,
      local_id: message.local_id,
      server_id: null,
      sender_id: this.uid,
      receiver_id: message.receiver_id,
      sender_role: "user",
      body: message.body,
      created_at: message.created_at,
      content_type: message.content_type,
    };

    try {
      await Supabase.channel(`inbox:agent:${message.receiver_id}`).send({
        type: "broadcast",
        event: "message",
        payload,
      });
    } catch (e) {
      // Network might be down or channel missing; we'll rely on fallback flush
      console.warn(
        "broadcast send failed, will fallback to server on timeout",
        e
      );
    }

    // 3) wait for ACK on global channel with timeout
    const ackPromise = new Promise<{ success: boolean }>((resolve) => {
      const handler = (ack: BroadcastAckPayload) => {
        if (ack.local_id === message.local_id) {
          this.off("message:ack", handler as any);
          resolve({ success: true });
        }
      };
      this.on("message:ack", handler as any);

      // timeout
      setTimeout(() => {
        this.off("message:ack", handler as any);
        resolve({ success: false });
      }, this.ACK_TIMEOUT);
    });

    const ackResult = await ackPromise;

    if (ackResult.success) {
      // ack included server id -> mark local message synced
      const ack: AcknoledgmentAckPayload = {
        __type: "ack-2",
        local_id: message.local_id,
        conversation_id: message.conversation_id,
      };
      await Supabase.channel(`inbox:agent:${message.receiver_id}`).send({
        type: "broadcast",
        event: "message",
        payload: ack,
      });
      await markMessageSyncedByLocalId(message.local_id);
      return;
    }

    // No ack -> attempt to persist to server via HTTP
    try {
      const { data, error } = await Supabase.from("messages")
        .insert([
          {
            conversation_id: message.conversation_id,
            local_id: message.local_id,
            sender_id: this.uid,
            receiver_id: message.receiver_id,
            sender_role: "user",
            body: message.body,
            created_at: message.created_at,
            content_type: message.content_type,
          },
        ])
        .select("id");
      if (error) throw error;
      const server_id = data && data[0] && data[0].id ? data[0].id : undefined;
      if (server_id) {
        await markMessageSyncedByLocalId(message.local_id, server_id);
        this.emit("message:ack", {
          conversation_id: message.conversation_id,
          local_id: message.local_id,
          status: "sent",
        });
      }
    } catch (e) {
      console.warn("fallback server persist failed, message stays pending", e);
      // leave pending = 1 and it will be flushed by flushPendingToServer later
    }
  }

  // find pending local messages and push them to server (called on network regain or periodically)
  async flushPendingToServer() {
    if (!this.uid) return;
    const pending = await getPendingMessages();
    if (!pending?.length) return;

    // group by conversation for convenience
    const rows = pending.map((p) => ({
      conversation_id: p.conversation_id,
      sender_role: "user",
      sender_id: this.uid!,
      receiver_id: p.receiver_id,
      body: p.body,
      status: p.status,
      content_type: p.content_type,
      created_at: p.created_at,
      local_id: p.local_id ?? null,
    }));

    // batch insert (NOTE: if you have large batches, consider chunking)
    try {
      const { data, error } = await Supabase.from("messages")
        .insert(rows)
        .select("id, conversation_id, local_id");
      if (error) throw error;

      // match server-inserted rows to local pending rows by conversation + created_at
      for (const ok of data ?? []) {
        // mark local pending cleared for matching created_at & conversation
        await markMessagePendingClearedByCreatedAt(
          ok.conversation_id,
          ok.local_id
        );
        this.emit("message:sync", {
          conversation_id: ok.conversation_id,
          local_id: ok.local_id,
        });
      }
    } catch (e) {
      console.warn("flushPendingToServer failed", e);
    }
  }

  async syncQueuedPendingStatus(
    conversation_id: string,
    localChannel: RealtimeChannel
  ) {
    const messages = await fetchQueuedPendingStatusSync(conversation_id);
    for (const m of messages) {
      const ack: BroadcastAckPayload = {
        __type: "ack",
        conversation_id: conversation_id,
        local_id: m.local_id,
        server_id: null,
        sender_id: this.uid!,
        acked_at: m.ack_at,
        status: m.status,
      };
      await localChannel?.send({
        type: "broadcast",
        event: "message",
        payload: ack,
      });

      const ackResult = await this._createAckPromise(m.local_id);
      if (!ackResult.success) {
        const { data, error } = await Supabase.from(
          "pending_status_sync"
        ).insert([
          {
            local_id: m.local_id,
            conversation_id: conversation_id,
            status: this.activeCId === conversation_id ? "read" : "received",
            ack_role: "user",
          },
        ]);
        if (!error) await deleteQueuedPendingStatus(conversation_id);
      }
    }
  }

  // Sync conversation messages from server since last-known time
  async syncConversationFromServer(
    conversation_id: string,
    localChannel: RealtimeChannel
  ) {
    const since = await getLastKnownMessageTime(conversation_id);
    let q = Supabase.from("messages")
      .select(
        "id, conversation_id, sender_role, sender_id, receiver_id, body, content_type, created_at, local_id"
      )
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });

    if (since) q = q.gt("created_at", since);
    const { data, error } = await q;

    if (error?.message) {
      console.warn("syncConversationFromServer error", error?.message);
      return;
    }

    console.log(data);

    for (const m of data ?? []) {
      const exists = await messageExists(m.id ?? null, null);
      if (exists) continue;
      await insertLocalMessage({
        local_id: m.local_id,
        server_id: m.id,
        conversation_id: m.conversation_id,
        sender_role: m.sender_role as "user" | "agent",
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
        body: m.body,
        content_type: m.content_type,
        created_at: m.created_at,
        pending: 0,
        status: "sent",
      });

      // emit event for UI
      this.emit("message:incoming", {
        local_id: m.local_id,
        conversation_id: m.conversation_id,
        sender_role: m.sender_role as "user" | "agent",
        body: m.body,
        content_type: m.content_type,
        created_at: m.created_at,
        status: "sent",
      });

      const ack: BroadcastAckPayload = {
        __type: "ack",
        conversation_id: conversation_id,
        local_id: m.local_id,
        server_id: m.id ?? null,
        sender_id: this.uid!,
        acked_at: new Date().toISOString(),
        status: this.activeCId === conversation_id ? "read" : "received",
      };
      await localChannel?.send({
        type: "broadcast",
        event: "message",
        payload: ack,
      });

      const ackResult = await this._createAckPromise(m.local_id);
      if (!ackResult.success) {
        const { data, error } = await Supabase.from(
          "pending_status_sync"
        ).insert([
          {
            local_id: m.local_id,
            conversation_id: conversation_id,
            status: this.activeCId === conversation_id ? "read" : "received",
            ack_role: "user",
          },
        ]);
        if (error)
          console.error(
            "Error while sycing status to server via on sync conversation from server: ",
            error
          );
        await queuePendingStatusSync(
          conversation_id,
          m.local_id,
          this.activeCId === conversation_id ? "read" : "received"
        );
      }
    }
  }

  async updatePendingStatus(conversation_id: string) {
    const { data, error } = await Supabase.from("pending_status_sync")
      .delete()
      .eq("conversation_id", conversation_id)
      .eq("ack_role", "agent")
      .select("*");
    let msgIds = [];
    if (error) console.error("Error while updating pending status: ", error);
    if (data) {
      for (const message of data) {
        msgIds.push({ local_id: message.local_id });
        await updateMessage({
          msg: {
            status: message.status,
          },
          checkCondition: {
            local_id: message.local_id,
          },
          conditionOperator: {
            local_id: "=",
          },
        });
      }
      if (msgIds.length > 0) {
        this.emit("status:sync", {
          conversation_id: conversation_id,
          status: data[0].status,
          messageIds: msgIds,
        });
      }
    }
  }

  // Pull all conversations and sync their messages (called at start or periodically)
  async syncAll() {
    // fetch convs for this user
    const { data: convs, error } = await Supabase.from("conversations")
      .select("id, user_id, agent_id, created_at")
      .eq("user_id", this.uid);
    if (error) {
      console.warn("syncAll: conv fetch failed", error);
      return;
    }
    let convList: string[] = [];
    const localChannel = Supabase.channel(`inbox:agent:${convs[0].agent_id}`, {
      config: { broadcast: { ack: true } },
    });
    for (const c of convs ?? []) {
      convList.push(c.id);
      await this.syncQueuedPendingStatus(c.id, localChannel);
      await this.updatePendingStatus(c.id);
      await this.syncConversationFromServer(c.id, localChannel);
    }

    Supabase.removeChannel(localChannel);

    this.emit("conversations:updated", convList);
  }

  // async syncMessageStatus() {
  //   const conversations = await getConversation<{ conversation_id: string }>([
  //     "conversation_id",
  //   ]);

  //   for (const conversation of conversations ?? []) {
  //     const { data, error } = await Supabase.from("last_message_status")
  //       .select("agent_last_message_time, agent_last_message_status")
  //       .eq("conversation_id", conversation.conversation_id);
  //     if (error) throw error;
  //     if (data && data[0].agent_last_message_status) {
  //       const message = await getMessage<{ local_id: string }>(
  //         ["local_id"],
  //         {
  //           status: data[0].agent_last_message_status === "read" ? "<>" : "=",
  //           conversation_id: "=",
  //           created_at: "<",
  //         },
  //         {
  //           status:
  //             data[0].agent_last_message_status === "read" ? "read" : "sent",
  //           conversation_id: conversation.conversation_id,
  //           created_at: data[0].agent_last_message_time,
  //         }
  //       );
  //       await updateMessage({
  //         msg: {
  //           status: data[0].agent_last_message_status,
  //         },
  //         checkCondition: {
  //           created_at: data[0].agent_last_message_time,
  //           status: "read",
  //         },
  //         conditionSeperator: "AND",
  //         conditionOperator: {
  //           created_at: "<",
  //           status: "<>",
  //         },
  //       });
  //       if (message.length > 0) {
  //         this.emit("status:sync", {
  //           conversation_id: conversation.conversation_id,
  //           status: data[0].agent_last_message_status,
  //           messageIds: message,
  //         });
  //       }
  //     }
  //   }
  // }

  updateActiveConversationId(conversation_id: string | null) {
    this.activeCId = conversation_id;
  }

  async syncReadStatus(conversation_id: string, agent_id: string) {
    try {
      if (!this.uid) return;
      const last_read_at = await getLastReadMessageTime(conversation_id);
      if (last_read_at) {
        const unread_agent_messages = await getMessage<{
          local_id: string;
          server_id: string;
        }>(
          ["local_id", "server_id"],
          {
            sender_role: "=",
            conversation_id: "=",
            created_at: ">",
          },
          {
            sender_role: "agent",
            conversation_id: conversation_id,
            created_at: last_read_at,
          }
        );
        const localChannel = Supabase.channel(`inbox:agent:${agent_id}`, {
          config: { broadcast: { ack: true } },
        });
        for (const message of unread_agent_messages) {
          const ack: BroadcastAckPayload = {
            __type: "ack",
            local_id: message.local_id,
            server_id: message.server_id ?? null,
            sender_id: this.uid,
            acked_at: new Date().toISOString(),
            conversation_id,
            status: "read",
          };
          localChannel.send({
            type: "broadcast",
            event: "message",
            payload: ack,
          });

          const ackResult = await this._createAckPromise(message.local_id);
          if (!ackResult.success) {
            const { data, error } = await Supabase.from(
              "pending_status_sync"
            ).insert([
              {
                local_id: message.local_id,
                conversation_id: conversation_id,
                status: "read",
                ack_role: "user",
              },
            ]);
            if (error)
              console.error(
                "Error while sycing status to server via on sync read status: ",
                error
              );
            await queuePendingStatusSync(
              conversation_id,
              message.local_id,
              "read"
            );
          }
        }
      }
    } catch (error) {
      console.error("error while syncing read status: ", error);
    }
  }
}

export const chatBus = new ChatBus();
