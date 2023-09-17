import { redis } from "../redis";

export interface ChatMessage {
  id: string;
  type: "message" | "system";
  contents: string;
  userId: number;
  timestamp: number;
  room: string;
}

interface ChatService {
  saveMessage(message: ChatMessage): Promise<void>;
  getMessages(room: string): Promise<ChatMessage[]>;
}

const db = new Map<string, ChatMessage[]>();

const getKey = (message: ChatMessage) => `chat__${message.room}`;

const saveMessage: ChatService["saveMessage"] = async (message) => {
  await redis.rpush(getKey(message), JSON.stringify(message));
};

const getMessages: ChatService["getMessages"] = async (room) => {
  // we only load the last 250 messages not to blow up frontend
  // in normal usage nobody should reach that anyway
  const rawMessages = await redis.lrange(
    getKey({ room } as ChatMessage),
    -250,
    -1
  );

  return rawMessages.map((msg) => JSON.parse(msg));
};

export { saveMessage, getMessages };
