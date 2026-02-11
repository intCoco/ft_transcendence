const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


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

module.exports = { isBlocked };
