const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, 200, 'Logged in successfully', result);
  });

  refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return sendSuccess(res, 200, 'Token refreshed successfully', result);
  });

  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(req.user.id, refreshToken);
    return sendSuccess(res, 200, 'Logged out successfully', null);
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, 200, 'Current user retrieved', user);
  });

  updateProfile = asyncHandler(async (req, res) => {
    const updated = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, 200, 'Settings configurations saved', updated);
  });
}

module.exports = new AuthController();
