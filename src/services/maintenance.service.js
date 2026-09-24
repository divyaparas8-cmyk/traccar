const prisma = require('../config/database');
const AppError = require('../utils/appError');

class MaintenanceService {
  async getMaintenanceLogs(userContext, query = {}) {
    const { search, status, clientId } = query;
    const where = {};

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { serviceType: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { vehicle: { name: { contains: search, mode: 'insensitive' } } },
        { vehicle: { plate: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: {
        vehicle: { select: { id: true, name: true, plate: true } }
      },
      orderBy: { date: 'desc' }
    });

    return logs.map(m => ({
      id: m.id,
      clientId: m.clientId,
      vehicleId: m.vehicleId,
      vehicleName: m.vehicle ? m.vehicle.name : 'Unknown Vehicle',
      plate: m.vehicle ? m.vehicle.plate : '',
      serviceType: m.serviceType,
      date: m.date,
      cost: m.cost,
      status: m.status,
      notes: m.notes || '',
      provider: m.provider
    }));
  }

  async createMaintenanceLog(userContext, data) {
    const vehicleId = parseInt(data.vehicleId);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Associated vehicle not found', 404);

    const initialStatus = data.status || 'scheduled';

    const log = await prisma.maintenanceLog.create({
      data: {
        clientId: vehicle.clientId,
        vehicleId: vehicle.id,
        serviceType: data.serviceType,
        date: data.date,
        cost: parseFloat(data.cost),
        status: initialStatus,
        provider: data.provider,
        notes: data.notes || ''
      },
      include: { vehicle: { select: { name: true, plate: true } } }
    });

    if (initialStatus === 'in_progress') {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: 'maintenance' }
      });
    }

    return {
      ...log,
      vehicleName: log.vehicle.name,
      plate: log.vehicle.plate
    };
  }

  async updateMaintenanceStatus(userContext, id, newStatus) {
    const logId = parseInt(id);
    const log = await prisma.maintenanceLog.findUnique({ where: { id: logId } });
    if (!log) throw new AppError('Maintenance record not found', 404);

    // Enforce state machine rules: scheduled -> in_progress -> completed
    const allowedTransitions = {
      scheduled: ['in_progress', 'completed'],
      in_progress: ['completed', 'scheduled'],
      completed: ['in_progress', 'scheduled']
    };

    if (!allowedTransitions[log.status].includes(newStatus)) {
      throw new AppError(`Invalid state transition from '${log.status}' to '${newStatus}'`, 400);
    }

    const updated = await prisma.maintenanceLog.update({
      where: { id: logId },
      data: { status: newStatus },
      include: { vehicle: { select: { name: true, plate: true } } }
    });

    // Update vehicle status according to maintenance lifecycle
    if (newStatus === 'in_progress') {
      await prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: 'maintenance' }
      });
    } else if (newStatus === 'completed') {
      await prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: 'active' }
      });
    }

    return {
      ...updated,
      vehicleName: updated.vehicle.name,
      plate: updated.vehicle.plate
    };
  }

  async updateMaintenanceLog(userContext, id, data) {
    const logId = parseInt(id);
    const updated = await prisma.maintenanceLog.update({
      where: { id: logId },
      data: {
        ...data,
        vehicleId: data.vehicleId ? parseInt(data.vehicleId) : undefined,
        cost: data.cost ? parseFloat(data.cost) : undefined
      },
      include: { vehicle: { select: { name: true, plate: true } } }
    });

    return {
      ...updated,
      vehicleName: updated.vehicle.name,
      plate: updated.vehicle.plate
    };
  }

  async deleteMaintenanceLog(userContext, id) {
    const logId = parseInt(id);
    await prisma.maintenanceLog.delete({ where: { id: logId } });
    return true;
  }
}

module.exports = new MaintenanceService();
