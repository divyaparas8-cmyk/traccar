const prisma = require('../config/database');
const AppError = require('../utils/appError');
const storageService = require('./storage.service');

class DocumentService {
  async getDocuments(userContext, query = {}) {
    const { search, category, vehicleId, clientId } = query;
    const where = {};

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (vehicleId) {
      where.vehicleId = parseInt(vehicleId);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { vehicle: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const docs = await prisma.document.findMany({
      where,
      include: {
        vehicle: { select: { id: true, name: true, plate: true } }
      },
      orderBy: { uploadDate: 'desc' }
    });

    return docs.map(d => ({
      id: d.id,
      clientId: d.clientId,
      vehicleId: d.vehicleId,
      vehicleName: d.vehicle ? d.vehicle.name : 'General Fleet Attachment',
      title: d.title,
      category: d.category,
      size: d.size,
      uploadDate: d.uploadDate,
      expiryDate: d.expiryDate || 'N/A',
      fileUrl: d.fileUrl || ''
    }));
  }

  async uploadDocument(userContext, data, fileInfo = null) {
    let size = '1.5 MB';
    let fileUrl = '';

    if (fileInfo && fileInfo.buffer) {
      const uploaded = await storageService.uploadFile(fileInfo.buffer, fileInfo.originalname, fileInfo.mimetype);
      size = uploaded.size;
      fileUrl = uploaded.fileUrl;
    }

    const vehicleId = data.vehicleId ? parseInt(data.vehicleId) : null;
    let targetClientId = userContext.clientId;

    if (vehicleId) {
      const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (v) targetClientId = v.clientId;
    }

    const doc = await prisma.document.create({
      data: {
        clientId: targetClientId || 1,
        vehicleId: vehicleId,
        title: data.title,
        category: data.category || 'Insurance',
        size: size,
        uploadDate: new Date().toISOString().split('T')[0],
        expiryDate: data.expiryDate || '2027-01-01',
        fileUrl: fileUrl
      },
      include: { vehicle: { select: { name: true, plate: true } } }
    });

    return {
      ...doc,
      vehicleName: doc.vehicle ? doc.vehicle.name : 'General Fleet Attachment'
    };
  }

  async deleteDocument(userContext, id) {
    const docId = parseInt(id);
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) throw new AppError('Document record not found', 404);

    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
      const filename = doc.fileUrl.replace('/uploads/', '');
      await storageService.deleteFile(filename);
    }

    await prisma.document.delete({ where: { id: docId } });
    return true;
  }
}

module.exports = new DocumentService();
