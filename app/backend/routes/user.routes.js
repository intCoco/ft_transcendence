const { PrismaClient } = require("@prisma/client");
const { onlineSockets } = require("../websocket/state");
const { getUserIdFromAuth } = require("../utils/auth");

const prisma = new PrismaClient();


function getDefaultAvatarByLevel(level) {
  if (level >= 3) return "/images/avatar3.png";
  if (level >= 2) return "/images/avatar2.png";
  return "/images/defaultavatar.png";
}


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
      "/images/abstract.png",
      "/images/abstract2.png",
      "/images/arcade.png",
      "/images/datacenter.png",
      "/images/enter.jpg",
      "/images/enter2.png",
      "/images/entertriangle.png",
      "/images/manwork.png",
      "/images/manwork2.png",
      "/images/manwork3.png",
      "/images/miner.png",
      "/images/neon1.png",
      "/images/neon2.png",
      "/images/neon3.png",
      "/images/neon4.png",
      "/images/neon5.png",
      "/images/neon6.png",
      "/images/neon7.png",
      "/images/neon8.png",
      "/images/neon9.png",
      "/images/neon10.png",
      "/images/neon11.png",
      "/images/neon12.png",
      "/images/neonbh.png",
      "/images/pacman.png",
      "/images/purpleplanet.png",
      "/images/roundenter.png",
      "/images/sun.png",
      "/images/vaisseau.png",
      "/images/viewpurple.png",
      "/images/womanview.png",
      "/images/womanwork.png",
      "/images/womanwork2.png"
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

    if (!req.body.avatar || req.body.avatar.length > 4_500_000) {
      return reply.code(400).send({ message: "AVATAR_TOO_LARGE" });
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });

    if (!user) {
      return reply.code(404).send({ message: "USER_NOT_FOUND" });
    }

    const level = Math.floor(user.xp / 100);

    if (level < 5) {
      return reply.code(403).send({
        error: "AVATAR_LOCKED",
        requiredLevel: 5,
      });
    }

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
      select: {
        avatarUrl: true,
        xp: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ message: "USER_NOT_FOUND" });
    }

    const level = Math.floor(user.xp / 100);

    let avatar;
    if (level >= 5 && user.avatarUrl) {
      avatar = user.avatarUrl;
    } else {
      avatar = getDefaultAvatarByLevel(level);
    }

    return {
      avatar,
      level,
    };
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
      nickname.trim().length < 1 ||
      nickname.trim().length > 15
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

    const level = Math.floor(user.xp / 100);

    const avatar =
      level >= 5 && user.avatarUrl
        ? user.avatarUrl
        : getDefaultAvatarByLevel(level);

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatarUrl || "/images/defaultavatar.png",
      avatar,
      online,
      xp: user.xp,
      success1: user.success1,
      success2: user.success2,
      success3: user.success3,
    };
  });

  fastify.get("/users/:id/matches", async (req, reply) => {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      return reply.code(400).send({ message: "INVALID_USER_ID" });
    }

    const matches = await prisma.match.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return matches;
  });
};
