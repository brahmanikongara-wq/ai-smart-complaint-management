import http from 'http';
import app from './app';
import { ENV } from './config/env';
import { initSocket } from './services/socket.service';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Initialize real-time WebSockets
initSocket(server);

const PORT = parseInt(ENV.PORT, 10) || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 ResolvAI Backend Server is running on port ${PORT}`);
  logger.info(`📚 Swagger Documentation available at http://localhost:${PORT}/api/docs`);
  logger.info(`✨ Real-time WebSocket gateway active`);
});
