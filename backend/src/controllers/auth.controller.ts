import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { ENV } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN as any }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role = 'CITIZEN' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || null,
        role: role.toUpperCase(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        departmentId: true,
        createdAt: true,
      },
    });

    const tokens = generateTokens(user);

    // Initial welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to ResolvAI Platform!',
        message: 'Your account is ready. You can now submit service requests or chat with our 24/7 AI assistant.',
        type: 'SYSTEM',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, ...tokens },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { department: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const tokens = generateTokens(user);

    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      success: true,
      message: 'Login successful',
      data: { user: safeUser, ...tokens },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email is required.' });
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { department: true },
    });

    if (!user) {
      // Auto-provision citizen account with random password
      const randomPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          passwordHash,
          role: 'CITIZEN',
          avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
        },
        include: { department: true },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome via Google Sign-In!',
          message: 'Your citizen profile was created automatically.',
          type: 'SYSTEM',
        },
      });
    }

    const tokens = generateTokens(user);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Google authentication successful',
      data: { user: safeUser, ...tokens },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const tokens = generateTokens(user);
    return res.json({
      success: true,
      data: tokens,
    });
  } catch (error: any) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        department: true,
        _count: {
          select: {
            complaintsFiled: true,
            assignedComplaints: true,
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { passwordHash: _, ...safeUser } = user;

    return res.json({ success: true, data: safeUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
