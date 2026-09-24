const prisma = require('../config/database');

class DashboardService {
  async getDashboardStats(userContext, query = {}) {
    const { clientId } = query;
    const vehicleWhere = {};
    const keuringWhere = {};
    const maintenanceWhere = {};
    const fuelWhere = {};

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      const tenantId = userContext.clientId;
      vehicleWhere.clientId = tenantId;
      keuringWhere.clientId = tenantId;
      maintenanceWhere.clientId = tenantId;
      fuelWhere.clientId = tenantId;
    } else if (clientId && clientId !== 'all') {
      const tenantId = parseInt(clientId);
      vehicleWhere.clientId = tenantId;
      keuringWhere.clientId = tenantId;
      maintenanceWhere.clientId = tenantId;
      fuelWhere.clientId = tenantId;
    }

    // 1. Vehicle counts
    const vehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,
      select: {
        id: true,
        name: true,
        plate: true,
        status: true,
        insuranceExpiry: true,
        keuringExpiry: true,
        gpsEnabled: true
      }
    });

    const totalVehicles = vehicles.length;
    const activeFleet = vehicles.filter(v => v.status === 'active').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
    const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;

    // Helper for 30-day expiry check
    const isExpiringSoon = (dateStr) => {
      if (!dateStr) return false;
      const expDate = new Date(dateStr);
      const today = new Date();
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    };

    const insuranceAlertCount = vehicles.filter(v => isExpiringSoon(v.insuranceExpiry)).length;

    // 2. Keuring alerts
    const keuringRecords = await prisma.keuringRecord.findMany({
      where: keuringWhere,
      select: { expiryDate: true, status: true }
    });

    const keuringAlertCount = keuringRecords.filter(r => 
      r.status === 'expired' || r.status === 'expiring_soon' || isExpiringSoon(r.expiryDate)
    ).length;

    // 3. Maintenance upcoming count
    const maintenanceLogs = await prisma.maintenanceLog.findMany({
      where: maintenanceWhere,
      select: { status: true, serviceType: true, date: true, provider: true, cost: true, vehicle: { select: { name: true } } }
    });

    const upcomingMaintenanceCount = maintenanceLogs.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length;

    // 4. Status distribution array
    const statusDistribution = [
      { name: 'Active Fleet', value: activeFleet, color: '#0ea5e9' },
      { name: 'In Maintenance', value: maintenanceVehicles, color: '#f59e0b' },
      { name: 'Inactive / Yard', value: inactiveVehicles, color: '#64748b' }
    ];

    // 5. Fuel trend data
    const fuelLogs = await prisma.fuelLog.findMany({
      where: fuelWhere,
      orderBy: { date: 'desc' },
      take: 10
    });

    const fuelTrendData = fuelLogs.map(log => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      liters: log.fuelAmount,
      cost: log.cost
    })).reverse();

    return {
      totalVehicles,
      activeFleet,
      maintenanceVehicles,
      inactiveVehicles,
      keuringAlertCount,
      insuranceAlertCount,
      upcomingMaintenanceCount,
      statusDistribution,
      fuelTrendData
    };
  }
}

module.exports = new DashboardService();
