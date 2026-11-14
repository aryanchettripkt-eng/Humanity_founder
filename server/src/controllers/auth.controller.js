import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken } from '../middleware/auth.js';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';
import { badRequest, notFound, unauthorized } from '../utils/errors.js';

export const signupSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    email: z.string().trim().email('Valid email is required').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email('Valid email is required').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const demoSchema = {
  body: z.object({
    role: z.enum(['assistant', 'client']),
  }),
};

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return next(badRequest('An account with this email already exists', undefined, 'EMAIL_EXISTS'));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'assistant',
      onboarding: { completed: false, tourSeen: false },
    });

    const token = signToken(user);
    res.status(201).json({
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(unauthorized('Invalid email or password', 'INVALID_CREDENTIALS'));
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return next(unauthorized('Invalid email or password', 'INVALID_CREDENTIALS'));
    }

    const token = signToken(user);
    res.json({
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function demo(req, res, next) {
  try {
    const { role } = req.body;
    const demoEmail = role === 'assistant' ? 'alex@example.com' : 'priya@example.com';
    const user = await User.findOne({ email: demoEmail, role });
    if (!user) {
      return next(
        notFound(
          'Demo account not found. Run `npm run seed` to populate demo data.',
          'DEMO_NOT_SEEDED'
        )
      );
    }

    const token = signToken(user);
    res.json({
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    let clients = [];
    if (req.user.role === 'assistant') {
      const docs = await Client.find({ assistantId: req.user._id }).sort({ createdAt: 1 });
      clients = docs.map((c) => c.toJSON());
    } else if (req.user.clientId) {
      const doc = await Client.findById(req.user.clientId);
      if (doc) clients = [doc.toJSON()];
    }

    res.json({
      data: {
        user: req.user.toJSON(),
        clients,
      },
    });
  } catch (err) {
    next(err);
  }
}
