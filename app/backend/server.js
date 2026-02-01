const Fastify = require("fastify");
const cors = require("@fastify/cors");
const websocketPlugin = require("@fastify/websocket");

/* ===========================
   BOOTSTRAP SERVER
   =========================== */

async function start() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(websocketPlugin);

  await fastify.register(require("./routes/auth.routes"));
  await fastify.register(require("./routes/user.routes"));
  await fastify.register(require("./routes/friends.routes"));
  await fastify.register(require("./routes/block.routes"));
  await fastify.register(require("./routes/messages.routes"));
  await fastify.register(require("./routes/ws.routes"));
  await fastify.register(require("./routes/leaderboard.routes"));
  await fastify.register(require("./routes/game.routes"));

  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  console.log("Backend running on https://localhost:3000");
}

start();