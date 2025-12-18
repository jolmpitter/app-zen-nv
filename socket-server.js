const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.SOCKET_PORT || 3001;

const httpServer = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Socket.io server is running");
});

const io = new Server(httpServer, {
    cors: {
        origin: "*", // Em produção, restringir ao domínio do app
        methods: ["GET", "POST"]
    },
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Endpoint para o backend notificar o socket (webhook bridge)
httpServer.on("request", (req, res) => {
    if (req.method === "POST" && req.url === "/emit") {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
            try {
                const { room, event, data } = JSON.parse(body);
                io.to(room).emit(event, data);
                res.writeHead(200);
                res.end("Emitted");
            } catch (e) {
                res.writeHead(400);
                res.end("Invalid JSON");
            }
        });
    }
});

httpServer.listen(PORT, () => {
    console.log(`Socket server listening on port ${PORT}`);
});

// Exportar para uso via require se necessário
module.exports = { io };
