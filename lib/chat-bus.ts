import { RealtimeChannel } from "@supabase/supabase-js";
import EventEmitter from "eventemitter3";
import Constants from "expo-constants";
import {
  deleteQueuedPendingStatus,
  fetchQueuedPendingStatusSync,
  getLastKnownMessageTime,
  getLastReadMessageTime,
  getMessage,
  getPendingMessages,
  insertLocalMessage,
  markConversationRead,
  markMessagePendingByLocalId,
  markMessageSyncedByLocalId,
  messageExists,
  queuePendingStatusSync,
  updateMessage,
} from "./database/localStore";
import { Supabase } from "./supabase";
// Add or replace this method inside your ChatBus class
import * as tus from "tus-js-client";
import { MediaManager } from "./mediaManager";
import { RawMessage } from "@/types/domain/chat";
import { LocalMessage } from "@/types/api/localDatabase";
// envelope types
export type BroadcastMessagePayload = {
  __type: "message";
  conversation_id: string;
  local_id: string; // sender's local UUID
  server_id?: string | null; // optional reference from server
  sender_id: string;
  receiver_id: string;
  content_type: "text" | "image" | "doc";
  sender_role: "user" | "agent";
  body: string | null;
  created_at: string; // ISO
  // file metadata (kept in local sqlite)
  storage_path?: string | null; // key/path in Supabase storage
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  img_height?: number | null;
  img_width?: number | null;
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
  // file metadata (kept in local sqlite)
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string | null;
};

export type BroadcastAckPayload = {
  __type: "ack-1" | "ack-2";
  conversation_id: string;
  local_id: string;
  server_id?: string | null;
  sender_id: string; // ack sender (the device that received original message)
  acked_at: string; // ISO
  status: string;
};

export type AcknoledgmentAckPayload = {
  __type: "ack-3";
  conversation_id: string;
  local_id: string;
};

export class ChatBus extends EventEmitter {
  private globalChannel: RealtimeChannel | null = null; // inbox:user:{uid}
  private uid: string | null = null;
  private activeCId: string | null = null;
  private started = false;
  private ACK_TIMEOUT = 2000; // ms to wait for ack before fallback to server write
  private activeUploads: Map<string, tus.Upload> = new Map(); // Key: localId, Value: TUS Upload instance

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

  async cancelUpload({ local_id }: { local_id: string }) {
    console.log(`Received cancel request for upload: ${local_id}`);
    const uploadToCancel = this.activeUploads.get(local_id);

    if (uploadToCancel) {
      uploadToCancel.abort(); // Abort the upload
      await updateMessage({
        msg: {
          upload_status: "failed",
          storage_path: null,
        },
        checkCondition: { local_id: local_id },
        conditionOperator: { local_id: "=" },
      });

      this.emit("upload:progress", {
        local_id: local_id,
        upload_progress: -1,
      });
      // The onError handler in sendFileMessage will handle cleanup.
    }
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
    if (!payload || !payload.__type) return;
    if (payload.__type === "message") {
      await this._onIncomingMessage(payload as BroadcastMessagePayload);
    } else if (["ack-1", "ack-3", "ack-2"].includes(payload.__type)) {
      await this._onAck(
        payload as BroadcastAckPayload | AcknoledgmentAckPayload
      );
    }
  }

