
module.exports = async function (fastify) {
    fastify.post("/auth/logout", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer DEV_TOKEN_")) {
        return reply.status(401).send();
    }

    const userId = Number(auth.replace("Bearer DEV_TOKEN_", ""));

    for (const [socket, uid] of onlineSockets.entries()) {
        if (uid === userId) {
        socket.close();
        onlineSockets.delete(socket);
        }
    }

    broadcastUsers();
    return { ok: true };
    });
};