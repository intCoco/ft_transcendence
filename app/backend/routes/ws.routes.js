const { PrismaClient } = require("@prisma/client");
const { onlineSockets, sendToUser, broadcastUsers } = require("../websocket/state");
const { isBlocked } = require("../utils/block");

const prisma = new PrismaClient();


module.exports = async function (fastify) {
  function handleWs(connection, req) {
    const token = new URL(req.url, "http://localhost").searchParams.get("token");

    connection.socket.isAlive = true;
    
    connection.socket.on("pong", () => {
      connection.socket.isAlive = true;
    });

    if (!token || !token.startsWith("DEV_TOKEN_")) {
      connection.socket.close();
      return;
    }

    const userId = Number(token.replace("DEV_TOKEN_", ""));
    if (Number.isNaN(userId)) {
      connection.socket.close();
      return;
    }

    connection.socket.on("close", () => {
      onlineSockets.delete(connection.socket);
      broadcastUsers();
    });

    connection.socket.on("error", () => {
      onlineSockets.delete(connection.socket);
      broadcastUsers();
    });

    for (const uid of onlineSockets.values()) {
      if (uid === userId) {
        connection.socket.send(JSON.stringify({
          type: "ALREADY_CONNECTED"
        }));
        connection.socket.close();
        return;
      }
    }

    onlineSockets.set(connection.socket, userId);

    connection.socket.send(JSON.stringify({
      type: "USERS_STATUS",
      onlineUsers: [...new Set(onlineSockets.values())],
    }));

    broadcastUsers();

    connection.socket.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.type === "TYPING") {
        sendToUser(msg.toUserId, {
          type: "TYPING",
          fromUserId: userId,
        });
      }

      if (msg.type === "STOP_TYPING") {
        sendToUser(msg.toUserId, {
          type: "STOP_TYPING",
          fromUserId: userId,
        });
      }

      if (msg.type === "DM_SEND") {
        try {
          const { toUserId, text } = msg;
          if (!text) return;
          if (await isBlocked(userId, toUserId)) return;

          const saved = await prisma.message.create({
            data: {
              fromUserId: userId,
              toUserId,
              content: text,
            },
          });

          sendToUser(toUserId, {
            type: "DM_MESSAGE",
            fromUserId: userId,
            text: saved.content,
            at: saved.createdAt,
          });

          sendToUser(userId, {
            type: "DM_MESSAGE",
            fromUserId: userId,
            text: saved.content,
            at: saved.createdAt,
          });

        } catch (err) {
          console.error("DM_SEND ERROR:", err);
        }
      }
    });
  }

  fastify.get("/ws", { websocket: true }, handleWs);
  fastify.get("/api/ws", { websocket: true }, handleWs);

  fastify.post("/auth/logout", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
      return reply.status(401).send();
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));

    for (const [socket, uid] of onlineSockets.entries()) {
      if (uid === userId) {
        socket.close();
        onlineSockets.delete(socket);
      }
    }

    broadcastUsers();
    return { ok: true };
  });
};
