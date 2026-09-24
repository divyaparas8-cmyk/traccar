const notificationService = require('../services/notification.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class NotificationController {
  getNotifications = asyncHandler(async (req, res) => {
    const notifications = await notificationService.getNotifications(req.user, req.query);
    return sendSuccess(res, 200, 'System notifications retrieved', notifications);
  });

  markRead = asyncHandler(async (req, res) => {
    const updated = await notificationService.markNotificationRead(req.user, req.params.id);
    return sendSuccess(res, 200, 'Notification marked as read', updated);
  });

  markAllRead = asyncHandler(async (req, res) => {
    await notificationService.markAllNotificationsRead(req.user, req.query.clientId);
    return sendSuccess(res, 200, 'All alerts marked read', null);
  });

  deleteNotification = asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(req.user, req.params.id);
    return sendSuccess(res, 200, 'Notification deleted', null);
  });
}

module.exports = new NotificationController();
