const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

function isAlphaNum(str) {
  return /^[a-zA-Z0-9]+$/.test(str);
}

async function registerUser(email, pass, nickname) {
  if (!email.includes("@")) {
    return { success: false, reason: "BAD_EMAIL_FORMAT" };
  }

  if (!isAlphaNum(nickname)) {
    return { success: false, reason: "BAD_NICK_FORMAT" };
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
  });

  if (existingUser) {
    return { success: false, reason: "USER_EXIST" };
  }

  const passwordHash = await bcrypt.hash(pass, 10);

  await prisma.user.create({
    data: {
      email,
      nickname,
      passwordHash,
      avatarUrl: "",
    },
  });

  return { success: true };
}

async function loginUser(email, pass) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: false };

  const ok = await bcrypt.compare(pass, user.passwordHash);
  if (!ok) return { success: false };

  return { success: true, user };
}

module.exports = { registerUser, loginUser };
