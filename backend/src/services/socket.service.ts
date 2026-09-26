import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug(`User ${userId} joined room user:${userId}`);
      }
    });

    // Join role room (e.g. role:AGENT, role:ADMIN)
    socket.on('join:role', (role: string) => {
      if (role) {
        socket.join(`role:${role}`);
        logger.debug(`Socket ${socket.id} joined room role:${role}`);
      }
    });

    // Join complaint/ticket room for live status & notes
    socket.on('join:complaint', (complaintId: string) => {
      if (complaintId) {
        socket.join(`complaint:${complaintId}`);
        logger.debug(`Socket ${socket.id} joined complaint:${complaintId}`);
      }
    });

    // Join chat session room
    socket.on('join:chat', (sessionId: string) => {
      if (sessionId) {
        socket.join(`chat:${sessionId}`);
        logger.debug(`Socket ${socket.id} joined chat:${sessionId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

export const emitToComplaint = (complaintId: string, event: string, data: any) => {
  if (io) {
    io.to(`complaint:${complaintId}`).emit(event, data);
  }
};

export const emitToChatSession = (sessionId: string, event: string, data: any) => {
  if (io) {
    io.to(`chat:${sessionId}`).emit(event, data);
  }
};
