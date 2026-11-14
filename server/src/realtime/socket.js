import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyToken } from '../middleware/auth.js';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

/** @type {Server | null} */
let io = null;

/**
 * Initialize Socket.io on the HTTP server with JWT handshake auth and client/user rooms.
 * @param {import('node:http').Server} httpServer
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token;
      const header = socket.handshake.headers?.authorization || '';
      const rawToken =
        authToken || (header.startsWith('Bearer ') ? header.slice(7).trim() : null);

      if (!rawToken) {
        return next(new Error('Unauthorized'));
      }

      const payload = verifyToken(rawToken);
      const user = await User.findById(payload.sub);
      if (!user) {
        return next(new Error('Unauthorized'));
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user.id}`);

    try {
      if (user.role === 'assistant') {
        const clients = await Client.find({ assistantId: user._id }).select('_id');
        for (const c of clients) {
          socket.join(`assistants:${String(c._id)}`);
        }
      } else if (user.role === 'client' && user.clientId) {
        socket.join(`client:${String(user.clientId)}`);
      }
      logger.debug('Socket connected', { userId: user.id, role: user.role });
    } catch (err) {
      logger.warn('Failed to join client rooms on socket connect', { message: err?.message });
    }
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Join an assistant's active sockets to a newly created client room.
 * @param {string | import('mongoose').Types.ObjectId} assistantId
 * @param {string | import('mongoose').Types.ObjectId} clientId
 */
export function joinAssistantClientRoom(assistantId, clientId) {
  if (!io || !assistantId || !clientId) return;
  io.in(`user:${String(assistantId)}`).socketsJoin(`assistants:${String(clientId)}`);
}

export function emitToAssistants(clientId, event, payload) {
  if (!io || !clientId) return;
  io.to(`assistants:${String(clientId)}`).emit(event, payload);
}

export function emitToClientUser(clientId, event, payload) {
  if (!io || !clientId) return;
  io.to(`client:${String(clientId)}`).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
}

export function sanitizeThreadForClient(thread) {
  if (!thread) return thread;
  const copy = { ...thread };
  delete copy.history;
  delete copy.reason;
  delete copy.suggestedOwner;
  return copy;
}

export const emitThreadCreated = (clientId, thread) => {
  emitToAssistants(clientId, 'thread:created', thread);
  if (thread?.owner === 'client') {
    emitToClientUser(clientId, 'thread:created', sanitizeThreadForClient(thread));
  }
};

export const emitThreadUpdated = (clientId, thread) => {
  emitToAssistants(clientId, 'thread:updated', thread);
  if (thread?.owner === 'client' || (thread?.handoff?.state && thread.handoff.state !== 'none')) {
    emitToClientUser(clientId, 'thread:updated', sanitizeThreadForClient(thread));
  }
};

export const emitCountsChanged = (clientId) =>
  emitToAssistants(clientId, 'counts:changed', { clientId: String(clientId) });

export const emitActivityNew = (clientId, activity) =>
  emitToAssistants(clientId, 'activity:new', activity);

function emitSyncEvent(clientId, assistantId, event, payload) {
  if (!io) return;
  let target = clientId ? io.to(`assistants:${String(clientId)}`) : null;
  if (assistantId) {
    target = target ? target.to(`user:${String(assistantId)}`) : io.to(`user:${String(assistantId)}`);
  }
  if (target) target.emit(event, payload);
}

export const emitSyncProgress = (clientId, progress, assistantId) =>
  emitSyncEvent(clientId, assistantId, 'sync:progress', progress);

export const emitSyncDone = (clientId, account, assistantId) =>
  emitSyncEvent(clientId, assistantId, 'sync:done', account);

export const emitDraftCreated = (clientId, draft) =>
  emitToAssistants(clientId, 'draft:created', draft);

