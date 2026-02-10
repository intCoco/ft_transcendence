const Fastify = require("fastify");
const cors = require("@fastify/cors");
const websocketPlugin = require("@fastify/websocket");

/* ===========================
   BOOTSTRAP SERVER
   =========================== */

async function start() {
  // log incoming requests and backend errors
  const fastify = Fastify({
    logger: true,
  });

  // allow frontend requests from the browser (CORS)
  // "origin: true" allows requests from any origin (browser only)
  await fastify.register(cors, {
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // enable websocket plugin
  await fastify.register(websocketPlugin);

  // register all backend route modules
  await fastify.register(require("./routes/auth.routes"));
  await fastify.register(require("./routes/user.routes"));
  await fastify.register(require("./routes/friends.routes"));
  await fastify.register(require("./routes/block.routes"));
  await fastify.register(require("./routes/messages.routes"));
  await fastify.register(require("./routes/ws.routes"));
  await fastify.register(require("./routes/leaderboard.routes"));
  await fastify.register(require("./routes/game.routes"));

  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  console.log("Backend listening on port 3000 (proxied by Nginx over HTTPS)");
}

start();