const prisma = require('../config/database');
const AppError = require('../utils/appError');

class KeuringService {
  calculateKeuringStatus(expiryDateStr) {
    if (!expiryDateStr) return 'valid';
    const expDate = new Date(expiryDateStr);
    const today = new Date();
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'expired';
    if (diffDays <= 30) return 'expiring_soon';
    return 'valid';
  }

  async getKeuringRecords(userContext, query = {}) {
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
        { certificateId: { contains: search, mode: 'insensitive' } },
        { station: { contains: search, mode: 'insensitive' } },
        { vehicle: { name: { contains: search, mode: 'insensitive' } } },
        { vehicle: { plate: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const records = await prisma.keuringRecord.findMany({
      where,
      include: {
        vehicle: { select: { id: true, name: true, plate: true } }
      },
      orderBy: { expiryDate: 'asc' }
    });

    return records.map(k => ({
      id: k.id,
      clientId: k.clientId,
      vehicleId: k.vehicleId,
      vehicleName: k.vehicle ? k.vehicle.name : 'Unknown Vehicle',
      plate: k.vehicle ? k.vehicle.plate : '',
      certificateId: k.certificateId,
      lastInspectionDate: k.lastInspectionDate,
      expiryDate: k.expiryDate,
      station: k.station,
      result: k.result,
      status: this.calculateKeuringStatus(k.expiryDate), // Authoritative backend status calculation
      notes: k.notes || '',
      documentUrl: k.documentUrl || '',
      inspectorName: k.inspectorName || ''
    }));
  }

  async createKeuringRecord(userContext, data) {
    const vehicleId = parseInt(data.vehicleId);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Associated vehicle not found', 404);

    const existingCert = await prisma.keuringRecord.findUnique({
      where: { certificateId: data.certificateId }
    });
    if (existingCert) throw new AppError(`Certificate ID '${data.certificateId}' already registered`, 409);

    const calculatedStatus = this.calculateKeuringStatus(data.expiryDate);

    const record = await prisma.keuringRecord.create({
      data: {
        clientId: vehicle.clientId,
        vehicleId: vehicle.id,
        certificateId: data.certificateId,
        lastInspectionDate: data.lastInspectionDate || new Date().toISOString().split('T')[0],
        expiryDate: data.expiryDate,
        station: data.station,
        result: data.result || 'passed',
        status: calculatedStatus,
        notes: data.notes || '',
        inspectorName: data.inspectorName || ''
      },
      include: { vehicle: { select: { name: true, plate: true } } }
    });

    // Update vehicle's keuringExpiry field
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { keuringExpiry: data.expiryDate }
    });

    return {
      ...record,
      vehicleName: record.vehicle.name,
      plate: record.vehicle.plate
    };
  }

  async updateKeuringRecord(userContext, id, data) {
    const recordId = parseInt(id);
    const calculatedStatus = data.expiryDate ? this.calculateKeuringStatus(data.expiryDate) : undefined;

    const updated = await prisma.keuringRecord.update({
      where: { id: recordId },
      data: {
        ...data,
        vehicleId: data.vehicleId ? parseInt(data.vehicleId) : undefined,
        status: calculatedStatus
      },
      include: { vehicle: { select: { name: true, plate: true } } }
    });

    if (data.expiryDate) {
      await prisma.vehicle.update({
        where: { id: updated.vehicleId },
        data: { keuringExpiry: data.expiryDate }
      });
    }

    return {
      ...updated,
      vehicleName: updated.vehicle.name,
      plate: updated.vehicle.plate
    };
  }

  async deleteKeuringRecord(userContext, id) {
    const recordId = parseInt(id);
    await prisma.keuringRecord.delete({ where: { id: recordId } });
    return true;
  }
}

module.exports = new KeuringService();
