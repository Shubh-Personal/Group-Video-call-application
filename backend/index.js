const { createServer } = require("http");
const express = require('express')
const { Server } = require('socket.io');
const cors = require('cors')

const app = express()
const httpServer = createServer(app);

app.use(cors())

const io = new Server(httpServer, {
    cors: {
        origin: "http://127.0.0.1:5173"
    }
})

io.on('connection', (socket) => {
    const safeJoin = (room) => {
        socket.join(room);
    }
    socket.on('room-id', ({ room }) => {
        safeJoin(room)
        socket.to(room).emit('user-connected', { id: socket.id })
    });

    socket.on('connect-to-me', ({ to, sender }) => {
        socket.to(to).emit('connect-request', { user: sender })
    })

    socket.on('offer', ({ to, offer, from }) => {
        socket.to(to).emit('offer-request', { offer, from })
    })

    socket.on('answer', ({ to, answer, from }) => {
        socket.to(to).emit('answer-request', { answer, from })
    })

    socket.on('ice-candidate', ({ to, candidate, from }) => {
        socket.to(to).emit('ice-candidate', { from, to, candidate })
    });

    socket.on('disconnecting', () => {
        console.log("socket disconnecting....");
    })

    socket.on('disconnect', () => {
        socket.rooms.forEach(room => {
            if (room.includes('video-')) {
                io.to(room).emit('user-disconnected', { id: socket.id })
            }
        })
    })

})


httpServer.listen(5000, () => {
    console.log("Server Started on 5000");
})