const { PrismaClient } = require("@prisma/client");
const { getUserIdFromAuth } = require("../utils/auth");

const prisma = new PrismaClient();


module.exports = async function (fastify) {
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

    return messages.map(m => ({
      from: m.fromUserId === me ? "me" : "other",
      text: m.content,
      at: m.createdAt,
    }));
  });
};
