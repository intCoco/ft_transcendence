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

function sendToUser(userId, payload) {
  for (const [socket, uid] of onlineSockets.entries()) {
    if (uid === userId && socket.readyState === 1) {
      socket.send(JSON.stringify(payload));
    }
  }
}

function sendToUsers(userIds, payload) {
  userIds.forEach(id => sendToUser(id, payload));
}

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
  });

  await fastify.register(cors, {
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(websocketPlugin);

  /* ===========================
     CHAT
     =========================== */

  // const { Chat } = require("./ws/chat");
  // const chat = new Chat();

  /* ===========================
     HTTP AUTH
     =========================== */

  fastify.post("/auth/register", async (req, reply) => {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();
    const nickname = req.body?.nickname?.trim();

    if (!email || !password || !nickname) {
      return reply.code(400).send({ message: "INVALID_INPUT" });
    }

    const result = await registerUser(email, password, nickname);

    if (!result.success) {
      return reply.code(409).send({ message: result.reason });
    }

    return reply.code(201).send({ message: "USER_CREATED" });
  });

  fastify.post("/auth/login", async (req, reply) => {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();

    if (!email || !password) {
      return reply.code(400).send({ message: "INVALID_INPUT" });
    }

    const result = await loginUser(email, password);

    if (!result.success) {
      return reply.code(401).send({ message: "BAD_CREDENTIALS" });
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

  function handleWs(connection, req) {
    const token = new URL(req.url, "http://localhost").searchParams.get("token");

    if (!token || !token.startsWith("DEV_TOKEN_")) {
      connection.socket.close();
      return;
    }

    const userId = Number(token.replace("DEV_TOKEN_", ""));
    if (Number.isNaN(userId)) {
      connection.socket.close();
      return;
    }

    // ⚠️ Empêche doublons (multi-onglets)
    for (const [socket, uid] of onlineSockets.entries()) {
      if (uid === userId) {
        socket.close();
        onlineSockets.delete(socket);
      }
    }

    onlineSockets.set(connection.socket, userId);
    broadcastUsers();

    connection.socket.on("close", () => {
      onlineSockets.delete(connection.socket);
      broadcastUsers();
    });
  }


  fastify.get("/ws", { websocket: true }, handleWs);
  fastify.get("/api/ws", { websocket: true }, handleWs);

  /* ===========================
     USER SETTINGS
     =========================== */

    fastify.get("/user/me/settings", async (req, reply) => {
      const userId = getUserIdFromAuth(req, reply);
      if (!userId) return;

      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          background: "/images/abstract.png",
        },
        select: { background: true },
      });

      return settings;
    });

    fastify.put("/user/me/settings", async (req, reply) => {
    const userId = getUserIdFromAuth(req, reply);
    if (!userId) return;

    const { background } = req.body || {};

    if (typeof background !== "string" || background.length < 1 || background.length > 255) {
      return reply.code(400).send({ message: "INVALID BACKGROUND" });
    }

    const ALLOWED_BACKGROUNDS = new Set([
      "/images/enter.jpg",
      "/images/sun.png",
      "/images/round.jpg",
      "/images/cybersun.jpg",
      "/images/black.webp",
      "/images/mountain.jpg",
      "/images/japan.jpg",
      "/images/japan2.jpg",
      "/images/car.jpg",
      "/images/car2.jpg",
      "/images/night.jpg",
      "/images/rocket.jpg",
      "/images/abstract.png",
      "/images/dom.jpg",
      "/images/setup.jpg",
      "/images/setup2.jpg",
      "/images/girlwork.jpg",
      "/images/boywork.jpg",
      "/images/vicecity.jpg",
    ]);

    if (!ALLOWED_BACKGROUNDS.has(background)) {
      return reply.code(400).send({ message: "BACKGROUND NOT ALLOWED" });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: { background },
      create: { userId, background },
      select: { background: true },
    });

    return settings;
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

    if (await isBlocked(me, targetId)) {
      return reply.code(403).send({ message: "BLOCKED" });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: me, receiverId: targetId },
          { requesterId: targetId, receiverId: me }
        ]
      }
    });

    if (existing) {
      return reply.code(409).send({
        message: "FRIENDSHIP_ALREADY_EXISTS"
      });
    }

    await prisma.friendship.create({
      data: {
        requesterId: me,
        receiverId: targetId
        // status = PENDING auto, merci Prisma
      }
    });

    const meUser = await prisma.user.findUnique({
      where: { id: me },
      select: { id: true, nickname: true }
    });

    sendToUser(targetId, {
      type: "FRIEND_REQUEST",
      from: meUser
    });

    return { ok: true };
  });

  fastify.post("/friends/accept/:userId", async (req, reply) => {

    const me = getUserIdFromAuth(req, reply);
    if (!me) return;
    
    const fromId = Number(req.params.userId);
    
    if (await isBlocked(me, fromId)) {
      return reply.code(403).send();
    }

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

    const fromUser = await prisma.user.findUnique({
      where: { id: fromId },
      select: { id: true, nickname: true }
    });
    
    sendToUser(fromId, {
      type: "FRIEND_ADDED",
      user: meUser
    });

    sendToUser(me, {
      type: "FRIEND_ADDED",
      user: fromUser
    });

    return { ok: true };
  });


  fastify.post("/friends/refuse/:userId", async (req, reply) => {

    const me = getUserIdFromAuth(req, reply);
    if (!me) return;
    
    const fromId = Number(req.params.userId);
    
    if (await isBlocked(me, fromId)) {
      return reply.code(403).send();
    }

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

    sendToUser(me, {
      type: "FRIEND_REMOVED",
      userId: otherId
    });

    sendToUser(otherId, {
      type: "FRIEND_REMOVED",
      userId: me
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
    PUBLIC USER PROFILE
    =========================== */

    fastify.get("/users/:id/profile", async (req, reply) => {
      const userId = Number(req.params.id);
      if (Number.isNaN(userId)) {
        return reply.code(400).send({ message: "INVALID_USER_ID" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ message: "USER_NOT_FOUND" });
      }

      const online = [...onlineSockets.values()].includes(userId);

      return {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatarUrl,
        online,
      };
    });


  /* ===========================
    HANDLE BLACKLIST
    =========================== */

  fastify.post("/user/:id/block", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const targetId = Number(req.params.id);
    if (me === targetId) return reply.code(400).send();

    // supprime amitié si existe
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: me, receiverId: targetId },
          { requesterId: targetId, receiverId: me }
        ]
      }
    });

    await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: me,
          blockedId: targetId
        }
      },
      update: {},
      create: {
        blockerId: me,
        blockedId: targetId
      }
    });

    sendToUser(me, {
      type: "FRIEND_REMOVED",
      userId: targetId
    });

    sendToUser(targetId, {
      type: "FRIEND_REMOVED",
      userId: me
    });

    return { ok: true };
  });

  fastify.post("/user/:id/unblock", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const targetId = Number(req.params.id);

    await prisma.block.deleteMany({
      where: { blockerId: me, blockedId: targetId }
    });

    return { ok: true };
  });

  fastify.get("/user/blocked", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const blocks = await prisma.block.findMany({
      where: { blockerId: me },
      include: {
        blocked: { select: { id: true, nickname: true } }
      }
    });

    return blocks.map(b => b.blocked);
  });

  /* ======BLOQUER LES ACTIONS=====*/
  async function isBlocked(a, b) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a }
        ]
      }
    });
    return !!block;
  }

  /* ===========================
      START
     =========================== */

  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  console.log("Backend running on https://localhost:3000");
}

function getUserIdFromAuth(req, reply) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
    return reply.code(401).send({ message: "UNAUTHORIZED" });
  }
  const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));
  if (Number.isNaN(userId)) {
    return reply.code(401).send({ message: "UNAUTHORIZED" });
  }
  return userId;
}

start();
