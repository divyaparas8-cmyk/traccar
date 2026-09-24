const prisma = require('../config/database');
const AppError = require('../utils/appError');

class VehicleService {
  async getVehicles(userContext, query = {}) {
    const { search, status, gpsFilter, clientId } = query;
    const where = {};

    // Multi-Tenant Isolation Rule
    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (gpsFilter === 'gps') {
      where.gpsEnabled = true;
    } else if (gpsFilter === 'nongps') {
      where.gpsEnabled = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { plate: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } }
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        driver: {
          select: { id: true, name: true, phone: true, email: true, licenseNumber: true, avatar: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    return vehicles;
  }

  async getVehicleById(userContext, id) {
    const where = { id: parseInt(id) };

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    }

    const vehicle = await prisma.vehicle.findFirst({
      where,
      include: {
        driver: true,
        fuelLogs: { orderBy: { date: 'desc' }, take: 10 },
        maintenanceLogs: { orderBy: { date: 'desc' }, take: 10 },
        keuringRecords: { orderBy: { expiryDate: 'desc' }, take: 10 },
        documents: { orderBy: { uploadDate: 'desc' }, take: 10 }
      }
    });

    if (!vehicle) {
      throw new AppError('Vehicle record not found', 404);
    }

    return vehicle;
  }

  async createVehicle(userContext, data) {
    const targetClientId = userContext.role === 'PLATFORM_OPERATIONS_MANAGER'
      ? (data.clientId ? parseInt(data.clientId) : userContext.clientId || 1)
      : userContext.clientId;

    // Check unique plate & vin
    const existingPlate = await prisma.vehicle.findUnique({ where: { plate: data.plate } });
    if (existingPlate) throw new AppError(`Vehicle license plate '${data.plate}' already exists`, 409);

    const existingVin = await prisma.vehicle.findUnique({ where: { vin: data.vin } });
    if (existingVin) throw new AppError(`Vehicle VIN '${data.vin}' already exists`, 409);

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        clientId: targetClientId,
        driverId: data.driverId ? parseInt(data.driverId) : null,
        traccarDeviceId: data.traccarDeviceId ? parseInt(data.traccarDeviceId) : null,
        manufactureYear: data.manufactureYear ? parseInt(data.manufactureYear) : 2023,
        odometer: data.odometer ? parseInt(data.odometer) : 0,
        tankCapacity: data.tankCapacity ? parseFloat(data.tankCapacity) : 500,
        grossPayload: data.grossPayload ? parseFloat(data.grossPayload) : 30.0,
        netPayload: data.netPayload ? parseFloat(data.netPayload) : 18.0
      }
    });

    // If driver was selected, map assignedVehicleId on driver
    if (vehicle.driverId) {
      await prisma.driver.update({
        where: { id: vehicle.driverId },
        data: { assignedVehicleId: vehicle.id }
      });
    }

    return vehicle;
  }

  async updateVehicle(userContext, id, data) {
    const vehicleId = parseInt(id);
    const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!existing) throw new AppError('Vehicle not found', 404);

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER' && existing.clientId !== userContext.clientId) {
      throw new AppError('Unauthorized access to vehicle record', 403);
    }

    const updatePayload = { ...data };
    if (data.driverId !== undefined) {
      updatePayload.driverId = data.driverId ? parseInt(data.driverId) : null;
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: updatePayload
    });

    if (data.driverId !== undefined) {
      if (data.driverId) {
        await prisma.driver.update({
          where: { id: parseInt(data.driverId) },
          data: { assignedVehicleId: vehicleId }
        });
      }
    }

    return updated;
  }

  async deleteVehicle(userContext, id) {
    const vehicleId = parseInt(id);
    const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!existing) throw new AppError('Vehicle not found', 404);

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER' && existing.clientId !== userContext.clientId) {
      throw new AppError('Unauthorized access to vehicle record', 403);
    }

    // Unassign driver if any
    if (existing.driverId) {
      await prisma.driver.update({
        where: { id: existing.driverId },
        data: { assignedVehicleId: null }
      });
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });
    return true;
  }
}

module.exports = new VehicleService();
