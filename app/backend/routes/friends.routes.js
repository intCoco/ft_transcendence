const { PrismaClient } = require("@prisma/client");
const { sendToUser } = require("../websocket/state");
const { getUserIdFromAuth } = require("../utils/auth");
const { isBlocked } = require("../utils/block");

const prisma = new PrismaClient();


module.exports = async function (fastify) {
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

    sendToUser(fromId, {
      type: "FRIEND_REFUSED",
      userId: me,
    });

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
          { receiverId: me },
        ],
      },
      include: {
        requester: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } },
      },
    });

    const friends = friendships.map((f) =>
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
};
