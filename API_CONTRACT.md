# FleetFlow FMS — REST API Contract Specification

This document defines the complete REST API contract for the FleetFlow Backend services built on Node.js, Express.js, Prisma ORM, and MySQL (XAMPP), designed strictly based on the requirements of the completed Frontend UI.

---

## Standard API Response Format

All API responses follow a strict, unified JSON envelope structure.

### Success Response Format (Single Item / Action)
```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": { ... }
}
```

### Success Response Format (Paginated Lists)
```json
{
  "success": true,
  "message": "Vehicles retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "plate",
      "message": "License plate number is required"
    }
  ]
}
```

---

## Common Query Parameters (Pagination, Search, Filtering)

All list endpoints support standard pagination, search, and sorting query parameters:

* `page` (integer, default: `1`): Current page index
* `limit` (integer, default: `20`, max: `100`): Items per page
* `search` (string, optional): Search term matching name, code, plate, or email
* `sortBy` (string, default: `'createdAt'`): Field name to sort by
* `sortOrder` (string, default: `'desc'`): `'asc'` or `'desc'`
* `clientId` (string/integer, optional): Filter by tenant client ID (SuperAdmin access)

---

## 1. Authentication Module (`/api/v1/auth`)

### 1.1 Login
* **Endpoint**: `POST /api/v1/auth/login`
* **Purpose**: Authenticate user with email and password, returning tokens and profile information.
* **Authentication**: Public
* **Request Body**:
  ```json
  {
    "email": "admin@fleetflow.com",
    "password": "admin123"
  }
  ```
* **Validation**:
  * `email`: Required, valid email string format
  * `password`: Required, minimum 6 characters
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged in successfully",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "user": {
        "id": "u-101",
        "name": "Alexander Mercer",
        "email": "admin@fleetflow.com",
        "role": "Platform Operations Manager",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        "clientId": "1"
      }
    }
  }
  ```
* **Errors**:
  * `400 Bad Request`: Validation error
  * `401 Unauthorized`: Invalid email or password

---

### 1.2 Refresh Access Token
* **Endpoint**: `POST /api/v1/auth/refresh`
* **Purpose**: Issue a new short-lived access token and rotated refresh token using an existing refresh token.
* **Authentication**: Public (Refresh Token payload)
* **Request Body**:
  ```json
  {
    "refreshToken": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
  ```
* **Validation**:
  * `refreshToken`: Required string
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "f8c0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899"
    }
  }
  ```
* **Errors**:
  * `401 Unauthorized`: Invalid, expired, or revoked refresh token

---

### 1.3 Logout
* **Endpoint**: `POST /api/v1/auth/logout`
* **Purpose**: Revoke current session refresh token.
* **Authentication**: Access Token Required
* **Request Body**:
  ```json
  {
    "refreshToken": "f8c0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully",
    "data": null
  }
  ```
* **Errors**:
  * `401 Unauthorized`: Invalid access token

---

### 1.4 Get Authenticated User (`/me`)
* **Endpoint**: `GET /api/v1/auth/me`
* **Purpose**: Retrieve current logged-in user profile details and permissions.
* **Authentication**: Access Token Required
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Current user retrieved",
    "data": {
      "id": "u-101",
      "name": "Alexander Mercer",
      "email": "a.mercer@wishutransport.com",
      "role": "Platform Operations Manager",
      "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
      "speedThreshold": 80,
      "idleAlertMinutes": 15,
      "receivePushNotifications": true,
      "receiveEmailNotifications": true
    }
  }
  ```

---

## 2. Profile & Settings Module (`/api/v1/profile`)

### 2.1 Update User Profile & Settings
* **Endpoint**: `PUT /api/v1/profile`
* **Purpose**: Update user profile information, app theme settings, telematics alert thresholds, and notification preferences.
* **Authentication**: Access Token Required
* **Request Body**:
  ```json
  {
    "name": "Alexander Mercer",
    "email": "a.mercer@wishutransport.com",
    "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    "language": "en",
    "speedThreshold": 85,
    "idleAlertMinutes": 20,
    "receivePushNotifications": true,
    "receiveEmailNotifications": true
  }
  ```
* **Validation**:
  * `name`: Required non-empty string
  * `email`: Required valid email
  * `speedThreshold`: Positive integer (10 to 200)
  * `idleAlertMinutes`: Positive integer (1 to 120)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Settings configurations saved",
    "data": { ... }
  }
  ```

