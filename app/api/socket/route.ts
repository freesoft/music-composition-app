import type { NextRequest } from "next/server"
import { Server } from "socket.io"

// Store for active connections and rooms
const rooms = new Map()

// This is a workaround for Socket.io with Next.js App Router
// In production, you'd use a proper WebSocket service like Pusher or a dedicated Socket.io server
let io: any

if (!global.io) {
  // @ts-ignore - Server expects Node.js HTTP server but we're using Edge Runtime
  io = new Server({
    path: "/api/socket",
    addTrailingSlash: false,
  })
  global.io = io
} else {
  io = global.io
}

// Set up socket event handlers if not already done
if (!io._hasSetupEventHandlers) {
  io.on("connection", (socket: any) => {
    console.log("Client connected:", socket.id)

    // Join a room
    socket.on("join-room", ({ roomId, username }: { roomId: string; username: string }) => {
      socket.join(roomId)

      // Add user to room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set())
      }
      rooms.get(roomId).add({ id: socket.id, username })

      // Get all users in the room
      const users = Array.from(rooms.get(roomId)).map((user: any) => user.username)

      // Notify everyone in the room
      io.to(roomId).emit("user-joined", { username, users })

      // Send current notation to the new user
      socket.to(roomId).emit("request-notation", { requesterId: socket.id })
    })

    // Handle notation updates
    socket.on(
      "update-notation",
      ({ roomId, notation, username }: { roomId: string; notation: string; username: string }) => {
        socket.to(roomId).emit("notation-updated", { notation, username })
      },
    )

    // Share current notation with new users
    socket.on(
      "share-notation",
      ({ roomId, notation, requesterId }: { roomId: string; notation: string; requesterId: string }) => {
        io.to(requesterId).emit("notation-shared", { notation })
      },
    )

    // Handle disconnection
    socket.on("disconnect", () => {
      // Remove user from all rooms
      rooms.forEach((users, roomId) => {
        const user = Array.from(users).find((u: any) => u.id === socket.id)
        if (user) {
          users.delete(user)

          // Notify others
          const remainingUsers = Array.from(users).map((u: any) => u.username)
          io.to(roomId).emit("user-left", { username: user.username, users: remainingUsers })

          // Clean up empty rooms
          if (users.size === 0) {
            rooms.delete(roomId)
          }
        }
      })
    })
  })

  io._hasSetupEventHandlers = true
}

export async function GET(req: NextRequest) {
  // This is a workaround to make Socket.io work with Next.js App Router
  // The actual socket connection is handled by the Socket.io server
  return new Response("Socket API route", { status: 200 })
}

