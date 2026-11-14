import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';
import { badRequest, forbidden, unauthorized } from '../utils/errors.js';

/**
 * Sign a JWT for a user.
 * @param {{ id: string, role: string }} user
 */
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verify a JWT string and return decoded payload.
 * @param {string} token
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Express middleware: require valid Bearer JWT and attach `req.user`.
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return next(unauthorized('Missing or invalid Authorization header'));
    }

    const token = header.slice(7).trim();
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return next(unauthorized('Invalid or expired token'));
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return next(unauthorized('User no longer exists'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Express middleware: require one of the given user roles.
 * @param {...('assistant'|'client')} roles
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(forbidden('Insufficient permissions for this resource'));
    }
    next();
  };
}

/**
 * Enforce client scoping in middleware (BACKEND §9).
 * Resolves `clientId` from query/body/params (or `req.user.clientId` for client role,
 * or the assistant's first client if omitted when optional=true).
 * @param {{ optional?: boolean }} [opts]
 */
export function requireClientScope(opts = {}) {
  return async (req, _res, next) => {
    try {
      if (!req.user) return next(unauthorized());

      if (req.user.role === 'client') {
        if (!req.user.clientId) {
          return next(forbidden('Client account is not linked to a client profile'));
        }
        const requested = req.query.clientId || req.body?.clientId;
        if (requested && String(requested) !== String(req.user.clientId)) {
          return next(forbidden('Cannot access another client'));
        }
        req.clientId = String(req.user.clientId);
        return next();
      }

      // Assistant role
      let clientId = req.query.clientId || req.body?.clientId;
      if (!clientId) {
        if (!opts.optional) {
          return next(badRequest('clientId is required'));
        }
        const firstClient = await Client.findOne({ assistantId: req.user._id }).sort({ createdAt: 1 });
        if (!firstClient) {
          req.clientId = null;
          return next();
        }
        req.clientId = String(firstClient._id);
        return next();
      }

      const client = await Client.findOne({ _id: clientId, assistantId: req.user._id });
      if (!client) {
        return next(forbidden('You do not have access to this client'));
      }
      req.clientId = String(client._id);
      next();
    } catch (err) {
      next(err);
    }
  };
}
