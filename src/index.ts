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

      // sleep for 5sec
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(`Received ${message} from client ${userId}`);

      const { id, contents } = JSON.parse(message as string);

      // send back a message
      ws.send(
        JSON.stringify({
          id,
          type: "message",
          contents,
          userId: userId,
          timestamp: Date.now(),
        })
      );
    },
  },
});

console.log(`Listening on localhost:${server.port}`);