---

## 3. Clients / Tenants Module (`/api/v1/clients`)

### 3.1 Get All Client Organizations
* **Endpoint**: `GET /api/v1/clients`
* **Purpose**: List multi-tenant client accounts with vehicle and driver counts.
* **Authentication**: Access Token Required (Platform Ops / Client Admin)
* **Query Parameters**: `search`, `status` (`active`, `inactive`)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Clients retrieved successfully",
    "data": [
      {
        "id": 1,
        "name": "Wishu Transport",
        "code": "WISHU-TR",
        "email": "contact@wishutransport.com",
        "phone": "+31 20 555 0192",
        "address": "Logistics Park Hub 4, Amsterdam, Netherlands",
        "status": "active",
        "vehicleCount": 6,
        "driverCount": 4,
        "createdDate": "2024-01-15"
      }
    ]
  }
  ```

---

### 3.2 Create Client Tenant
* **Endpoint**: `POST /api/v1/clients`
* **Purpose**: Register a new client organization tenant.
* **Authentication**: Access Token Required (Super Admin only)
* **Request Body**:
  ```json
  {
    "name": "TransAfrica Express",
    "code": "TA-EXP",
    "email": "ops@transafrica.co.za",
    "phone": "+27 11 409 3321",
    "address": "Cargo Terminal South, Johannesburg"
  }
  ```
* **Validation**:
  * `name`: Required non-empty string
  * `code`: Required, unique uppercase string
  * `email`: Required valid email
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Client organization TransAfrica Express registered",
    "data": { ... }
  }
  ```

---

### 3.3 Update Client Tenant
* **Endpoint**: `PUT /api/v1/clients/:id`
* **Purpose**: Update client tenant metadata.
* **Authentication**: Access Token Required (Super Admin only)

---

### 3.4 Delete Client Tenant
* **Endpoint**: `DELETE /api/v1/clients/:id`
* **Purpose**: Deregister a client tenant account.
* **Authentication**: Access Token Required (Super Admin only)

---

## 4. Vehicles Module (`/api/v1/vehicles`)

### 4.1 Get All Fleet Vehicles
* **Endpoint**: `GET /api/v1/vehicles`
* **Purpose**: Retrieve commercial fleet vehicles list with filtering by tenant, search term, operational status, and telematics hardware connectivity.
* **Authentication**: Access Token Required
* **Query Parameters**:
  * `clientId`: Filter by tenant (`'all'` or numeric ID)
  * `search`: String matching name, plate, or VIN
  * `status`: `'all'`, `'active'`, `'maintenance'`, `'inactive'`
  * `gpsFilter`: `'all'`, `'gps'`, `'nongps'`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Vehicles retrieved",
    "data": [
      {
        "id": 1,
        "clientId": 1,
        "name": "Scania R450 Heavy Cargo",
        "plate": "CA-882-TR",
        "vin": "YS2R4X20002938411",
        "engineNumber": "DC13-148-L01-9921",
        "make": "Scania",
        "model": "R450 Streamline",
        "manufactureYear": 2022,
        "type": "truck",
        "status": "active",
        "gpsEnabled": true,
        "speed": 78,
        "fuelLevel": 62,
        "battery": 24.2,
        "address": "A4 Highway, near Reims, France",
        "driverId": 1,
        "lastUpdate": "2026-09-10T14:35:00Z",
        "odometer": 145230,
        "fuelType": "Diesel",
        "tankCapacity": 600,
        "grossPayload": 40.0,
        "netPayload": 26.5,
        "traccarDeviceId": 101,
        "trackerImei": "864209048123951",
        "insuranceExpiry": "2026-09-15",
        "keuringExpiry": "2026-10-20",
        "maintenanceDue": "2026-09-25",
        "photo": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600",
        "lat": 49.2583,
        "lng": 4.0317,
        "course": 95
      }
    ]
  }
  ```

---

### 4.2 Get Vehicle Details (10-Tab Data API)
* **Endpoint**: `GET /api/v1/vehicles/:id`
* **Purpose**: Retrieve full details of a specific vehicle including attached maintenance logs, fuel entries, Keuring pass history, insurance info, and driver allocation.
* **Authentication**: Access Token Required
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Vehicle details retrieved",
    "data": {
      "vehicle": { ... },
      "driver": { ... },
      "fuelLogs": [ ... ],
      "maintenanceLogs": [ ... ],
      "keuringRecords": [ ... ],
      "documents": [ ... ]
    }
  }
  ```

