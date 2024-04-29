import { io } from "../index.js";
import PlayerService from "../service/PlayerService.js";

const playerSockets = new Map();

export const getBusyUsernames = async (req, res) => {
  try {
    const busyUsernames = Array.from(playerSockets.entries())
      .filter(([username, { busy }]) => busy)
      .map(([username]) => username);

    return res.status(200).json({ busyUsernames });
  } catch (err) {
    console.log("Error retrieving busy usernames:", err);
    res.status(500).send("Internal server error");
  }
};

export const connectToGameLobby = () => {
  io.on("connection", async (socket) => {
    console.log("Player connected");
    let savedUsername;

    socket.on("online-ping", async (username) => {
      savedUsername = username;

      if (!playerSockets.has(savedUsername)) {
        playerSockets.set(savedUsername, { socketIds: new Set(), busy: false });

        try {
          let player = await PlayerService.getPlayerByUsername(savedUsername);
          if (!player) {
            player = await PlayerService.addPlayer({ username: savedUsername });
            console.log(`New player added to database: ${player.username}`);
          }
        } catch (error) {
          console.log("Error accessing PlayerService:", error);
        }
      }

      const playerData = playerSockets.get(savedUsername);
      playerData.socketIds.add(socket.id);

      console.log(
        `Player ${savedUsername} connected with socket ID ${socket.id}. Current online players:`,
        Array.from(playerSockets.keys())
      );
      socket.broadcast.emit(
        "in-game-players",
        Array.from(playerSockets.keys())
      );
    });

    socket.on(
      "backgammon-connection",
      ({ senderUsername, receiverUsername, areBusy }) => {
        if (playerSockets.has(receiverUsername)) {
          const senderData = playerSockets.get(senderUsername);
          const receiverData = playerSockets.get(receiverUsername);

          senderData.busy = receiverData.busy = areBusy;

          receiverData.socketIds.forEach((socketId) => {
            io.to(socketId).emit("receive-game-invite", {
              senderUsername,
              receiverUsername,
            });
          });

          io.emit(
            "update-busy-status",
            [senderUsername, receiverUsername],
            areBusy
          );
        } else {
          console.log("Receiver not found in connected players.");
        }
      }
    );

    // socket.on("disconnect", () => {
    //   if (savedUsername && playerSockets.has(savedUsername)) {
    //     playerSockets.get(savedUsername).delete(socket.id);
    //     console.log(
    //       `Socket ID ${
    //         socket.id
    //       } for player ${savedUsername} disconnected. Remaining sockets: ${
    //         playerSockets.get(savedUsername).size
    //       }`
    //     );
    //     if (playerSockets.get(savedUsername).size === 0) {
    //       console.log(
    //         `All sockets for ${savedUsername} are disconnected. Player remains in the map with 0 sockets.`
    //       );
    //       socket.broadcast.emit("player-connection", savedUsername, false);
    //     }
    //   }
    // });

    socket.on("disconnect", () => {
      if (savedUsername && playerSockets.has(savedUsername)) {
        const userData = playerSockets.get(savedUsername);
        userData.socketIds.delete(socket.id);

        console.log(
          `Socket ID ${socket.id} for player ${savedUsername} disconnected. Remaining sockets: ${userData.socketIds.size}`
        );

        if (userData.socketIds.size === 0) {
          userData.busy = false;
          playerSockets.delete(savedUsername);
          console.log(
            `All sockets for ${savedUsername} are disconnected. Removing from online players.`
          );
          io.emit("player-connection", savedUsername, false);
        }
      }
    });
  });
};
