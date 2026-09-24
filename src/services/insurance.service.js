const prisma = require('../config/database');
const AppError = require('../utils/appError');

class InsuranceService {
  async getInsuranceOverview(userContext, query = {}) {
    const { clientId } = query;
    const where = {};

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        name: true,
        plate: true,
        insuranceExpiry: true,
        status: true,
        clientId: true
      },
      orderBy: { insuranceExpiry: 'asc' }
    });

    return vehicles;
  }

  async updateInsuranceDate(userContext, vehicleId, newExpiryDate) {
    const vId = parseInt(vehicleId);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vId } });
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const updated = await prisma.vehicle.update({
      where: { id: vId },
      data: { insuranceExpiry: newExpiryDate }
    });

    return updated;
  }

  async renewInsurance(userContext, vehicleId) {
    const vId = parseInt(vehicleId);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vId } });
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    // Add 1 year to current expiry or current date
    const baseDate = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : new Date();
    if (isNaN(baseDate.getTime())) {
      baseDate.setTime(Date.now());
    }

    baseDate.setFullYear(baseDate.getFullYear() + 1);
    const renewedDateStr = baseDate.toISOString().split('T')[0];

    const updated = await prisma.vehicle.update({
      where: { id: vId },
      data: { insuranceExpiry: renewedDateStr }
    });

    return {
      vehicleId: updated.id,
      name: updated.name,
      plate: updated.plate,
      newInsuranceExpiry: updated.insuranceExpiry
    };
  }
}

module.exports = new InsuranceService();
