const { registerUser, loginUser } = require("../services/auth.services");


module.exports = async function (fastify) {
  fastify.post("/auth/register", async (req, reply) => {
      const email = req.body?.email?.trim().toLowerCase();
      const password = req.body?.password?.trim();
      const nickname = req.body?.nickname?.trim();
  
      if (!nickname)
        return reply.code(400).send({ message: "invalid_nickname" });

      if (!password)
        return reply.code(400).send({ message: "invalid_pswd" });

      if (!email) {
        return reply.code(400).send({ message: "invalid_email" });
      }
  
      const result = await registerUser(email, password, nickname);
  
      if (!result.success) {
        return reply.code(409).send({ message: result.reason });
      }
  
      return reply.code(201).send({ message: "USER_CREATED" });
    });
  
    fastify.post("/auth/login", async (req, reply) => {
      const email = req.body?.email?.trim().toLowerCase();
      const password = req.body?.password?.trim();
  
      if (!password)
        return reply.code(400).send({ message: "invalid_pswd" });

      if (!email) {
        return reply.code(400).send({ message: "invalid_email" });
      }
  
      const result = await loginUser(email, password);
  
      if (!result.success) {
        return reply.code(401).send({ message: "BAD_CREDENTIALS" });
      }
  
      return {
        userId: result.user.id,
        nickname: result.user.nickname,
        token: `DEV_TOKEN_${result.user.id}`,
      };
    });
};
