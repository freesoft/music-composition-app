// This file is for development purposes only
// In a real application, you would use a proper WebSocket server

const { Server } = require("socket.io")

// Create a mock HTTP server
const httpServer = require("http").createServer()

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Store for active connections and rooms
const rooms = new Map()

// Set up socket event handlers
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  // Join a room
  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId)

    // Add user to room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
    }
    rooms.get(roomId).add({ id: socket.id, username })

    // Get all users in the room
    const users = Array.from(rooms.get(roomId)).map((user) => user.username)

    // Notify everyone in the room
    io.to(roomId).emit("user-joined", { username, users })

    // Send current notation to the new user
    socket.to(roomId).emit("request-notation", { requesterId: socket.id })
  })

  // Handle notation updates
  socket.on("update-notation", ({ roomId, notation, username }) => {
    socket.to(roomId).emit("notation-updated", { notation, username })
  })

  // Share current notation with new users
  socket.on("share-notation", ({ roomId, notation, requesterId }) => {
    io.to(requesterId).emit("notation-shared", { notation })
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    // Remove user from all rooms
    rooms.forEach((users, roomId) => {
      const user = Array.from(users).find((u) => u.id === socket.id)
      if (user) {
        users.delete(user)

        // Notify others
        const remainingUsers = Array.from(users).map((u) => u.username)
        io.to(roomId).emit("user-left", { username: user.username, users: remainingUsers })

        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(roomId)
        }
      }
    })
  })
})

// Start the server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Mock Socket.IO server running on port ${PORT}`)
})

