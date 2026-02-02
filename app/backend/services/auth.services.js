const { PrismaClient } = require("@prisma/client");

const bcrypt = require("bcrypt");
const prisma = new PrismaClient();


function isAlphaNum(str) {
  return /^[a-zA-Z0-9]+$/.test(str);
}

function isValidLength(str) {
	if (str.length > 15)
		return false;

	return true;
}

function isValidEmail(str) {
	if (typeof str !== "string")
		return false;

	const email = str.trim();
	if (email.length < 5 || email.length > 30)
		return false;

	const match = email.match(/^([a-zA-Z0-9]+)@([a-zA-Z0-9]+)\.(com|fr)$/i);
	if (!match)
		return false;

	return true;
}

async function registerUser(email, pass, nickname) {
	if (!isValidEmail(email))
		return { success: false, reason: "Email : mauvais format (example@email.com)" };

	if (!isAlphaNum(nickname))
		return { success: false, reason: "Identifiant : uniquement alphanumériques autorisés" };

	if (nickname.length > 15)
		return { success: false, reason: "Identifiant : 15 caractères maximum" };

	const existingUser = await prisma.user.findFirst({
		where: { OR: [{ email }, { nickname }] },
  });

  if (existingUser) {
	return { success: false, reason: "Email déjà utilisé" };
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
