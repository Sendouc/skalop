import { getAuthenticatedUserId } from "./session";

const server = Bun.serve<{ authToken: string }>({
  async fetch(req, server) {
    const userId = await getAuthenticatedUserId(req);
    console.log({ userId });
    const success = server.upgrade(req, {
      data: {
        // TODO: pass _session here
        authToken: userId,
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
    // this is called when a message is received
    async message(ws, message) {
      // TODO: parse the session here
      const userId = ws.data.authToken;

      console.log(`Received ${message} from client ${userId}`);
      // send back a message
      ws.send(
        JSON.stringify({
          type: "message",
          contents: message,
          userId: userId,
          timestamp: Date.now(),
        })
      );
    },
  },
});

console.log(`Listening on localhost:${server.port}`);