---

### 4.3 Add Fleet Vehicle (4-Wizard Form Payload)
* **Endpoint**: `POST /api/v1/vehicles`
* **Purpose**: Register a commercial fleet vehicle.
* **Authentication**: Access Token Required (Fleet Manager / Super Admin)
* **Request Body**:
  ```json
  {
    "name": "Scania R450 Heavy Cargo",
    "plate": "CA-882-TR",
    "vin": "YS2R4X20002938411",
    "engineNumber": "DC13-148-L01",
    "make": "Scania",
    "model": "R450",
    "manufactureYear": 2023,
    "type": "truck",
    "status": "active",
    "gpsEnabled": true,
    "fuelType": "Diesel",
    "tankCapacity": 600,
    "grossPayload": 40.0,
    "netPayload": 26.5,
    "insuranceExpiry": "2026-09-15",
    "keuringExpiry": "2026-10-20",
    "traccarDeviceId": "101",
    "trackerImei": "864209048123951",
    "driverId": 1,
    "photo": "https://images.unsplash.com/photo-..."
  }
  ```
* **Validation Rules**:
  * `name`: Required non-empty string
  * `plate`: Required, unique string
  * `vin`: Required, unique string (17 chars)
  * `insuranceExpiry`: Required valid date string (`YYYY-MM-DD`)
  * `keuringExpiry`: Required valid date string (`YYYY-MM-DD`)
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Scania R450 Heavy Cargo added to fleet directory",
    "data": { "id": 10, ... }
  }
  ```

---

### 4.4 Update Vehicle Specs
* **Endpoint**: `PUT /api/v1/vehicles/:id`
* **Purpose**: Update specs or allocation for an existing vehicle.
* **Authentication**: Access Token Required

---

### 4.5 Deregister / Delete Vehicle
* **Endpoint**: `DELETE /api/v1/vehicles/:id`
* **Purpose**: Remove vehicle from fleet directory.
* **Authentication**: Access Token Required

---

## 5. Drivers Module (`/api/v1/drivers`)

### 5.1 Get Drivers List
* **Endpoint**: `GET /api/v1/drivers`
* **Purpose**: List fleet driver staff with assigned vehicle details.
* **Authentication**: Access Token Required
* **Query Parameters**: `search`, `status` (`active`, `inactive`), `clientId`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Drivers retrieved",
    "data": [
      {
        "id": 1,
        "clientId": 1,
        "name": "Sarah Jenkins",
        "phone": "+33 6 1234 5678",
        "email": "s.jenkins@wishutransport.com",
        "licenseNumber": "DL-FR99321",
        "avatar": "https://images.unsplash.com/photo-...",
        "assignedVehicleId": 1,
        "status": "active",
        "experience": "8 years"
      }
    ]
  }
  ```

---

### 5.2 Add Driver Profile
* **Endpoint**: `POST /api/v1/drivers`
* **Purpose**: Create a driver staff profile.
* **Authentication**: Access Token Required
* **Request Body**:
  ```json
  {
    "name": "Sarah Jenkins",
    "phone": "+33 6 1234 5678",
    "email": "s.jenkins@wishutransport.com",
    "licenseNumber": "DL-FR99321",
    "experience": "8 years",
    "assignedVehicleId": 1,
    "avatar": "https://images.unsplash.com/..."
  }
  ```
