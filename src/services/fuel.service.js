const prisma = require('../config/database');
const AppError = require('../utils/appError');

class FuelService {
  async getFuelLogs(userContext, query = {}) {
    const { search, clientId } = query;
    const where = {};

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    if (search) {
      where.OR = [
        { driverName: { contains: search, mode: 'insensitive' } },
        { vehicle: { name: { contains: search, mode: 'insensitive' } } },
        { vehicle: { plate: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const fuelLogs = await prisma.fuelLog.findMany({
      where,
      include: {
        vehicle: { select: { id: true, name: true, plate: true } }
      },
      orderBy: { date: 'desc' }
    });

    return fuelLogs.map(f => ({
      id: f.id,
      clientId: f.clientId,
      vehicleId: f.vehicleId,
      vehicleName: f.vehicle ? f.vehicle.name : 'Unknown Vehicle',
      plate: f.vehicle ? f.vehicle.plate : '',
      date: f.date,
      fuelAmount: f.fuelAmount,
      cost: f.cost,
      odometer: f.odometer,
      driverName: f.driverName
    }));
  }

  async createFuelLog(userContext, data) {
    const vehicleId = parseInt(data.vehicleId);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Associated vehicle not found', 404);

    const fuelLog = await prisma.fuelLog.create({
      data: {
        clientId: vehicle.clientId,
        vehicleId: vehicle.id,
        date: data.date,
        fuelAmount: parseFloat(data.fuelAmount),
        cost: parseFloat(data.cost),
        odometer: parseInt(data.odometer),
        driverName: data.driverName
      },
      include: { vehicle: { select: { name: true, plate: true } } }
    });

    // Update vehicle odometer if reading is higher
    if (data.odometer > vehicle.odometer) {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { odometer: parseInt(data.odometer) }
      });
    }

    return {
      ...fuelLog,
      vehicleName: fuelLog.vehicle.name,
      plate: fuelLog.vehicle.plate
    };
  }

  async updateFuelLog(userContext, id, data) {
    const logId = parseInt(id);
    const existing = await prisma.fuelLog.findUnique({ where: { id: logId } });
    if (!existing) throw new AppError('Fuel log entry not found', 404);

    const updated = await prisma.fuelLog.update({
      where: { id: logId },
      data: {
        ...data,
        vehicleId: data.vehicleId ? parseInt(data.vehicleId) : undefined,
        fuelAmount: data.fuelAmount ? parseFloat(data.fuelAmount) : undefined,
        cost: data.cost ? parseFloat(data.cost) : undefined,
        odometer: data.odometer ? parseInt(data.odometer) : undefined
      },
      include: { vehicle: { select: { name: true, plate: true } } }
    });

    return {
      ...updated,
      vehicleName: updated.vehicle.name,
      plate: updated.vehicle.plate
    };
  }

  async deleteFuelLog(userContext, id) {
    const logId = parseInt(id);
    await prisma.fuelLog.delete({ where: { id: logId } });
    return true;
  }
}

module.exports = new FuelService();
