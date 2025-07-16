import express from 'express';
import helmet from 'helmet';
import cors from 'cors'; 
import routes from './routes';
import config from './config';
import logger from './utils/logger';
import { NextFunction, Request , Response } from "express";
import { HttpException } from './utils/exceptions/http/HttpException';
import requestLogger from './middlewares/requestLogger';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketIO } from './services/Socket.service';

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new SocketIOServer(server, {
    cors: {
        origin: [
            "http://localhost:3000", 
            "http://127.0.0.1:3000", 
            "http://localhost:5500", 
            "http://127.0.0.1:5500",
            "http://localhost:5503",
            "http://127.0.0.1:5503",
            "http://127.0.0.1:5504"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize Socket.IO handlers
setupSocketIO(io);

app.use(helmet());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: [
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:5500", 
        "http://127.0.0.1:5500",
        "http://localhost:5503",
        "http://127.0.0.1:5503",
        "http://127.0.0.1:5504"
    ],
    credentials: true
}));

app.use(requestLogger);

app.use('/', routes);

// config 404 handler
app.use((req, res) => {
    res.status(404).json({error: "Not Found"});
})

// config error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if(err instanceof HttpException) {
        res.status(err.status).json({message: err.message});
    } else {
        logger.error("Unhandled Error: %s", err.message);
        res.status(500).json({
             message: "Internal Server Error"
             });
    }
})

server.listen(config.port, config.host, () => {
    logger.info('Server is running on http://%s:%d', config.host, config.port);
});