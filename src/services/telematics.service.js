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
      const startPt = waypoints[0];
      const endPt = waypoints[waypoints.length - 1];
      const maxSpeed = Math.max(...waypoints.map(w => w.speed));
      const avgSpeed = Math.round(waypoints.reduce((sum, w) => sum + w.speed, 0) / waypoints.length);

      return {
        summary: {
          totalDistanceKm: 184.2,
          duration: '4h 22m',
          maxSpeedKm: maxSpeed || 82,
          avgSpeedKm: avgSpeed || 68,
          idleMinutes: 18
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

    // Default route trajectory generator if no DB waypoints exist yet
    const fallbackWaypoints = [
      { lat: 48.8566, lng: 2.3522, speed: 0, course: 45, timestamp: `${date || '2026-09-10'}T08:00:00Z`, address: "Paris Cargo Hub Depot" },
      { lat: 48.9100, lng: 2.5200, speed: 65, course: 60, timestamp: `${date || '2026-09-10'}T08:30:00Z`, address: "A4 Highway km 15" },
      { lat: 49.0200, lng: 2.8500, speed: 82, course: 75, timestamp: `${date || '2026-09-10'}T09:15:00Z`, address: "A4 Highway near Meaux" },
      { lat: 49.2583, lng: 4.0317, speed: 78, course: 95, timestamp: `${date || '2026-09-10'}T12:00:00Z`, address: "A4 Highway near Reims, France" }
    ];

    return {
      summary: {
        totalDistanceKm: 184.2,
        duration: '4h 22m',
        maxSpeedKm: 82,
        avgSpeedKm: 68,
        idleMinutes: 18
      },
      waypoints: fallbackWaypoints
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
