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
  userIds.forEach((id) => sendToUser(id, payload));
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
    const token = new URL(req.url, "http://localhost").searchParams.get(
      "token",
    );

    if (!token || !token.startsWith("DEV_TOKEN_")) {
      connection.socket.close();
      return;
    }

    const userId = Number(token.replace("DEV_TOKEN_", ""));
    if (Number.isNaN(userId)) {
      connection.socket.close();
      return;
    }

    for (const [socket, uid] of onlineSockets.entries()) {
      if (uid === userId) {
        socket.close();
        onlineSockets.delete(socket);
      }
    }

    onlineSockets.set(connection.socket, userId);

    connection.socket.send(
      JSON.stringify({
        type: "USERS_STATUS",
        onlineUsers: [...new Set(onlineSockets.values())],
      }),
    );

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
        background: "/images/manwork.png",
      },
      select: { background: true },
    });

    return settings;
  });

  fastify.put("/user/me/settings", async (req, reply) => {
    const userId = getUserIdFromAuth(req, reply);
    if (!userId) return;

    const { background } = req.body || {};

    if (
      typeof background !== "string" ||
      background.length < 1 ||
      background.length > 255
    ) {
      return reply.code(400).send({ message: "INVALID BACKGROUND" });
    }

    const ALLOWED_BACKGROUNDS = new Set([
      "/images/enter.jpg",
      "/images/sun.png",
      "/images/japan2.jpg",
      "/images/abstract.png",
      "/images/manwork.png",
      "/images/pacman.png",
      "/images/womanwork.png",
      "/images/roundenter.png",
      "/images/neonbh.png",
      "/images/worldtech.png",
      "/images/abstract2.png",
      "/images/womanview.png",
      "/images/enterdisk.png",
      "/images/manwork2.png",
      "/images/womanwork2.png",
      "/images/enter2.png",
      "/images/entertriangle.png",
      "/images/datacenter.png",
      "/images/abstract3.png",
      "/images/manwork3.png",
      "/images/datacenter2.png",
      "/images/miner.png",
      "/images/arcade.png",
      "/images/purpleplanet.png",
      "/images/vaisseau.png",
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

  fastify.put("/user/me/nickname", async (req, reply) => {
    const userId = getUserIdFromAuth(req, reply);
    if (!userId) return;

    const { nickname } = req.body || {};

    if (
      typeof nickname !== "string" ||
      nickname.trim().length < 3 ||
      nickname.trim().length > 20
    ) {
      return reply.code(400).send({ message: "INVALID_NICKNAME" });
    }

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { nickname: nickname.trim() },
        select: { nickname: true },
      });

      return { nickname: user.nickname };
    } catch (err) {
      return reply.code(500).send({ message: "FAILED_TO_UPDATE_NICKNAME" });
    }
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
          { requesterId: targetId, receiverId: me },
        ],
      },
    });

    if (existing) {
      return reply.code(409).send({
        message: "FRIENDSHIP_ALREADY_EXISTS",
      });
    }

    await prisma.friendship.create({
      data: {
        requesterId: me,
        receiverId: targetId,
      },
    });

    const meUser = await prisma.user.findUnique({
      where: { id: me },
      select: { id: true, nickname: true },
    });

    sendToUser(targetId, {
      type: "FRIEND_REQUEST",
      from: meUser,
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
          receiverId: me,
        },
      },
      data: { status: "ACCEPTED" },
    });

    const meUser = await prisma.user.findUnique({
      where: { id: me },
      select: { id: true, nickname: true },
    });

    const fromUser = await prisma.user.findUnique({
      where: { id: fromId },
      select: { id: true, nickname: true },
    });

    sendToUser(fromId, {
      type: "FRIEND_ADDED",
      user: meUser,
    });

    sendToUser(me, {
      type: "FRIEND_ADDED",
      user: fromUser,
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
          receiverId: me,
        },
      },
    });

    for (const [socket, uid] of onlineSockets.entries()) {
      if (uid === fromId && socket.readyState === 1) {
        socket.send(
          JSON.stringify({
            type: "FRIEND_REFUSED",
            userId: me,
          }),
        );
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
        OR: [{ requesterId: me }, { receiverId: me }],
      },
      include: {
        requester: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } },
      },
    });

    const friends = friendships.map((f) =>
      f.requesterId === me ? f.receiver : f.requester,
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
          { requesterId: otherId, receiverId: me },
        ],
      },
    });

    sendToUser(me, {
      type: "FRIEND_REMOVED",
      userId: otherId,
    });

    sendToUser(otherId, {
      type: "FRIEND_REMOVED",
      userId: me,
    });

    return { ok: true };
  });

  fastify.get("/friends/requests", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const reqs = await prisma.friendship.findMany({
      where: { status: "PENDING", receiverId: me },
      include: { requester: { select: { id: true, nickname: true } } },
      orderBy: { createdAt: "desc" },
    });

    return reqs.map((r) => r.requester);
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
        xp: true,
        success1: true,
        success2: true,
        success3: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ message: "USER_NOT_FOUND" });
    }

    const online = [...onlineSockets.values()].includes(userId);

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatarUrl || "/images/defaultavatar.png",
      online,
      xp: user.xp,
      success1: user.success1,
      success2: user.success2,
      success3: user.success3,
    };
  });

  /* ===========================
    LEADERBOARD
    =========================== */

  fastify.get("/leaderboard", async (req, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          nickname: true,
          wins: true,
          losses: true,
        },
      });

      const leaderboard = users
        .map((user) => {
          const totalGames = user.wins + user.losses;
          const winRate = totalGames === 0 ? 0 : user.wins / totalGames;
          return {
            id: user.id,
            nickname: user.nickname,
            wins: user.wins,
            losses: user.losses,
            winRate: parseFloat(winRate.toFixed(3)),
          };
        })
        .sort((a, b) => b.winRate - a.winRate);

      return reply.code(200).send(leaderboard);
    } catch (error) {
      fastify.log.error("Error retrieving leaderboard:", error);
      return reply
        .code(500)
        .send({ message: "FAILED_TO_RETRIEVE_LEADERBOARD" });
    }
  });

  /* ===========================
    HANDLE MESSAGE
    =========================== */

  fastify.get("/messages/:userId", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const otherId = Number(req.params.userId);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: me, toUserId: otherId },
          { fromUserId: otherId, toUserId: me },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((m) => ({
      from: m.fromUserId === me ? "me" : "other",
      text: m.content,
      at: m.createdAt,
    }));
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
          { requesterId: targetId, receiverId: me },
        ],
      },
    });

    await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: me,
          blockedId: targetId,
        },
      },
      update: {},
      create: {
        blockerId: me,
        blockedId: targetId,
      },
    });

    sendToUser(me, {
      type: "FRIEND_REMOVED",
      userId: targetId,
    });

    sendToUser(targetId, {
      type: "FRIEND_REMOVED",
      userId: me,
    });

    return { ok: true };
  });

  fastify.post("/user/:id/unblock", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const targetId = Number(req.params.id);

    await prisma.block.deleteMany({
      where: { blockerId: me, blockedId: targetId },
    });

    return { ok: true };
  });

  fastify.get("/user/blocked", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const blocks = await prisma.block.findMany({
      where: { blockerId: me },
      include: {
        blocked: { select: { id: true, nickname: true } },
      },
    });

    return blocks.map((b) => b.blocked);
  });

  /* ===========================
    GAME RESULTS
    =========================== */

  fastify.post("/game/result", async (req, reply) => {
    const userId = getUserIdFromAuth(req, reply);
    if (!userId) return;

    const { didWin, isPlayerVsAi } = req.body;

    if (typeof didWin !== "boolean" || typeof isPlayerVsAi !== "boolean") {
      return reply.code(400).send({ message: "INVALID_INPUT" });
    }

    if (!isPlayerVsAi) {
      return reply.code(200).send({ message: "NOT_PLAYER_VS_AI_MATCH" });
    }

    try {
      const XP_FOR_WIN = 20;
      const XP_FOR_LOSS = 5;

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { success1: true, success2: true, success3: true },
      });

      const achievementUpdates = {
        success1: currentUser.success1 || isPlayerVsAi,
        success2: currentUser.success2 || (isPlayerVsAi && didWin),
        success3: currentUser.success3 || (isPlayerVsAi && !didWin),
      };

      const updateData = didWin
        ? { wins: { increment: 1 }, xp: { increment: XP_FOR_WIN }, ...achievementUpdates }
        : { losses: { increment: 1 }, xp: { increment: XP_FOR_LOSS }, ...achievementUpdates };

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      return reply.code(200).send({ message: "GAME_RESULT_RECORDED" });
    } catch (error) {
      fastify.log.error(
        `Error recording game result for user ${userId}:`,
        error,
      );
      return reply.code(500).send({ message: "FAILED_TO_RECORD_GAME_RESULT" });
    }
  });

  /* ======BLOQUER LES ACTIONS=====*/
  async function isBlocked(a, b) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
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
