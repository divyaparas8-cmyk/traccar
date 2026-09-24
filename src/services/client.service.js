const prisma = require('../config/database');
const AppError = require('../utils/appError');

class ClientService {
  async getClients(query = {}) {
    const { search, status } = query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: {
          select: {
            vehicles: true,
            drivers: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    return clients.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      email: c.email,
      phone: c.phone || '',
      address: c.address || '',
      status: c.status,
      vehicleCount: c._count.vehicles,
      driverCount: c._count.drivers,
      createdDate: c.createdDate
    }));
  }

  async getClientById(id) {
    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            vehicles: true,
            drivers: true
          }
        }
      }
    });

    if (!client) {
      throw new AppError('Client tenant account not found', 404);
    }

    return {
      ...client,
      vehicleCount: client._count.vehicles,
      driverCount: client._count.drivers
    };
  }

  async createClient(data) {
    const existingCode = await prisma.client.findUnique({
      where: { code: data.code.toUpperCase() }
    });

    if (existingCode) {
      throw new AppError(`Client code '${data.code}' already exists`, 409);
    }

    const newClient = await prisma.client.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        createdDate: new Date().toISOString().split('T')[0]
      }
    });

    return {
      ...newClient,
      vehicleCount: 0,
      driverCount: 0
    };
  }

  async updateClient(id, data) {
    if (data.code) {
      data.code = data.code.toUpperCase();
    }

    const updated = await prisma.client.update({
      where: { id: parseInt(id) },
      data
    });

    return updated;
  }

  async deleteClient(id) {
    await prisma.client.delete({
      where: { id: parseInt(id) }
    });
    return true;
  }
}

module.exports = new ClientService();
