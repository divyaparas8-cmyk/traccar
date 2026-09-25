const prisma = require('../config/database');
const AppError = require('../utils/appError');

class TelematicsProviderInterface {
  async getLivePositions(userContext, query) { throw new Error('Not implemented'); }
  async getRouteHistory(vehicleId, date, startTime, endTime) { throw new Error('Not implemented'); }
}

class TelematicsSimulatorProvider extends TelematicsProviderInterface {
  async getLivePositions(userContext, query = {}) {
    const { clientId } = query;
    const where = { gpsEnabled: true };

    if (userContext.role !== 'PLATFORM_OPERATIONS_MANAGER') {
      where.clientId = userContext.clientId;
    } else if (clientId && clientId !== 'all') {
      where.clientId = parseInt(clientId);
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        clientId: true,
        name: true,
        plate: true,
        speed: true,
        fuelLevel: true,
        battery: true,
        address: true,
        lat: true,
        lng: true,
        course: true,
        status: true,
        driverId: true,
        trackerImei: true,
        lastUpdate: true
      },
      orderBy: { id: 'asc' }
    });

    return vehicles;
  }

  async getRouteHistory(vehicleId, date, startTime, endTime) {
    const vId = parseInt(vehicleId);

    // Retrieve recorded waypoints or mock generated trajectory
    const waypoints = await prisma.routeHistory.findMany({
      where: { vehicleId: vId },
      orderBy: { timestamp: 'asc' }
    });

    if (waypoints.length > 0) {
      const maxSpeed = Math.max(...waypoints.map(w => w.speed));
      const avgSpeed = Math.round(waypoints.reduce((sum, w) => sum + w.speed, 0) / waypoints.length);
      const idleCount = waypoints.filter(w => w.speed === 0).length;

      return {
        summary: {
          totalDistanceKm: Math.round(waypoints.length * 12.5),
          duration: `${Math.floor(waypoints.length * 0.8)}h ${Math.round((waypoints.length * 48) % 60)}m`,
          maxSpeedKm: maxSpeed || 80,
          avgSpeedKm: avgSpeed || 65,
          idleMinutes: idleCount * 5
        },
        waypoints: waypoints.map(w => ({
          lat: w.lat,
          lng: w.lng,
          speed: w.speed,
          course: w.course,
          timestamp: w.timestamp.toISOString(),
          address: w.address || ''
        }))
      };
    }

    // Dynamic trajectory generator based on actual vehicle DB position
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vId },
      select: { lat: true, lng: true, address: true, speed: true, name: true, plate: true }
    });

    const baseLat = vehicle?.lat || 48.8566;
    const baseLng = vehicle?.lng || 2.3522;
    const baseAddress = vehicle?.address || 'Depot Terminal';
    const targetDate = date || new Date().toISOString().split('T')[0];

    const generatedWaypoints = [
      { lat: baseLat, lng: baseLng, speed: 0, course: 0, timestamp: `${targetDate}T08:00:00Z`, address: baseAddress },
      { lat: baseLat + 0.03, lng: baseLng + 0.04, speed: 45, course: 45, timestamp: `${targetDate}T08:30:00Z`, address: `${baseAddress} (En route)` },
      { lat: baseLat + 0.07, lng: baseLng + 0.09, speed: 72, course: 60, timestamp: `${targetDate}T09:15:00Z`, address: `Transit Corridor near ${baseAddress}` },
      { lat: baseLat + 0.12, lng: baseLng + 0.15, speed: 68, course: 90, timestamp: `${targetDate}T12:00:00Z`, address: `Destination Point for ${vehicle?.name || 'Vehicle'}` }
    ];

    return {
      summary: {
        totalDistanceKm: Math.round((vehicle?.speed || 60) * 2.5),
        duration: '3h 30m',
        maxSpeedKm: Math.max(72, vehicle?.speed || 0),
        avgSpeedKm: 58,
        idleMinutes: 15
      },
      waypoints: generatedWaypoints
    };
  }
}

class TelematicsService {
  constructor() {
    // Configurable provider abstraction. Swappable for real Traccar Provider.
    this.provider = new TelematicsSimulatorProvider();
  }

  async getLivePositions(userContext, query) {
    return this.provider.getLivePositions(userContext, query);
  }

  async getRouteHistory(vehicleId, date, startTime, endTime) {
    return this.provider.getRouteHistory(vehicleId, date, startTime, endTime);
  }
}

module.exports = new TelematicsService();
