const prisma = require('../config/database');
const AppError = require('../utils/appError');

class DriverService {
  async getDrivers(userContext, query = {}) {
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
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        assignedVehicle: {
          select: { id: true, name: true, plate: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    return drivers;
  }

  async getDriverById(userContext, id) {
    const driverId = parseInt(id);
    const where = { id: driverId };

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    }

    const driver = await prisma.driver.findFirst({
      where,
      include: {
        assignedVehicle: true,
        assignmentHistories: {
          include: { vehicle: { select: { name: true, plate: true } } },
          orderBy: { assignedAt: 'desc' }
        }
      }
    });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    return driver;
  }

  async createDriver(userContext, data) {
    const targetClientId = userContext.role === 'PLATFORM_OPERATIONS_MANAGER'
      ? (data.clientId ? parseInt(data.clientId) : userContext.clientId || 1)
      : userContext.clientId;

    const existingEmail = await prisma.driver.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new AppError(`Driver email '${data.email}' already exists`, 409);

    const existingLicense = await prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (existingLicense) throw new AppError(`License number '${data.licenseNumber}' already registered`, 409);

    const vehicleId = data.assignedVehicleId ? parseInt(data.assignedVehicleId) : null;

    const driver = await prisma.driver.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        licenseNumber: data.licenseNumber,
        experience: data.experience || '3 years',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        clientId: targetClientId,
        assignedVehicleId: vehicleId
      }
    });

    if (vehicleId) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { driverId: driver.id }
      });

      await prisma.driverAssignmentHistory.create({
        data: {
          driverId: driver.id,
          vehicleId: vehicleId,
          status: 'Active Assignment'
        }
      });
    }

    return driver;
  }

  async updateDriver(userContext, id, data) {
    const driverId = parseInt(id);
    const existing = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!existing) throw new AppError('Driver profile not found', 404);

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER' && existing.clientId !== userContext.clientId) {
      throw new AppError('Unauthorized access to driver record', 403);
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data
    });

    return updated;
  }

  async deleteDriver(userContext, id) {
    const driverId = parseInt(id);
    const existing = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!existing) throw new AppError('Driver profile not found', 404);

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER' && existing.clientId !== userContext.clientId) {
      throw new AppError('Unauthorized access to driver record', 403);
    }

    if (existing.assignedVehicleId) {
      await prisma.vehicle.update({
        where: { id: existing.assignedVehicleId },
        data: { driverId: null }
      });
    }

    await prisma.driver.delete({ where: { id: driverId } });
    return true;
  }

  async assignVehicle(userContext, driverId, vehicleId) {
    const dId = parseInt(driverId);
    const targetVehicleId = vehicleId ? parseInt(vehicleId) : null;

    const driver = await prisma.driver.findUnique({ where: { id: dId } });
    if (!driver) throw new AppError('Driver not found', 404);

    // If currently assigned to a vehicle, clear old vehicle driverId
    if (driver.assignedVehicleId) {
      await prisma.vehicle.update({
        where: { id: driver.assignedVehicleId },
        data: { driverId: null }
      });

      // Update assignment history
      await prisma.driverAssignmentHistory.updateMany({
        where: { driverId: dId, unassignedAt: null },
        data: { unassignedAt: new Date(), status: 'Reassigned' }
      });
    }

    if (targetVehicleId) {
      // Clear any driver currently assigned to targetVehicleId
      const targetVehicle = await prisma.vehicle.findUnique({ where: { id: targetVehicleId } });
      if (targetVehicle && targetVehicle.driverId) {
        await prisma.driver.update({
          where: { id: targetVehicle.driverId },
          data: { assignedVehicleId: null }
        });
      }

      await prisma.driver.update({
        where: { id: dId },
        data: { assignedVehicleId: targetVehicleId }
      });

      await prisma.vehicle.update({
        where: { id: targetVehicleId },
        data: { driverId: dId }
      });

      await prisma.driverAssignmentHistory.create({
        data: {
          driverId: dId,
          vehicleId: targetVehicleId,
          status: 'Active Assignment'
        }
      });
    } else {
      await prisma.driver.update({
        where: { id: dId },
        data: { assignedVehicleId: null }
      });
    }

    return true;
  }
}

module.exports = new DriverService();
