import type { ChatMessage } from "./services/Chat";
import { getAuthenticatedUserId } from "./session";
import * as Chat from "./services/Chat";

const server = Bun.serve<{ authToken: string; rooms: string[] }>({
  async fetch(req, server) {
    const userId = await getAuthenticatedUserId(req);
    console.log({ userId });
    const success = server.upgrade(req, {
      data: {
        // TODO: pass _session here
        authToken: userId,
        rooms: new URL(req.url).searchParams.getAll("room"),
      },
    });
    if (success) {
      console.log("connected...");
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    // handle HTTP request normally
    return new Response(null, { status: 405 });
  },
  websocket: {
    async open(ws) {
      for (const room of ws.data.rooms) {
        ws.subscribe(room);
      }

      const messages = await Promise.all(ws.data.rooms.map(Chat.getMessages));

      ws.send(JSON.stringify(messages.flat()));
    },
    publishToSelf: true,
    async message(ws, message) {
      // TODO: parse the session here
      const userId = ws.data.authToken;

      const { id, contents, room } = JSON.parse(message as string);

      const chatMessage: ChatMessage = {
        id,
        type: "message",
        contents,
        userId: Number(userId),
        room,
        timestamp: Date.now(),
      };

      await Chat.saveMessage(chatMessage);

      ws.publish(room, JSON.stringify(chatMessage));
    },
    close(ws) {
      for (const room of ws.data.rooms) {
        ws.unsubscribe(room);
      }
    },
  },
});

console.log(`Listening on localhost:${server.port}`);
