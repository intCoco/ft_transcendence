const Fastify = require("fastify");
const cors = require("@fastify/cors");
const websocketPlugin = require("@fastify/websocket");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const onlineUsers = new Set();
const prisma = new PrismaClient();
const { registerUser, loginUser } = require("./auth/auth.service");

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
    onlineUsers.add(result.user.id);
    return {
      userId: result.user.id,
      nickname: result.user.nickname,
      token: `DEV_TOKEN_${result.user.id}`,
    };
  });

  //pour marquer les hors ligne au logout
  fastify.post("/auth/logout", async (req, reply) => {
  const auth = req.headers.authorization;
  if (!auth) return reply.status(401).send();

  const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));
  onlineUsers.delete(userId);

  return { ok: true };
  });

  // UPDATE AVATAR
  fastify.post("/user/me/avatar", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth) return reply.status(401).send({ error: "unauthorized" });

    const userId = auth.replace("Bearer DEV_TOKEN_", "");

    await prisma.user.update({
      where: { id: Number(userId) },
      data: { avatarUrl: req.body.avatar },
    });

    return { ok: true };
  });

  // GET AVATAR
  fastify.get("/user/me/avatar", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer DEV_TOKEN_")) {
      return reply.status(401).send({ error: "unauthorized" });
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));
    if (Number.isNaN(userId)) {
      return reply.status(401).send({ error: "invalid token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    return { avatar: user?.avatarUrl ?? null };
  });

  //liste des users et leur status
  fastify.get("/users", async (req, reply) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      nickname: true,
    },
    orderBy: { nickname: "asc" },
  });

  return users.map(u => ({
    id: u.id,
    nickname: u.nickname,
    online: onlineUsers.has(u.id),
  }));
  });

  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  console.log("Backend running on https://localhost:3000");
}

start();
