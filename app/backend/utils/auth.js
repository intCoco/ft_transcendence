function getUserIdFromAuth(req, reply) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
    return reply.code(401).send({ message: "UNAUTHORIZED" });
  }

  const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));
  if (Number.isNaN(userId)) {
    return reply.code(401).send({ message: "UNAUTHORIZED" });
  }

  return userId;
}

module.exports = { getUserIdFromAuth };