  private async _onIncomingMessage(p: BroadcastMessagePayload) {
    // dedupe: if this message already exists (by server_id or local_id), skip
    const exists = await messageExists(p.server_id ?? null, p.local_id);
    if (exists) return;

    // insert local message
    const msg: LocalMessage = {
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
      file_name: p.file_name ?? null,
      mime_type: p.mime_type ?? null,
      file_size: p.file_size ?? null,
      device_path: null,
      storage_path: p.storage_path ?? null,
      img_height: p.img_height ?? null,
      img_width: p.img_width ?? null,
      upload_status: "failed",
    };

    await insertLocalMessage(msg);

    // emit incoming event for UIs
    this.emit("message:incoming", msg);
    if (p.conversation_id === this.activeCId) {
      await markConversationRead(p.conversation_id, new Date().toISOString());
    }

    // optional: if we received this message and it's from agent to user, send ack back to sender
    if (p.sender_role === "agent") {
      const ack: BroadcastAckPayload = {
        __type: "ack-1",
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
          ).upsert([
            {
              local_id: p.local_id,
              conversation_id: p.conversation_id,
              ack_role: "user",
              status:
                this.activeCId === p.conversation_id ? "read" : "received",
            },
          ]);
          if (error) {
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
    if (p.__type === "ack-1") {
      this.emit("message:ack", p);
      await markMessagePendingByLocalId(p.local_id, 0, p.status);
    } else if (p.__type === "ack-2") {
      this._onIncomingAck(p);
    } else {
      this.emit("acknowledgment:ack", p);
    }
  }

  private async _onIncomingAck(p: BroadcastAckPayload) {
    if (!this.uid) return;

    await updateMessage({
      msg: {
        status: p.status,
      },
      checkCondition: {
        local_id: p.local_id,
      },
      conditionOperator: {
        local_id: "=",
      },
    });

    this.emit("message:ack", p);

    try {
      const ack: AcknoledgmentAckPayload = {
        __type: "ack-3",
        local_id: p.local_id,
        conversation_id: p.conversation_id,
      };
      await Supabase.channel(`inbox:agent:${p.sender_id}`).send({
        type: "broadcast",
        event: "message",
        payload: ack,
      });
    } catch (e) {
      // Network might be down or channel missing; we'll rely on fallback flush
      console.warn("acknowledgment ack failed: ", e);
    }
  }

  // Send message: optimistic local insert + broadcast to agent inbox + wait for ack -> fallback to server write
  async sendMessage(message: LocalMessage, skipLocalInsert: boolean) {
    if (!this.uid) throw new Error("not started");
    // 1) insert locally as pending
    // const {
    //   data: { session },
    // } = await Supabase.auth.getSession();
    // if (!session) throw new Error("User not authenticated");
    // const token = session.access_token;
    // console.log(token);
    if (!skipLocalInsert) {
      this.emit("message:outgoing", {
        conversation_id: message.conversation_id,
        local_id: message.local_id,
        sender_role: "user",
        body: message.body,
        created_at: message.created_at,
        content_type: message.content_type,
        status: message.status,
        sender_id: this.uid,
        receiver_id: message.receiver_id,
      });
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
    }

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
      file_name: message.file_name ?? null,
      file_size: message.file_size ?? null,
      mime_type: message.mime_type ?? null,
      img_height: message.img_height ?? null,
      img_width: message.img_width ?? null,
      storage_path: message.storage_path ?? null,
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

    const ackResult = await this._createAckPromise(
      message.local_id,
      "message:ack"
    );

    if (ackResult.success) {
      // ack included server id -> mark local message synced
      const ack: AcknoledgmentAckPayload = {
        __type: "ack-3",
        local_id: message.local_id,
        conversation_id: message.conversation_id,
      };
      await Supabase.channel(`inbox:agent:${message.receiver_id}`).send({
        type: "broadcast",
        event: "message",
        payload: ack,
      });
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
            file_name: message.file_name ?? null,
            file_size: message.file_size ?? null,
            mime_type: message.mime_type ?? null,
            img_height: message.img_height ?? null,
            img_width: message.img_width ?? null,
            storage_path: message.storage_path ?? null,
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

  /**
   * Handles the complete lifecycle of sending a file message using the TUS protocol.
   * This provides resumable uploads and real-time progress.
   *
   * 1. Creates an optimistic local message placeholder.
   * 2. Uploads the file to Supabase Storage using tus-js-client.
   * 3. On success, updates the local message and sends a real message payload.
   * 4. On failure, updates the local message to indicate an error.
   *
   * @param asset The File object to upload.
   * @param message The base message object (contains conversation_id, receiver_id, etc.).
   * @param onProgress A callback function to report upload progress (0 to 100).
   */
  async sendFileMessage(
    message: LocalMessage,
    skipLocalInsert?: boolean
  ): Promise<void> {
    if (!this.uid) throw new Error("ChatBus not started");

    // Step 1: Optimistic local insert.
    // The UI can immediately render this message as "uploading...".
    if (!skipLocalInsert) {
      this.emit("message:outgoing", { ...message, sender_id: this.uid });
      await insertLocalMessage(message);
    }

    this.emit("upload:progress", {
      local_id: message.local_id,
      upload_progress: 0,
    });
    // Step 2: Begin the upload process using TUS.
    try {
      const bucketName = "chat_files"; // Your bucket name
      const filePath = `${this.uid}/${message.conversation_id}/${message.local_id}-${message.file_name}`;

      // Get auth token for the upload
      const {
        data: { session },
      } = await Supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");
      const token = session.access_token;

      // highlight-start
      // In React Native, we fetch the local URI to get the file data as a blob
      const response = await fetch(message.device_path!);
      const fileBlob = await response.blob();
      // highlight-end

      // Use a Promise to wrap the TUS upload callbacks
      const uploadPromise = new Promise<string>((resolve, reject) => {
        const upload = new tus.Upload(fileBlob, {
          endpoint: `${Constants.expoConfig?.extra?.SUPABASE_URL}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000],
          headers: {
            authorization: `Bearer ${token}`,
            "x-upsert": "true",
          },
          metadata: {
            bucketName: bucketName,
            objectName: filePath,
            cacheControl: "3600",
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = (bytesUploaded / bytesTotal) * 100;
          },
          onError: (error) => {
            console.error("TUS upload failed:", error);
            reject(error);
          },
          onSuccess: () => {
            const publicUrl = Supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath).data.publicUrl;
            resolve(publicUrl);
          },
        });
        this.activeUploads.set(message.local_id, upload);
        upload.start();
      });

      // Await the result of the upload
      await uploadPromise;

      this.emit("upload:progress", {
        local_id: message.local_id,
        upload_progress: 100,
      });

      // Step 4: Update the pending message's body to the final URL
      // and let the existing reliable message-sending logic handle it.
      await updateMessage({
        msg: {
          upload_status: "uploaded",
          storage_path: filePath,
        },
        checkCondition: { local_id: message.local_id },
        conditionOperator: { local_id: "=" },
      });

      // Step 3: Use the refactored sendMessage to broadcast the message in real-time.
      const finalMessage: LocalMessage = {
        ...message, // Contains all the original IDs and timestamps
        storage_path: filePath,
      };

      // Step 5: Trigger a flush to send the now-ready message immediately.
      // Call sendMessage, skipping the now-redundant local insert.
      // This is the real-time, broadcast-first approach.
      await this.sendMessage(finalMessage, true);
      // highlight-end
    } catch (e) {
      console.error("File upload process failed:", e);
      // Mark the message as failed in the local DB for the UI to show a "retry" option.
      await updateMessage({
        msg: {
          upload_status: "failed",
          storage_path: null,
        },
        checkCondition: { local_id: message.local_id },
        conditionOperator: { local_id: "=" },
      });
      this.emit("upload:progress", {
        local_id: message.local_id,
        upload_progress: -1,
      });
    }
  }

  async downloadFileForMessage(localId: string) {
    const fileDetial = await getMessage<{
      storage_path: string;
      body: string;
      file_name: string;
    }>(
      ["storage_path", "body", "file_name"],
      {
        local_id: "=",
      },
      {
        local_id: localId,
      }
    );
    console.log(
      `Requesting signed URL for file path: ${fileDetial[0].storage_path}`
    );
    try {
      this.emit("file:download", {
        localId,
        body: fileDetial[0].body,
        upload_status: "downloading",
      });
      // 1. Create a signed URL with a 60-second expiration time
      const { data, error } = await Supabase.storage
        .from("chat_files") // Your bucket name
        .createSignedUrl(fileDetial[0].storage_path, 60); // 60 seconds expiration

      if (error) {
        throw error;
      }

      const signedUrl = data.signedUrl;

      // 2. Use the temporary signed URL to download the file via MediaManager
      const newLocalUri = await MediaManager.saveReceivedImage(
        signedUrl,
        fileDetial[0].file_name
      );
      let newBody = JSON.parse(fileDetial[0].body);
      newBody = JSON.stringify({ ...newBody, uri: newLocalUri });

      // 3. Update the message in the local database with the new path
      await updateMessage({
        msg: {
          device_path: newLocalUri,
          body: newBody,
          upload_status: "downloaded",
        },
        checkCondition: {
          local_id: localId,
        },
        conditionOperator: {
          local_id: "=",
        },
      });

      // 4. Notify the UI that the message has been updated
      this.emit("file:download", {
        localId,
        body: newBody,
        upload_status: "downloaded",
      });

      return newLocalUri;
    } catch (error) {
      console.error("Download failed:", error);
      this.emit("file:download", {
        localId,
        body: fileDetial[0].body,
        upload_status: "failed",
      });
    }
  }

  async reSend(localId: string) {
    console.log("resending file for local id: ", localId);
    const message = await getMessage<LocalMessage>(
      ["*"],
      {
        local_id: "=",
      },
      {
        local_id: localId,
      }
    );

    await this.sendFileMessage(message[0], true);
  }

  // find pending local messages and push them to server (called on network regain or periodically)
  async flushPendingToServer() {
    if (!this.uid) return;
    const pending = await getPendingMessages();
    if (!pending?.length) return;

    // batch insert (NOTE: if you have large batches, consider chunking)
    try {
      for (const message of pending) {
        if (message.upload_status === "failed") {
          this.sendFileMessage(message, true);
        } else {
          this.sendMessage(message, true);
        }
      }
    } catch (e) {
      console.warn("flushPendingToServer failed", e);
    }
  }

  async syncQueuedPendingStatus(
    conversation_id: string,
    localChannel: RealtimeChannel
  ) {
    if (!this.uid) return;
    const messages = await fetchQueuedPendingStatusSync(conversation_id);
    for (const m of messages) {
      const ack: BroadcastAckPayload = {
        __type: "ack-2",
        conversation_id: conversation_id,
        local_id: m.local_id,
        server_id: null,
        sender_id: this.uid,
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
        ).upsert([
          {
            local_id: m.local_id,
            conversation_id: conversation_id,
            status: m.status,
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
      .select("*")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });

    if (since) q = q.gt("inserted_at", since);

    const { data, error } = await q.overrideTypes<
      PostgrestChangesMessagePayload[]
    >();

    if (error?.message) {
      console.warn("syncConversationFromServer error", error?.message);
      return;
    }

    for (const m of data ?? []) {
      const exists = await messageExists(null, m.local_id);
      if (exists) continue;
      // insert local message
      const msg: LocalMessage = {
        server_id: m.server_id ?? null,
        local_id: m.local_id,
        conversation_id: m.conversation_id,
        sender_role: m.sender_role,
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
        body: m.body,
        content_type: m.content_type as "doc" | "image" | "text",
        created_at: m.created_at,
        pending: 0,
        status: "sent",
        file_name: m.file_name ?? null,
        file_size: m.file_size ?? null,
        device_path: null,
        storage_path: m.storage_path ?? null,
        upload_status: "failed",
      };

      if (m.content_type === "file") {
        let body = JSON.parse(m.body);
        msg.body = JSON.stringify({ ...body, uri: null });
      }
      await insertLocalMessage(msg);

      // emit event for UI
      this.emit("message:incoming", {
        local_id: m.local_id,
        conversation_id: m.conversation_id,
        sender_role: m.sender_role as "user" | "agent",
        body: msg.body,
        content_type: m.content_type,
        created_at: m.created_at,
        status: "sent",
        uplod_status: "failed",
      });

      const ack: BroadcastAckPayload = {
        __type: "ack-2",
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
        ).upsert([
          {
            local_id: m.local_id,
            conversation_id: conversation_id,
            status: this.activeCId === conversation_id ? "read" : "received",
            ack_role: "user",
          },
        ]);
        if (error) {
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
  }

  async updateServerQueuedStatus(conversation_id: string) {
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
      await this.updateServerQueuedStatus(c.id);
      await this.syncConversationFromServer(c.id, localChannel);
    }

    Supabase.removeChannel(localChannel);

    this.emit("conversations:updated", convList);
  }

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
            inserted_at: ">",
          },
          {
            sender_role: "agent",
            conversation_id: conversation_id,
            inserted_at: last_read_at,
          }
        );
        const localChannel = Supabase.channel(`inbox:agent:${agent_id}`, {
          config: { broadcast: { ack: true } },
        });
        for (const message of unread_agent_messages) {
          const ack: BroadcastAckPayload = {
            __type: "ack-2",
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
            ).upsert([
              {
                local_id: message.local_id,
                conversation_id: conversation_id,
                status: "read",
                ack_role: "user",
              },
            ]);
            if (error) {
              // console.error(
              //   "Error while sycing status to server via on sync read status: ",
              //   error
              // );
              await queuePendingStatusSync(
                conversation_id,
                message.local_id,
                "read"
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("error while syncing read status: ", error);
    }
  }
}

export const chatBus = new ChatBus();
