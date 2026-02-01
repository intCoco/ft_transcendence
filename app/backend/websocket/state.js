const onlineSockets = new Map();

function sendToUser(userId, payload) {
  for (const [socket, uid] of onlineSockets.entries()) {
    if (uid === userId && socket.readyState === 1) {
      socket.send(JSON.stringify(payload));
    }
  }
}

function broadcastUsers() {
  const onlineUserIds = [...new Set(onlineSockets.values())];
  const payload = JSON.stringify({
    type: "USERS_STATUS",
    onlineUsers: onlineUserIds,
  });

  for (const socket of onlineSockets.keys()) {
    if (socket.readyState === 1) {
      socket.send(payload);
    }
  }
}

module.exports = {
  onlineSockets,
  sendToUser,
  broadcastUsers,
};
