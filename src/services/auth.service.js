const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const AppError = require('../utils/appError');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

class AuthService {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { client: true }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Hash refresh token before storing in database
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        clientId: user.clientId ? String(user.clientId) : null
      }
    };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Find valid tokens for user
    const storedTokens = await prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    let matchedTokenRecord = null;
    for (const record of storedTokens) {
      const match = await bcrypt.compare(refreshToken, record.tokenHash);
      if (match) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      throw new AppError('Refresh token has been revoked or is invalid', 401);
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: matchedTokenRecord.id },
      data: { revokedAt: new Date() }
    });

    // Issue new tokens (Token Rotation)
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const newTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: user.id,
        expiresAt
      }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      const storedTokens = await prisma.refreshToken.findMany({
        where: { userId, revokedAt: null }
      });

      for (const record of storedTokens) {
        const match = await bcrypt.compare(refreshToken, record.tokenHash);
        if (match) {
          await prisma.refreshToken.update({
            where: { id: record.id },
            data: { revokedAt: new Date() }
          });
          break;
        }
      }
    }
    return true;
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        language: true,
        speedThreshold: true,
        idleAlertMinutes: true,
        receivePushNotifications: true,
        receiveEmailNotifications: true,
        clientId: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(userId, updateData) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        language: true,
        speedThreshold: true,
        idleAlertMinutes: true,
        receivePushNotifications: true,
        receiveEmailNotifications: true,
        clientId: true
      }
    });

    return user;
  }
}

module.exports = new AuthService();
