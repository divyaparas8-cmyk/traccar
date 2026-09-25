const prisma = require('../config/database');
const AppError = require('../utils/appError');

class ReportService {
  async getReportSummary(userContext, query = {}) {
    const { category = 'overview', dateRange = 'month', vehicleId, clientId } = query;
    const where = {};

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    if (vehicleId && vehicleId !== 'all') {
      where.id = parseInt(vehicleId);
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        name: true,
        plate: true,
        odometer: true,
        insuranceExpiry: true,
        keuringExpiry: true,
        status: true,
        fuelLogs: {
          select: { cost: true }
        }
      }
    });

    return {
      category,
      dateRange,
      totalVehicles: vehicles.length,
      ledger: vehicles.map(v => {
        const totalFuel = v.fuelLogs?.reduce((sum, f) => sum + (f.cost || 0), 0) || 0;
        return {
          id: v.id,
          name: v.name,
          plate: v.plate,
          distanceKm: Math.round(v.odometer / 10),
          fuelSpent: parseFloat(totalFuel.toFixed(2)),
          keuringStatus: v.keuringExpiry < new Date().toISOString().split('T')[0] ? 'Expired' : 'Valid Pass',
          insuranceExpiry: v.insuranceExpiry
        };
      })
    };
  }

  async generateExport(userContext, body) {
    const { module: targetModule = 'vehicles', format = 'excel', dataScope = 'filtered', clientId } = body;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filenameBase = `fleetflow_${targetModule}_export_${timestamp}`;

    let headers = [];
    let rows = [];

    // Fetch datasets according to target module
    if (targetModule === 'fuel') {
      const logs = await prisma.fuelLog.findMany({ include: { vehicle: true } });
      headers = ['ID', 'Vehicle Name', 'Plate', 'Date', 'Liters', 'Cost ($)', 'Odometer (km)', 'Driver'];
      rows = logs.map(f => [f.id, f.vehicle?.name || '', f.vehicle?.plate || '', f.date, f.fuelAmount, f.cost, f.odometer, f.driverName]);
    } else if (targetModule === 'maintenance') {
      const logs = await prisma.maintenanceLog.findMany({ include: { vehicle: true } });
      headers = ['ID', 'Vehicle Name', 'Plate', 'Service Type', 'Date', 'Cost ($)', 'Status', 'Provider'];
      rows = logs.map(m => [m.id, m.vehicle?.name || '', m.vehicle?.plate || '', m.serviceType, m.date, m.cost, m.status, m.provider]);
    } else if (targetModule === 'keuring') {
      const records = await prisma.keuringRecord.findMany({ include: { vehicle: true } });
      headers = ['ID', 'Vehicle Name', 'Plate', 'Certificate #', 'Last Inspection', 'Expiry Date', 'Status', 'Station'];
      rows = records.map(k => [k.id, k.vehicle?.name || '', k.vehicle?.plate || '', k.certificateId, k.lastInspectionDate, k.expiryDate, k.status, k.station]);
    } else {
      const vehicles = await prisma.vehicle.findMany();
      headers = ['ID', 'Vehicle Name', 'License Plate', 'VIN', 'Make', 'Model', 'Status', 'Odometer (km)', 'Fuel Level (%)', 'GPS Enabled'];
      rows = vehicles.map(v => [v.id, v.name, v.plate, v.vin, v.make, v.model || '', v.status, v.odometer, v.fuelLevel, v.gpsEnabled ? 'Yes' : 'No']);
    }

    if (format === 'csv') {
      const csvString = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return {
        content: csvString,
        filename: `${filenameBase}.csv`,
        mimeType: 'text/csv; charset=utf-8'
      };
    } else if (format === 'excel') {
      const excelString = [
        headers.join('\t'),
        ...rows.map(r => r.map(cell => String(cell).replace(/\t/g, ' ')).join('\t'))
      ].join('\n');

      return {
        content: excelString,
        filename: `${filenameBase}.xlsx`,
        mimeType: 'application/vnd.ms-excel; charset=utf-8'
      };
    } else {
      const pdfContent = `FLEETFLOW ENTERPRISE REPORT - ${targetModule.toUpperCase()}\n\n` +
        headers.join(' | ') + '\n' +
        '-'.repeat(70) + '\n' +
        rows.map(r => r.join(' | ')).join('\n');

      return {
        content: pdfContent,
        filename: `${filenameBase}.pdf`,
        mimeType: 'application/pdf'
      };
    }
  }
}

module.exports = new ReportService();
