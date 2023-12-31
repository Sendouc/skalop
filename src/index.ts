import type { ChatMessage } from "./services/Chat";
import { extractSession, getAuthenticatedUserId } from "./session";
import * as Chat from "./services/Chat";
import invariant from "tiny-invariant";
import { msgShouldBePersisted } from "./utils";

const MESSAGE_MAX_LENGTH = 200;

invariant(process.env["SKALOP_TOKEN"], "Missing env var: SKALOP_TOKEN");
const server = Bun.serve<{ authToken: string; rooms: string[] }>({
  async fetch(req, server) {
    // handle messages sent by sendou.ink backend
    if (new URL(req.url).pathname === "/system") {
      if (req.headers.get("Skalop-Token") !== process.env["SKALOP_TOKEN"]) {
        return new Response(null, { status: 401 });
      }

      const msgArr = (await req.json()) as ChatMessage[];

      for (const msg of msgArr) {
        if (msgShouldBePersisted(msg)) await Chat.saveMessage(msg);

        server.publish(msg.room, JSON.stringify(msg));
      }
    }

    const session = extractSession(req.headers.get("Cookie"));
    if (!session) {
      console.warn("No session found");
      return new Response(null, { status: 401 });
    }

    const success = server.upgrade(req, {
      data: {
        authToken: session,
        rooms: new URL(req.url).searchParams.getAll("room"),
      },
    });
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    console.warn("Upgrade failed");

    // handle HTTP request normally
    return new Response(null, { status: 405 });
  },
  websocket: {
    async open(ws) {
      for (const room of ws.data.rooms) {
        ws.subscribe(room);
      }

      const messages = await Promise.all(ws.data.rooms.map(Chat.getMessages));
      const flattenedMessages = messages.flat();

      if (flattenedMessages.length > 0) {
        ws.send(JSON.stringify(flattenedMessages));
      }
    },
    publishToSelf: true,
    async message(ws, message) {
      // it's a ping to keep the connection alive
      if (message === "") return;

      const userId = await getAuthenticatedUserId(ws.data.authToken);
      invariant(userId, "User must be authenticated to send messages");

      const { id, contents, room } = JSON.parse(message as string);

      const chatMessage: ChatMessage = {
        id,
        contents: contents.slice(0, MESSAGE_MAX_LENGTH),
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
