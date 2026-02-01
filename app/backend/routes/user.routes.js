const { PrismaClient } = require("@prisma/client");
const { onlineSockets } = require("../websocket/state");
const { getUserIdFromAuth } = require("../utils/auth");

const prisma = new PrismaClient();


module.exports = async function (fastify) {

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

    if (typeof background !== "string" || background.length < 1 || background.length > 255) {
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
};
