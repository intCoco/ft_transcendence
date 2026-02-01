const { PrismaClient } = require("@prisma/client");
const { sendToUser } = require("../websocket/state");
const { getUserIdFromAuth } = require("../utils/auth");

const prisma = new PrismaClient();


module.exports = async function (fastify) {
  fastify.post("/user/:id/block", async (req, reply) => {
    const me = getUserIdFromAuth(req, reply);
    if (!me) return;

    const targetId = Number(req.params.id);
    if (me === targetId) return reply.code(400).send();

    // if exist, delete friendship
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

};
