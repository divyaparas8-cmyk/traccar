const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');

const requireAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please provide an access token.', 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    
    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId
    };

    next();
  } catch (err) {
    return next(new AppError('Invalid or expired access token.', 401));
  }
});

module.exports = {
  requireAuth
};
