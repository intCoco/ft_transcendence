const Fastify = require("fastify");
const cors = require("@fastify/cors");
const websocketPlugin = require("@fastify/websocket");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/* ===========================
   ONLINE / WEBSOCKET STATE
   =========================== */

// socket -> userId
const onlineSockets = new Map();

function broadcastUsers() {
  const onlineUserIds = [...new Set(onlineSockets.values())];

  const payload = JSON.stringify({
    type: "USERS_STATUS",
    onlineUsers: onlineUserIds,
  });

  for (const socket of onlineSockets.keys()) {
    if (socket.readyState === 1) {
      socket.send(payload);
    }
  }
}

/* ===========================
   AUTH SERVICES
   =========================== */

const { registerUser, loginUser } = require("./auth/auth.service");

/* ===========================
   SERVER BOOTSTRAP
   =========================== */

async function start() {
  const fastify = Fastify({
    logger: true,
    https: {
      key: fs.readFileSync("/app/backend/certs/key.pem"),
      cert: fs.readFileSync("/app/backend/certs/cert.pem"),
    },
  });

  await fastify.register(cors, {
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(websocketPlugin);

  /* ===========================
     HTTP AUTH
     =========================== */

  fastify.post("/auth/register", async (req, reply) => {
    const { email, password, nickname } = req.body;

    const result = await registerUser(email, password, nickname);
    if (!result.success) {
      return reply.status(400).send({ error: result.reason });
    }

    return { ok: true };
  });

  fastify.post("/auth/login", async (req, reply) => {
    const { email, password } = req.body;

    const result = await loginUser(email, password);
    if (!result.success) {
      return reply.status(401).send({ error: "bad credentials" });
    }

    return {
      userId: result.user.id,
      nickname: result.user.nickname,
      token: `DEV_TOKEN_${result.user.id}`,
    };
  });

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

  /* ===========================
     WEBSOCKET
     =========================== */

  fastify.get("/ws", { websocket: true }, (connection, req) => {
    const token = req.headers["sec-websocket-protocol"];

    if (!token || !token.startsWith("DEV_TOKEN_")) {
      connection.socket.close();
      return;
    }

    const userId = Number(token.replace("DEV_TOKEN_", ""));
    if (Number.isNaN(userId)) {
      connection.socket.close();
      return;
    }

    onlineSockets.set(connection.socket, userId);
    broadcastUsers();

    connection.socket.on("close", () => {
      onlineSockets.delete(connection.socket);
      broadcastUsers();
    });
  });

  /* ===========================
     USER DATA
     =========================== */

  fastify.post("/user/me/avatar", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
      return reply.status(401).send();
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: req.body.avatar },
    });

    return { ok: true };
  });

  fastify.get("/user/me/avatar", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
      return reply.status(401).send();
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    return { avatar: user?.avatarUrl ?? null };
  });

  fastify.get("/users", async () => {
    const users = await prisma.user.findMany({
      select: { id: true, nickname: true },
      orderBy: { nickname: "asc" },
    });

    const onlineIds = new Set(onlineSockets.values());

    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      online: onlineIds.has(u.id),
    }));
  });
  /* ===========================
   FRIENDSHIPS
   =========================== */

  fastify.post("/friends/request/:userId", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const targetId = Number(req.params.userId);
    if (me === targetId) return reply.code(400).send();

    // empêche doublon
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: me, receiverId: targetId },
          { requesterId: targetId, receiverId: me }
        ]
      }
    });

    if (existing) return reply.code(400).send();

    await prisma.friendship.create({
      data: {
        requesterId: me,
        receiverId: targetId
      }
    });

    // WS notify receiver
    for (const [socket, uid] of onlineSockets.entries()) {
      if (uid === targetId && socket.readyState === 1) {
        socket.send(JSON.stringify({
          type: "FRIEND_REQUEST",
          from: { id: me }
        }));
      }
    }

    return { ok: true };
  });

  fastify.post("/friends/accept/:userId", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const fromId = Number(req.params.userId);

    await prisma.friendship.update({
      where: {
        requesterId_receiverId: {
          requesterId: fromId,
          receiverId: me
        }
      },
      data: { status: "ACCEPTED" }
    });

    const meUser = await prisma.user.findUnique({
      where: { id: me },
      select: { id: true, nickname: true }
    });

    socket.send(JSON.stringify({
      type: "FRIEND_REQUEST",
      from: meUser
    }));

    const fromUser = await prisma.user.findUnique({
      where: { id: fromId },
      select: { id: true, nickname: true }
    });

    for (const [socket, uid] of onlineSockets.entries()) {
      if (uid === fromId && socket.readyState === 1) {
        socket.send(JSON.stringify({
          type: "FRIEND_ACCEPTED",
          user: meUser
        }));
      }
      if (uid === me && socket.readyState === 1) {
        socket.send(JSON.stringify({
          type: "FRIEND_ACCEPTED",
          user: fromUser
        }));
      }
    }

    return { ok: true };
  });


  fastify.post("/friends/refuse/:userId", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const fromId = Number(req.params.userId);

    await prisma.friendship.delete({
      where: {
        requesterId_receiverId: {
          requesterId: fromId,
          receiverId: me
        }
      }
    });

    for (const [socket, uid] of onlineSockets.entries()) {
      if (uid === fromId && socket.readyState === 1) {
        socket.send(JSON.stringify({
          type: "FRIEND_REFUSED",
          userId: me
        }));
      }
    }

    return { ok: true };
  });


  fastify.get("/friends", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: me },
          { receiverId: me }
        ]
      },
      include: {
        requester: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } }
      }
    });

    const friends = friendships.map(f =>
      f.requesterId === me ? f.receiver : f.requester
    );

    return friends;
  });

  fastify.delete("/friends/:userId", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const otherId = Number(req.params.userId);

    await prisma.friendship.deleteMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: me, receiverId: otherId },
          { requesterId: otherId, receiverId: me }
        ]
      }
    });

    return { ok: true };
  });

  fastify.get("/friends/requests", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const reqs = await prisma.friendship.findMany({
      where: { status: "PENDING", receiverId: me },
      include: { requester: { select: { id: true, nickname: true } } },
      orderBy: { createdAt: "desc" }
    });

    return reqs.map(r => r.requester);
  });
  /* ===========================
      START
     =========================== */

  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  console.log("Backend running on https://localhost:3000");
}

function getUserIdFromAuth(req, reply) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
    reply.code(401).send();
    return null;
  }
  const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));
  if (Number.isNaN(userId)) {
    reply.code(401).send();
    return null;
  }
  return userId;
}


start();
