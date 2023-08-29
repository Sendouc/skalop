import { getAuthenticatedUserId } from "./session";

const server = Bun.serve<{ authToken: string }>({
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
      // @ts-expect-error TODO: types
      const rooms = ws.data.rooms as string[];
      for (const room of rooms) {
        ws.subscribe(room);
      }
    },
    publishToSelf: true,
    async message(ws, message) {
      // TODO: parse the session here
      const userId = ws.data.authToken;

      console.log(`Received ${message} from client ${userId}`);

      const { id, contents } = JSON.parse(message as string);

      // send back a message
      // TODO: send back existing messages of the room(s)
      // TODO: get room id to sent to from the message
      ws.publish(
        "TEST",
        JSON.stringify({
          id,
          type: "message",
          contents,
          userId: userId,
          timestamp: Date.now(),
        })
      );
    },
    close(ws) {
      // @ts-expect-error TODO: types
      const rooms = ws.data.rooms as string[];
      for (const room of rooms) {
        ws.unsubscribe(room);
      }
    },
  },
});

console.log(`Listening on localhost:${server.port}`);