* **Validation**:
  * `name`: Required string
  * `phone`: Required string
  * `email`: Required valid email
  * `licenseNumber`: Required, min 5 chars

---

### 5.3 Assign / Unassign Driver Vehicle
* **Endpoint**: `POST /api/v1/drivers/:id/assign-vehicle`
* **Purpose**: Update vehicle mapping for driver.
* **Authentication**: Access Token Required
* **Request Body**:
  ```json
  {
    "vehicleId": 2
  }
  ```

---

## 6. Fuel Management Module (`/api/v1/fuel-logs`)

### 6.1 Get Fuel Logs
* **Endpoint**: `GET /api/v1/fuel-logs`
* **Purpose**: Retrieve refueling records and metrics (Total Spend, Total Liters, Avg $/L).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fuel logs retrieved",
    "data": [
      {
        "id": 1,
        "clientId": 1,
        "vehicleId": 1,
        "vehicleName": "Scania R450 Heavy Cargo",
        "date": "2026-09-08",
        "fuelAmount": 320,
        "cost": 544.00,
        "odometer": 144850,
        "driverName": "Sarah Jenkins"
      }
    ]
  }
  ```

---

### 6.2 Log Refueling Ticket
* **Endpoint**: `POST /api/v1/fuel-logs`
* **Purpose**: Create a refueling transaction entry.
* **Request Body**:
  ```json
  {
    "vehicleId": 1,
    "date": "2026-09-08",
    "fuelAmount": 320.00,
    "cost": 544.00,
    "odometer": 144850,
    "driverName": "Sarah Jenkins"
  }
  ```

---

## 7. Maintenance Module (`/api/v1/maintenance`)

### 7.1 Get Maintenance Logs
* **Endpoint**: `GET /api/v1/maintenance`
* **Purpose**: List service repair logs with list/timeline view compatibility.
* **Query Parameters**: `status` (`scheduled`, `in_progress`, `completed`)

---

### 7.2 Schedule Maintenance Service
* **Endpoint**: `POST /api/v1/maintenance`
* **Request Body**:
  ```json
  {
    "vehicleId": 3,
    "serviceType": "Brake Fluid & System Calibration",
    "date": "2026-09-10",
    "cost": 320.00,
    "status": "in_progress",
    "provider": "Tesla Official Austin",
    "notes": "Calibrating regenerative braking sensors."
  }
  ```

---

### 7.3 Update Maintenance Service Status
* **Endpoint**: `PATCH /api/v1/maintenance/:id/status`
* **Purpose**: Progress service state (`scheduled` → `in_progress` → `completed`).
* **Request Body**:
  ```json
  {
    "status": "completed"
  }
  ```

---

## 8. Insurance Module (`/api/v1/insurance`)

### 8.1 Get Insurance Policies Overview
* **Endpoint**: `GET /api/v1/insurance`
* **Purpose**: Retrieve commercial insurance coverage list and expiration alert levels across vehicles.

---

### 8.2 Renew Insurance Policy (Fast Track 1-Yr)
* **Endpoint**: `POST /api/v1/insurance/:vehicleId/renew`
* **Purpose**: Renew commercial policy adding 1 year to expiry date.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Insurance policy renewed for 1 year",
    "data": {
      "vehicleId": 1,
      "newInsuranceExpiry": "2027-09-15"
    }
  }
  ```

---

### 8.3 Adjust Insurance Expiry Date
* **Endpoint**: `PUT /api/v1/insurance/:vehicleId/date`
* **Request Body**:
  ```json
  {
    "insuranceExpiry": "2027-02-10"
  }
  ```

---

## 9. Keuring / Inspection Module (`/api/v1/keuring`)

### 9.1 Get Keuring Records
* **Endpoint**: `GET /api/v1/keuring`
* **Purpose**: List periodic technical inspection (APK) certificates with calculated days remaining.

---

