const prisma = require('../config/database');
const AppError = require('../utils/appError');

class NotificationService {
  async getNotifications(userContext, query = {}) {
    const { type, read, clientId } = query;
    const where = {};

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    if (type && type !== 'all') {
      if (type === 'unread') {
        where.read = false;
      } else {
        where.type = type;
      }
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        vehicle: { select: { id: true, name: true, plate: true } }
      },
      orderBy: { timestamp: 'desc' }
    });

    return notifications.map(n => ({
      id: n.id,
      clientId: n.clientId,
      vehicleId: n.vehicleId,
      vehicleName: n.vehicle ? n.vehicle.name : 'System Alert',
      type: n.type,
      message: n.message,
      timestamp: n.timestamp.toISOString(),
      severity: n.severity,
      read: n.read
    }));
  }

  async markNotificationRead(userContext, id) {
    const notifId = parseInt(id);
    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { read: true }
    });
    return updated;
  }

  async markAllNotificationsRead(userContext, clientId) {
    const where = {};
    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    await prisma.notification.updateMany({
      where,
      data: { read: true }
    });

    return true;
  }

  async deleteNotification(userContext, id) {
    const notifId = parseInt(id);
    await prisma.notification.delete({ where: { id: notifId } });
    return true;
  }

  async createOverspeedAlert(vehicleId, currentSpeed, speedThreshold, locationAddress) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return;

    if (currentSpeed > speedThreshold) {
      await prisma.notification.create({
        data: {
          clientId: vehicle.clientId,
          vehicleId: vehicle.id,
          type: 'overspeed',
          message: `Overspeed Alert: Speed exceeded threshold (${currentSpeed} km/h vs ${speedThreshold} km/h) on ${locationAddress || 'highway'}`,
          severity: 'warning',
          read: false
        }
      });
    }
  }
}

module.exports = new NotificationService();
