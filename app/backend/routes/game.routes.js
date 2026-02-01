const { PrismaClient } = require("@prisma/client");
const { getUserIdFromAuth } = require("../utils/auth");

const prisma = new PrismaClient();

module.exports = async function (fastify) {
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
};