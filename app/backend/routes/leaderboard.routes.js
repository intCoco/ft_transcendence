const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


module.exports = async function (fastify) {
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
};