const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FleetFlow database...');

  // 1. Create Default Admin Passwords & Users
  const passwordHash = await bcrypt.hash('admin123', 12);

  // 2. Seed Clients
  const client1 = await prisma.client.upsert({
    where: { code: 'WISHU-TR' },
    update: {},
    create: {
      id: 1,
      name: 'Wishu Transport',
      code: 'WISHU-TR',
      email: 'contact@wishutransport.com',
      phone: '+31 20 555 0192',
      address: 'Logistics Park Hub 4, Amsterdam, Netherlands',
      status: 'active',
      createdDate: '2024-01-15'
    }
  });

  const client2 = await prisma.client.upsert({
    where: { code: 'GLO-LOG' },
    update: {},
    create: {
      id: 2,
      name: 'Global Logistics Corp',
      code: 'GLO-LOG',
      email: 'dispatch@globallogistics.com',
      phone: '+49 30 889 1204',
      address: 'Industrial Way 12, Frankfurt, Germany',
      status: 'active',
      createdDate: '2024-05-10'
    }
  });

  const client3 = await prisma.client.upsert({
    where: { code: 'TA-EXP' },
    update: {},
    create: {
      id: 3,
      name: 'TransAfrica Express',
      code: 'TA-EXP',
      email: 'ops@transafrica.co.za',
      phone: '+27 11 409 3321',
      address: 'Cargo Terminal South, Johannesburg, South Africa',
      status: 'active',
      createdDate: '2025-02-01'
    }
  });

  // Seed Users
  await prisma.user.upsert({
    where: { email: 'admin@fleetflow.com' },
    update: {},
    create: {
      name: 'Alexander Mercer',
      email: 'admin@fleetflow.com',
      passwordHash: passwordHash,
      role: 'PLATFORM_OPERATIONS_MANAGER',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      language: 'en',
      speedThreshold: 80,
      idleAlertMinutes: 15,
      clientId: 1
    }
  });

  await prisma.user.upsert({
    where: { email: 'manager@wishutransport.com' },
    update: {},
    create: {
      name: 'Sarah Fleet Manager',
      email: 'manager@wishutransport.com',
      passwordHash: passwordHash,
      role: 'FLEET_MANAGER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      clientId: 1
    }
  });

  // 3. Seed Vehicles
  const mockVehicles = [
    {
      id: 1,
      clientId: 1,
      name: "Scania R450 Heavy Cargo",
      plate: "CA-882-TR",
      vin: "YS2R4X20002938411",
      engineNumber: "DC13-148-L01-9921",
      make: "Scania",
      model: "R450 Streamline",
      manufactureYear: 2022,
      type: "truck",
      status: "active",
      gpsEnabled: true,
      speed: 78,
      fuelLevel: 62,
      battery: 24.2,
      address: "A4 Highway, near Reims, France",
      odometer: 145230,
      fuelType: "Diesel",
      tankCapacity: 600,
      grossPayload: 40.0,
      netPayload: 26.5,
      traccarDeviceId: 101,
      trackerImei: "864209048123951",
      insuranceExpiry: "2026-09-15",
      keuringExpiry: "2026-10-20",
      maintenanceDue: "2026-09-25",
      photo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600",
      lat: 49.2583,
      lng: 4.0317,
      course: 95
    },
    {
      id: 2,
      clientId: 1,
      name: "Ford Transit Express",
      plate: "NY-771-FD",
      vin: "1FTNE3189HDA49201",
      engineNumber: "ECO-20L-449102",
      make: "Ford",
      model: "Transit 350 HD",
      manufactureYear: 2023,
      type: "van",
      status: "active",
      gpsEnabled: true,
      speed: 42,
      fuelLevel: 45,
      battery: 12.6,
      address: "5th Avenue, New York, USA",
      odometer: 48900,
      fuelType: "Diesel",
      tankCapacity: 95,
      grossPayload: 4.5,
      netPayload: 2.1,
      traccarDeviceId: 102,
      trackerImei: "864209048123952",
      insuranceExpiry: "2027-02-10",
      keuringExpiry: "2026-09-18",
      maintenanceDue: "2026-11-05",
      photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600",
      lat: 40.7749,
      lng: -73.9654,
      course: 180
    },
    {
      id: 3,
      clientId: 1,
      name: "Tesla Model Y Service",
      plate: "TX-404-EL",
      vin: "5YJYGDEF8MF019284",
      engineNumber: "DUAL-MOTOR-3D1",
      make: "Tesla",
      model: "Model Y Long Range",
      manufactureYear: 2024,
      type: "car",
      status: "maintenance",
      gpsEnabled: true,
      speed: 0,
      fuelLevel: 88,
      battery: 14.1,
      address: "Tesla Service Center, Austin, USA",
      odometer: 23150,
      fuelType: "Electric",
      tankCapacity: 75,
      grossPayload: 2.4,
      netPayload: 0.6,
      traccarDeviceId: 103,
      trackerImei: "864209048123953",
      insuranceExpiry: "2026-09-18",
      keuringExpiry: "2027-04-12",
      maintenanceDue: "2026-09-10",
      photo: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600",
      lat: 30.2672,
      lng: -97.7431,
      course: 0
    },
    {
      id: 4,
      clientId: 1,
      name: "Volvo Electric Bus 7900",
      plate: "SE-993-VO",
      vin: "YV3A01C17FA920194",
      engineNumber: "VOLVO-E-550KW",
      make: "Volvo",
      model: "7900 Electric",
      manufactureYear: 2023,
      type: "bus",
      status: "active",
      gpsEnabled: true,
      speed: 35,
      fuelLevel: 51,
      battery: 24.8,
      address: "Kungsgatan, Stockholm, Sweden",
      odometer: 98120,
      fuelType: "Electric",
      tankCapacity: 264,
      grossPayload: 19.5,
      netPayload: 8.2,
      traccarDeviceId: 104,
      trackerImei: "864209048123954",
      insuranceExpiry: "2026-11-30",
      keuringExpiry: "2026-12-15",
      maintenanceDue: "2026-09-12",
      photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600",
      lat: 59.3345,
      lng: 18.0632,
      course: 270
    },
    {
      id: 5,
      clientId: 1,
      name: "Toyota Hilux Utility",
      plate: "ZA-102-TO",
      vin: "AHTFR22G906019382",
      engineNumber: "1GD-FTV-88201",
      make: "Toyota",
      model: "Hilux Double Cab 2.8D",
      manufactureYear: 2021,
      type: "car",
      status: "inactive",
      gpsEnabled: false,
      speed: 0,
      fuelLevel: 12,
      battery: 11.9,
      address: "Johannesburg Storage Yard, South Africa",
      odometer: 189400,
      fuelType: "Diesel",
      tankCapacity: 80,
      grossPayload: 3.1,
      netPayload: 1.0,
      traccarDeviceId: null,
      trackerImei: null,
      insuranceExpiry: "2026-09-12",
      keuringExpiry: "2026-09-05",
      maintenanceDue: "2026-09-15",
      photo: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600",
      lat: -26.2041,
      lng: 28.0473,
      course: 0
    },
    {
      id: 6,
      clientId: 1,
      name: "Mercedes Actros 1845",
      plate: "DE-553-MB",
      vin: "WDB9634031L890123",
      engineNumber: "OM471-LA-V45",
      make: "Mercedes-Benz",
      model: "Actros 1845 LS",
      manufactureYear: 2023,
      type: "truck",
      status: "active",
      gpsEnabled: true,
      speed: 82,
      fuelLevel: 75,
      battery: 24.1,
      address: "A8 Autobahn near Munich, Germany",
      odometer: 254890,
      fuelType: "Diesel",
      tankCapacity: 570,
      grossPayload: 18.0,
      netPayload: 11.5,
      traccarDeviceId: 106,
      trackerImei: "864209048123956",
      insuranceExpiry: "2026-12-01",
      keuringExpiry: "2026-11-10",
      maintenanceDue: "2026-10-20",
      photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600",
      lat: 48.1351,
      lng: 11.5820,
      course: 120
    }
  ];

  for (const v of mockVehicles) {
    await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: {},
      create: v
    });
  }

  // 4. Seed Drivers
  const mockDrivers = [
    {
      id: 1,
      clientId: 1,
      name: "Sarah Jenkins",
      phone: "+33 6 1234 5678",
      email: "s.jenkins@wishutransport.com",
      licenseNumber: "DL-FR99321",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      assignedVehicleId: 1,
      status: "active",
      experience: "8 years"
    },
    {
      id: 2,
      clientId: 1,
      name: "Marcus Aurelius",
      phone: "+1 555 987 6543",
      email: "m.aurelius@wishutransport.com",
      licenseNumber: "DL-NY10042",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      assignedVehicleId: 2,
      status: "active",
      experience: "5 years"
    },
    {
      id: 3,
      clientId: 1,
      name: "Björn Ironside",
      phone: "+46 8 505 4432",
      email: "b.ironside@wishutransport.com",
      licenseNumber: "DL-SE88219",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
      assignedVehicleId: 4,
      status: "active",
      experience: "12 years"
    },
    {
      id: 4,
      clientId: 1,
      name: "Elena Rostova",
      phone: "+27 11 345 6789",
      email: "e.rostova@wishutransport.com",
      licenseNumber: "DL-ZA44091",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      assignedVehicleId: 5,
      status: "inactive",
      experience: "3 years"
    }
  ];

  for (const d of mockDrivers) {
    await prisma.driver.upsert({
      where: { email: d.email },
      update: {},
      create: d
    });
  }

  // 5. Seed Fuel Logs
  const mockFuelLogs = [
    { id: 1, clientId: 1, vehicleId: 1, date: "2026-09-08", fuelAmount: 320, cost: 544.00, odometer: 144850, driverName: "Sarah Jenkins" },
    { id: 2, clientId: 1, vehicleId: 2, date: "2026-09-07", fuelAmount: 65, cost: 110.50, odometer: 48620, driverName: "Marcus Aurelius" },
    { id: 3, clientId: 1, vehicleId: 4, date: "2026-09-08", fuelAmount: 85, cost: 25.50, odometer: 97980, driverName: "Björn Ironside" },
    { id: 4, clientId: 1, vehicleId: 1, date: "2026-09-04", fuelAmount: 310, cost: 527.00, odometer: 143900, driverName: "Sarah Jenkins" },
    { id: 5, clientId: 1, vehicleId: 2, date: "2026-09-01", fuelAmount: 68, cost: 115.60, odometer: 47950, driverName: "Marcus Aurelius" }
  ];

  for (const f of mockFuelLogs) {
    await prisma.fuelLog.upsert({
      where: { id: f.id },
      update: {},
      create: f
    });
  }

  // 6. Seed Maintenance Logs
  const mockMaintenanceLogs = [
    { id: 1, clientId: 1, vehicleId: 3, serviceType: "Brake Fluid & System Calibration", date: "2026-09-10", cost: 320.00, status: "in_progress", notes: "Calibrating regenerative braking sensors.", provider: "Tesla Official Austin" },
    { id: 2, clientId: 1, vehicleId: 1, serviceType: "Engine Oil Change & Filter Kit", date: "2026-08-28", cost: 850.00, status: "completed", notes: "Standard 150k km engine tune-up.", provider: "Scania Diagnostics Service" },
    { id: 3, clientId: 1, vehicleId: 5, serviceType: "Suspension and Ball Joint Alignment", date: "2026-09-15", cost: 480.00, status: "scheduled", notes: "Front suspension rattling noises.", provider: "QuickFit Auto Clinic" },
    { id: 4, clientId: 1, vehicleId: 2, serviceType: "New All-Season Tires Replacement", date: "2026-08-12", cost: 600.00, status: "completed", notes: "Replaced four worn tires.", provider: "Discount Tires & Align" }
  ];

  for (const m of mockMaintenanceLogs) {
    await prisma.maintenanceLog.upsert({
      where: { id: m.id },
      update: {},
      create: m
    });
  }

  // 7. Seed Keuring Records
  const mockKeuringRecords = [
    { id: 1, clientId: 1, vehicleId: 2, certificateId: "APK-NL-2026-90412", lastInspectionDate: "2025-09-18", expiryDate: "2026-09-18", station: "RWD Approved Inspection Hub Amsterdam", result: "conditional", status: "expiring_soon", notes: "Headlight alignment warning.", documentUrl: "APK_Certificate_NY771FD.pdf", inspectorName: "Jan Van Der Berg" },
    { id: 2, clientId: 1, vehicleId: 5, certificateId: "KEUR-ZA-2025-00192", lastInspectionDate: "2024-09-05", expiryDate: "2026-09-05", station: "Gauteng Transport Safety Depot", result: "failed", status: "expired", notes: "Exhaust emissions exceeded threshold.", documentUrl: "Keuring_Report_ZA102TO.pdf", inspectorName: "David Khumalo" },
    { id: 3, clientId: 1, vehicleId: 1, certificateId: "APK-EU-2025-88301", lastInspectionDate: "2025-10-20", expiryDate: "2026-10-20", station: "DEKRA Heavy Commercial Test Center", result: "passed", status: "valid", notes: "Full safety approval.", documentUrl: "APK_Certificate_CA882TR.pdf", inspectorName: "Marcus Becker" }
  ];

  for (const k of mockKeuringRecords) {
    await prisma.keuringRecord.upsert({
      where: { certificateId: k.certificateId },
      update: {},
      create: k
    });
  }

  // 8. Seed Documents
  const mockDocuments = [
    { id: 1, clientId: 1, vehicleId: 1, title: "Commercial Liability Insurance Policy.pdf", category: "Insurance", size: "2.4 MB", uploadDate: "2026-01-15", expiryDate: "2026-09-15" },
    { id: 2, clientId: 1, vehicleId: 1, title: "APK Safety Technical Inspection.pdf", category: "Keuring", size: "1.8 MB", uploadDate: "2025-10-20", expiryDate: "2026-10-20" },
    { id: 3, clientId: 1, vehicleId: 2, title: "Keuring Certificate APK-2026.pdf", category: "Keuring", size: "1.2 MB", uploadDate: "2025-09-18", expiryDate: "2026-09-18" }
  ];

  for (const doc of mockDocuments) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: {},
      create: doc
    });
  }

  // 9. Seed Notifications
  const mockNotifications = [
    { id: 1, clientId: 1, vehicleId: 6, type: "overspeed", message: "Overspeed Alert: Speed exceeded threshold (82 km/h vs 80 km/h) on A8 Autobahn", severity: "warning", read: false },
    { id: 2, clientId: 1, vehicleId: 5, type: "keuring", message: "Keuring Inspection EXPIRED: Safety certificate lapsed on 2026-09-05. Vehicle grounded.", severity: "critical", read: false },
    { id: 3, clientId: 1, vehicleId: 2, type: "keuring", message: "Keuring Expiring: Technical inspection due in 8 days (2026-09-18). Schedule test.", severity: "warning", read: false }
  ];

  for (const n of mockNotifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: n
    });
  }

  // 10. Seed Route History Waypoints
  const waypoints = [
    { vehicleId: 1, lat: 48.8566, lng: 2.3522, speed: 0, course: 45, address: "Paris Cargo Hub Depot" },
    { vehicleId: 1, lat: 48.9100, lng: 2.5200, speed: 65, course: 60, address: "A4 Highway km 15" },
    { vehicleId: 1, lat: 49.0200, lng: 2.8500, speed: 82, course: 75, address: "A4 Highway near Meaux" },
    { vehicleId: 1, lat: 49.2583, lng: 4.0317, speed: 78, course: 95, address: "A4 Highway near Reims, France" }
  ];

  for (const w of waypoints) {
    await prisma.routeHistory.create({ data: w });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
