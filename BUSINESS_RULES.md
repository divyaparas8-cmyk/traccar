# FleetFlow FMS — Business Rules & Logic Specification

This document details all business domain rules, entity constraints, validation requirements, status state machines, workflow rules, dashboard calculations, and security controls for the FleetFlow backend running on Node.js, Express.js, Prisma ORM, and MySQL (XAMPP).

---

## 1. Authentication Rules

### 1.1 Credential & Registration Requirements
* **Login Credentials**: User must supply a valid `email` address and `password`.
* **Password Complexity & Hashing**:
  * Passwords must be a minimum of 6 characters in length.
  * Passwords must **never** be stored as plain-text under any circumstances.
  * Passwords must be hashed using `bcrypt` with a salt round factor of `12`.
* **Default Admin Demo User**:
  * Email: `admin@fleetflow.com`
  * Password: `admin123`
  * Default Role: `Platform Operations Manager`

### 1.2 Token Lifecycle & Session Rules
* **Access Token**:
  * Type: JWT (JSON Web Token)
  * Signed with: `JWT_ACCESS_SECRET`
  * Expiration: `15 minutes` (Short-lived)
  * Payload contains: `userId`, `email`, `role`, `clientId`
* **Refresh Token**:
  * Type: Cryptographically secure UUID token
  * Stored: Hashed inside `RefreshToken` database table
  * Signed with: `JWT_REFRESH_SECRET`
  * Expiration: `7 days` (Longer-lived)
* **Token Rotation**:
  * Upon calling `POST /api/v1/auth/refresh`, the presented refresh token is immediately revoked and replaced with a newly generated refresh token.
  * Re-use of a revoked refresh token triggers immediate security invalidation of all active session tokens for that user ID.
* **Logout Behavior**:
  * Calling `POST /api/v1/auth/logout` revokes and removes the refresh token entry from the database.

---

## 2. Authorization & RBAC Matrix

Permissions are scoped strictly by user role and tenant client ID (`clientId`):

| Module / Action | Platform Operations Manager | Fleet Manager / Client Admin | Driver / Operator |
| :--- | :--- | :--- | :--- |
| **Tenant Context Filter** | Can select `'all'` or any `clientId` | Locked to assigned `clientId` | Locked to assigned `clientId` |
| **Client Account CRUD** | Full Access (Create/Edit/Delete) | Read Only | Read Only |
| **Vehicle Directory CRUD** | Full Access | Full Access within Tenant | Read Only (Assigned unit) |
| **Driver Staff CRUD** | Full Access | Full Access within Tenant | Read Only (Self Profile) |
| **Assign Driver to Vehicle** | Full Access | Full Access within Tenant | No Access |
| **Fuel Transaction CRUD** | Full Access | Full Access within Tenant | Read Only / Log Self |
| **Maintenance Progress** | Full Access | Full Access within Tenant | Read Only |
| **Insurance Date / Renew** | Full Access | Full Access within Tenant | Read Only |
| **Keuring Inspection CRUD** | Full Access | Full Access within Tenant | Read Only |
| **Live Tracking & Playback** | Full Access | Full Access within Tenant | Read Only (Assigned unit) |
| **Analytics & Data Exports** | Full Access | Full Access within Tenant | No Access |
| **Notifications Management**| Full Access | Full Access within Tenant | Read Self Notifications |
| **Settings Preferences** | Global & Self Settings | Own Profile Settings | Own Profile Settings |

---

## 3. Entity Domain Rules

### 3.1 Client Tenant (`Client`)
* **Required Fields**: `name`, `code`, `email`
* **Optional Fields**: `phone`, `address`, `status`
* **Unique Fields**: `code` (uppercase string e.g. `WISHU-TR`), `email`
* **Default Values**: `status = 'active'`, `createdDate = Current Date`
* **Delete Behavior**: Soft delete or check for linked vehicles/drivers before removal. Cascading delete is **prohibited** without explicit admin override.

### 3.2 Vehicle (`Vehicle`)
* **Required Fields**: `name`, `plate`, `vin`, `type`, `insuranceExpiry`, `keuringExpiry`
* **Optional Fields**: `engineNumber`, `make`, `model`, `manufactureYear`, `status`, `gpsEnabled`, `speed`, `fuelLevel`, `battery`, `address`, `driverId`, `odometer`, `fuelType`, `tankCapacity`, `grossPayload`, `netPayload`, `traccarDeviceId`, `trackerImei`, `maintenanceDue`, `photo`, `lat`, `lng`, `course`
* **Unique Fields**: `plate` (e.g. `CA-882-TR`), `vin` (17-char chassis VIN), `traccarDeviceId` (when present), `trackerImei` (when present)
* **Allowed Status Values**:
  * `active` — Vehicle operational and dispatched
  * `maintenance` — In garage / under service repair
  * `inactive` — Grounded or parked in storage yard