### 9.2 Add Keuring Certificate
* **Endpoint**: `POST /api/v1/keuring`
* **Request Body**:
  ```json
  {
    "vehicleId": 2,
    "certificateId": "APK-NL-2026-90412",
    "lastInspectionDate": "2025-09-18",
    "expiryDate": "2026-09-18",
    "station": "RWD Approved Inspection Hub Amsterdam",
    "result": "conditional",
    "notes": "Minor headlight alignment warning.",
    "inspectorName": "Jan Van Der Berg"
  }
  ```

---

## 10. Telematics & Live Tracking (`/api/v1/telematics`)

### 10.1 Get Live Telemetry Stream
* **Endpoint**: `GET /api/v1/telematics/live`
* **Purpose**: Retrieve current live GPS coordinates, speeds, headings, and geocoded addresses for tracked fleet units.

---

### 10.2 Get Route History Waypoints (Playback Engine)
* **Endpoint**: `GET /api/v1/telematics/route-history`
* **Purpose**: Query route waypoints for map polyline path rendering and animated playback player.
* **Query Parameters**: `vehicleId` (required), `date`, `startTime`, `endTime`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Route history waypoints retrieved",
    "data": {
      "summary": {
        "totalDistanceKm": 184.2,
        "duration": "4h 22m",
        "maxSpeedKm": 82,
        "avgSpeedKm": 68,
        "idleMinutes": 18
      },
      "waypoints": [
        {
          "lat": 48.8566,
          "lng": 2.3522,
          "speed": 0,
          "course": 45,
          "timestamp": "2026-09-10T08:00:00Z",
          "address": "Paris Cargo Hub Depot"
        },
        {
          "lat": 49.2583,
          "lng": 4.0317,
          "speed": 78,
          "course": 95,
          "timestamp": "2026-09-10T12:00:00Z",
          "address": "A4 Highway near Reims, France"
        }
      ]
    }
  }
  ```

---

## 11. Dashboard Aggregations (`/api/v1/dashboard`)

### 11.1 Get Executive Dashboard Statistics
* **Endpoint**: `GET /api/v1/dashboard/stats`
* **Purpose**: Aggregates fleet KPIs (Total Vehicles, Operational, Maintenance, Keuring Expiring, Insurance Alerts, Upcoming Service).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Dashboard stats calculated",
    "data": {
      "totalVehicles": 6,
      "activeFleet": 4,
      "maintenanceVehicles": 1,
      "keuringAlertCount": 2,
      "insuranceAlertCount": 2,
      "upcomingMaintenanceCount": 2,
      "statusDistribution": [
        { "name": "Active Fleet", "value": 4 },
        { "name": "In Maintenance", "value": 1 },
        { "name": "Inactive / Yard", "value": 1 }
      ]
    }
  }
  ```

---

## 12. Reports & Data Exports (`/api/v1/reports` & `/api/v1/exports`)

### 12.1 Download Export File
* **Endpoint**: `POST /api/v1/exports/download`
* **Purpose**: Generate and stream server-side export file in Excel (`.xlsx`), CSV (`.csv`), or PDF (`.pdf`) format.
* **Request Body**:
  ```json
  {
    "module": "vehicles",
    "format": "excel",
    "dataScope": "filtered",
    "clientId": "1"
  }
  ```

---

## 13. System Notifications Module (`/api/v1/notifications`)

### 13.1 Get System Alerts
* **Endpoint**: `GET /api/v1/notifications`
* **Purpose**: List overspeed alerts, Keuring expirations, and maintenance triggers.

---

### 13.2 Mark All Notifications Read
* **Endpoint**: `PATCH /api/v1/notifications/read-all`
* **Purpose**: Clear unread alert badges.

---

## 14. Compliance Documents (`/api/v1/documents`)

### 14.1 Get Uploaded Compliance Documents
* **Endpoint**: `GET /api/v1/documents`
* **Query Parameters**: `category` (`Insurance`, `Keuring`, `Registration`, `License`), `vehicleId`

---

### 14.2 Upload Document Attachment
* **Endpoint**: `POST /api/v1/documents/upload`
* **Purpose**: Upload compliance attachment (multipart form-data).
