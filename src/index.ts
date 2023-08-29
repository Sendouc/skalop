import { getAuthenticatedUserId } from "./session";

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
    open(ws) {
      for (const room of ws.data.rooms) {
        ws.subscribe(room);
      }
    },
    publishToSelf: true,
    async message(ws, message) {
      // TODO: parse the session here
      const userId = ws.data.authToken;

      console.log(`Received ${message} from client ${userId}`);

      const { id, contents, room } = JSON.parse(message as string);

      // TODO: send back existing messages of the room(s)
      ws.publish(
        room,
        JSON.stringify({
          id,
          type: "message",
          contents,
          userId: userId,
          room,
          timestamp: Date.now(),
        })
      );
    },
    close(ws) {
      for (const room of ws.data.rooms) {
        ws.unsubscribe(room);
      }
    },
  },
});

console.log(`Listening on localhost:${server.port}`);