* **Allowed Vehicle Types**: `truck`, `van`, `car`, `bus`
* **Allowed Fuel Types**: `Diesel`, `Petrol`, `Electric`, `Hybrid`
* **Delete Behavior**: Soft delete. When a vehicle is deleted, any assigned driver's `assignedVehicleId` must be automatically set to `null` (unassigned).

### 3.3 Driver (`Driver`)
* **Required Fields**: `name`, `phone`, `email`, `licenseNumber`
* **Optional Fields**: `avatar`, `assignedVehicleId`, `status`, `experience`
* **Unique Fields**: `email`, `licenseNumber` (min 5 chars e.g. `DL-FR99321`)
* **Allowed Status Values**: `active`, `inactive`
* **Assignment Constraint**: A driver can be assigned to at most **one** vehicle at a time. If Vehicle A is assigned to Driver X, and Driver X is reassigned to Vehicle B, Driver X's mapping to Vehicle A is cleared, and Vehicle A's `driverId` is set to `null`.
* **Assignment History**: Every driver vehicle assignment change must log an entry in `DriverAssignmentHistory`.

### 3.4 Fuel Log (`FuelLog`)
* **Required Fields**: `vehicleId`, `date`, `fuelAmount`, `cost`, `odometer`, `driverName`
* **Numeric Rules**: `fuelAmount` > 0, `cost` > 0, `odometer` >= 0
* **Calculated Values**: Average cost per liter = `cost / fuelAmount`

### 3.5 Maintenance Log (`MaintenanceLog`)
* **Required Fields**: `vehicleId`, `serviceType`, `date`, `cost`, `provider`
* **Optional Fields**: `notes`, `status`
* **Allowed Status Values**:
  * `scheduled` — Planned service task
  * `in_progress` — Currently being repaired in garage
  * `completed` — Service finished and verified
* **State Machine Transitions**:
  * `scheduled` → `in_progress` (Triggered via "Start" button)
  * `in_progress` → `completed` (Triggered via "Done" button)

### 3.6 Keuring Safety Inspection (`KeuringRecord`)
* **Required Fields**: `vehicleId`, `certificateId`, `lastInspectionDate`, `expiryDate`, `station`
* **Optional Fields**: `result`, `status`, `notes`, `documentUrl`, `inspectorName`
* **Unique Fields**: `certificateId` (e.g. `APK-NL-2026-90412`)
* **Allowed Inspection Results**: `passed`, `conditional`, `failed`
* **Automatic Status Calculation**:
  * If `daysRemaining <= 0` → Status set to `expired`
  * Else if `daysRemaining <= 30` → Status set to `expiring_soon`
  * Else → Status set to `valid`

### 3.7 Compliance Document (`Document`)
* **Required Fields**: `title`, `category`
* **Optional Fields**: `vehicleId`, `size`, `uploadDate`, `expiryDate`, `fileUrl`
* **Allowed Categories**: `Insurance`, `Keuring`, `Registration`, `License`

### 3.8 Notification (`Notification`)
* **Required Fields**: `vehicleId`, `type`, `message`, `timestamp`, `severity`
* **Optional Fields**: `read` (boolean, default: `false`)
* **Allowed Types**: `overspeed`, `keuring`, `maintenance`, `insurance`, `offline`
* **Allowed Severities**: `critical`, `warning`, `info`

---

## 4. Validation Rules

All API payload inputs must pass validation before controller execution:

* **Email**: Valid email format matching `/\S+@\S+\.\S+/`.
* **Password**: Minimum 6 characters.
* **License Plate**: Required non-empty string.
* **Chassis VIN**: Required non-empty string, exact 17 alphanumeric characters where specified.
* **Dates**: Must be ISO formatted date string (`YYYY-MM-DD`).
* **Numerics**:
  * `odometer`: Non-negative integer (`>= 0`)
  * `fuelAmount`: Positive float (`> 0`)
  * `cost`: Positive float (`> 0`)
  * `speed`: Integer between `0` and `250`
  * `tankCapacity`: Positive float (`> 0`)
  * `grossPayload` & `netPayload`: Non-negative floats (`>= 0`)

---

## 5. Workflow Rules

### 5.1 Keuring Technical Safety Inspection Calculation
The system evaluates Keuring status using daily countdown calculations:
```
diffDays = Math.ceil((new Date(expiryDate) - CurrentDate) / (1000 * 60 * 60 * 24))
```
* `diffDays <= 0`: Status = `expired` (Triggers critical alert, grounds vehicle)
* `1 <= diffDays <= 30`: Status = `expiring_soon` (Triggers warning alert)
* `diffDays > 30`: Status = `valid`

