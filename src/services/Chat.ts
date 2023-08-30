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

const saveMessage: ChatService["saveMessage"] = async (message) => {
  const messages = db.get(message.room) ?? [];
  messages.push(message);
  db.set(message.room, messages);
};

const getMessages: ChatService["getMessages"] = async (room) => {
  return db.get(room) ?? [];
};

export { saveMessage, getMessages };