### 5.2 Insurance Policy Renewal Rule
* Clicking "Renew (1 Yr)" updates the target vehicle's `insuranceExpiry` date by adding exactly **1 year** (365/366 days) to current date or existing expiry date.
* Manual adjustment allows setting an explicit date picker value.

### 5.3 Telematics Overspeed Breach Trigger Rule
* During live telematics processing, if a vehicle's reported `speed` exceeds the user's `speedThreshold` setting (default: `80 km/h`):
  1. System generates a `Notification` entry with `type = 'overspeed'` and `severity = 'warning'`.
  2. Message format: `"Overspeed Alert: Speed exceeded threshold ({speed} km/h vs {speedThreshold} km/h) on {address}"`.

### 5.4 Multi-Tenant Data Isolation Rule
* All data requests MUST be scoped by the authenticated user's `clientId`.
* Super Admin (`Platform Operations Manager`) can supply `?clientId=all` to override filtering, or pass a specific `clientId` parameter.

---

## 6. Dashboard Metrics Calculation Rules

1. **Total Vehicles**: Count of active client vehicles.
2. **Active Operational**: Count of vehicles with `status === 'active'`.
3. **In Maintenance**: Count of vehicles with `status === 'maintenance'`.
4. **Keuring Expiring**: Count of Keuring records with `status === 'expired'` OR `status === 'expiring_soon'` OR `expiryDate` within 30 days.
5. **Insurance Alerts**: Count of vehicles with `insuranceExpiry` date within 30 days or expired.
6. **Upcoming Service**: Count of maintenance logs with `status === 'scheduled'` OR `status === 'in_progress'`.
7. **Fuel Volume & Spend Trend**: Grouping fuel logs by date, summing `fuelAmount` (liters) and `cost` ($).

---

## 7. Search & Filtering Rules

* **Vehicles Directory**: Case-insensitive partial matching on `name`, `plate`, and `vin`. Multi-select filtering by `status` (`active`, `maintenance`, `inactive`) and `gpsFilter` (`gps`, `nongps`).
* **Drivers Registry**: Partial matching on driver `name` or `email`.
* **Fuel Logs**: Partial matching on vehicle `name`, vehicle `plate`, or `driverName`.
* **Maintenance Logs**: Partial matching on vehicle `name`, `plate`, or `serviceType`. Filter by `status`.
* **Keuring Records**: Partial matching on vehicle `name`, `plate`, or `certificateId`. Filter by `status`.
* **Compliance Documents**: Partial matching on document `title` or `vehicleName`. Filter by `category`.
* **Clients Directory**: Partial matching on company `name` or `code`.

---

## 8. Security Rules

* **Password Hashing**: `bcrypt` salt rounds = `12`.
* **JWT Security**: Access tokens expire in 15 minutes. Refresh tokens expire in 7 days and use database token rotation.
* **HTTP Security Headers**: `Helmet` enabled across all endpoints.
* **CORS Policy**: Strictly whitelist frontend origin (`FRONTEND_URL`).
* **Rate Limiting**:
  * Auth endpoints (`/api/v1/auth/login`): Max 10 attempts per 15 minutes per IP.
  * General API endpoints: Max 100 requests per 15 minutes per IP.
* **Sanitization & Error Leaks**: Stack traces omitted in non-development environments. Sensitive hash fields excluded from JSON serializations.

---

## 9. Items Marked "NEEDS CONFIRMATION"

The following items are underspecified in the UI and require explicit user/stakeholder confirmation prior to backend phase 2 implementation:

1. **NEEDS CONFIRMATION — Document File Storage**:
   * *UI State*: Frontend currently displays mock PDF titles (e.g. `APK_Certificate_NY771FD.pdf`) and simulated download buttons.
   * *Question*: Should Phase 2 backend implement actual AWS S3 multi-part file uploads, or store files on the local node filesystem in `uploads/` for early development?
2. **NEEDS CONFIRMATION — Traccar Telematics Gateway Connection**:
   * *UI State*: Frontend uses simulated live telemetry updates via `setInterval` and mock route history JSON arrays (`mockRouteHistories`).
   * *Question*: Should the backend connect to an active live Traccar server via WebSocket/REST API, or provide a server-side telematics simulator endpoint?
3. **NEEDS CONFIRMATION — Role Permissions Customization**:
   * *UI State*: Role names present in UI are `Platform Operations Manager` and `Fleet Manager`.
   * *Question*: Are driver operators expected to log in with dedicated driver credentials, or do fleet managers perform all data entry on drivers' behalf?
4. **NEEDS CONFIRMATION — Keuring Certificate File Binding**:
   * *UI State*: Keuring records contain a `documentUrl` string.
   * *Question*: Should creating a Keuring certificate automatically auto-create a corresponding entry in the `Document` repository?
