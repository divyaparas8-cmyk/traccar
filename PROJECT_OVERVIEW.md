# FleetFlow FMS — Backend Project Overview

## 1. Project Purpose

**FleetFlow** is a Multi-Tenant Enterprise Fleet Operations Management System (FMS). It provides comprehensive fleet monitoring, telematics tracking, compliance management (Keuring/APK technical safety inspections and commercial insurance policies), maintenance lifecycle scheduling, driver allocation, fuel expense ledger management, executive analytics, and system alert notifications.

The application is built to support multi-tenant client organizations using Node.js, Express.js, Prisma ORM, and MySQL (XAMPP), allowing platform operations managers and enterprise fleet managers to seamlessly isolate and manage vehicle fleets by client tenant or across the entire enterprise.

---

## 2. Existing Frontend Analysis

### 2.1 Technology Stack
* **Framework**: React 18 (Vite build setup)
* **Styling**: Tailwind CSS with dark mode support (`dark` class toggle on document root)
* **Icons**: Lucide React (`lucide-react`)
* **Charting**: Recharts (`recharts`) for fuel consumption trends, status distributions, and analytics area/bar/pie charts
* **Mapping & GIS**: Leaflet (`leaflet`) with custom tile layer integration (CartoDB Vector, OpenStreetMap, Esri World Imagery)
* **UI Components**: Custom modular UI system (`Button`, `Input`, `Badge`, `Modal`, `ConfirmDialog`, `ToastContainer`, `ExportModal`, `Layout`)

### 2.2 Main Routes & Navigation Structure
The frontend is structured around a centralized sidebar navigation layout with 5 major operational groups:

1. **Fleet**:
   * `dashboard` — Executive overview, real-time KPI metrics, telematics stream, alert widgets
   * `vehicles` — Commercial vehicles directory & 10-tab deep vehicle inspection detail view
   * `drivers` — Driver staff registry, licensing profile, vehicle allocation
   * `live-tracking` — Real-time telematics tracking map & historical route playback player
2. **Operations**:
   * `maintenance` — Repair task logs, service provider management, list/timeline view
   * `fuel` — Refueling transaction ledger, cost per liter, volume tracking
3. **Compliance**:
   * `insurance` — Commercial fleet insurance policy tracking, 1-year auto-renewals, policy PDF drawers
   * `keuring` — Technical periodic safety inspections (APK/Keuring), compliance pass rates
   * `documents` — Centralized compliance document repository (PDFs, registrations, licenses)
4. **Analytics**:
   * `reports` — Executive analytics dashboards, utilization metrics, CSV/Excel/PDF exports
5. **Administration**:
   * `clients` — Multi-tenant organization directory and tenant switcher
   * `notifications` — Real-time system alert center, overspeed warnings, expiration alerts
   * `settings` — User profile settings, telematics alert thresholds, notification delivery preferences

### 2.3 User Types & Roles
Based on the login screens and settings modules, the backend must support the following user roles:

1. **Platform Operations Manager / Super Admin**: Full platform access, multi-tenant switching, client creation, global settings, complete CRUD across all entities.
2. **Fleet Manager / Client Admin**: Tenant-restricted access to manage assigned client vehicles, drivers, maintenance, fuel logs, compliance, and reports.
3. **Driver / Operator**: View assigned vehicle details, logged trips, personal profile, and safety guidelines. *(Read-oriented role)*

### 2.4 Major User Workflows
* **Authentication Workflow**: Email/password login with demo auto-fill support (`admin@fleetflow.com`), token session creation, profile sync, and logout.
* **Multi-Tenant Switcher Workflow**: Global tenant selector dropdown in top navbar. Selecting a tenant (`clientId`) filters all vehicles, drivers, fuel logs, maintenance logs, keuring records, compliance docs, and notifications across the application. Selecting `"all"` provides an enterprise global view.
* **Vehicle Registration & Lifecycle (4-Step Wizard)**:
  1. *General*: Name, vehicle type (`truck`, `van`, `car`, `bus`), operational status (`active`, `maintenance`, `inactive`), photo URL.
  2. *VIN & Identification*: License plate, chassis VIN, engine number, manufacture year, insurance expiry date, Keuring expiry date.
  3. *Technical Specs*: Fuel engine type (`Diesel`, `Petrol`, `Electric`, `Hybrid`), tank capacity, gross payload (tons), net payload (tons).
  4. *Traccar & Driver*: Traccar device ID, tracker hardware IMEI, assigned driver selection.
* **Vehicle Deep Inspection (10 Tabs)**: Inspection view covering Overview, Specs, GPS/Telematics, Driver, Maintenance, Fuel, Insurance, Keuring, Documents, and History Playback link.
* **Driver Vehicle Allocation Workflow**: Mapping a driver to a vehicle (and enforcing single active driver assignment logic). Track historical driver assignment logs.
* **Keuring Safety Compliance Workflow**: Automated status categorization based on expiry date:
  * `expired` / Grounded (<= 0 days)
  * `expiring_soon` (1 - 30 days)
  * `valid` Safety Pass (> 30 days)
* **Insurance Renewal Workflow**: Fast-track policy renewal adding exactly 1 year to current expiry date, or manual date adjustment.
* **Maintenance Progress Lifecycle**: Progressing service tasks through states: `scheduled` → `in_progress` → `completed`.
* **Telematics & Route Playback Workflow**:
  * *Live Mode*: Socket stream polling, real-time speed/address geocoding, tile map switching (`vector`, `street`, `satellite`), fly-to vehicle focus.
  * *Playback Mode*: Route history loading by vehicle and date, trip summary metrics calculation, interactive polyline path with START/END markers, timeline player controls (Play/Pause, Stop, Speed 1x/2x/5x/10x, interactive scrub slider).
* **Data Export Workflow**: Exporting module datasets (`vehicles`, `fuel`, `maintenance`, `insurance`, `keuring`, `reports`) in `.xlsx`, `.csv`, or `.pdf` format across filtered or full data scope.

---

## 3. Backend Responsibilities

The backend must provide a production-ready, secure REST API handling:

1. **Authentication & Session Management**: JWT access token + refresh token lifecycle, password hashing via bcrypt, user login, logout, and token rotation.
2. **Multi-Tenant Isolation**: Enforcing tenant-level data scoping (`clientId`) across all data queries and mutations.
3. **Core CRUD Services**:
   * Client Management (Tenant onboarding & metadata)
   * Vehicle Directory & Technical Specs
   * Driver Registry & Vehicle Allocations
   * Fuel Transaction Ledger & Expense Tracking
   * Maintenance Service Logs & Status Transitions
   * Keuring / APK Safety Inspection Records
   * Commercial Insurance Policies
   * Compliance Document Metadata & Storage
4. **Telematics & GPS Gateway**:
   * Traccar device ID / IMEI mapping
   * Live telemetry ingest / socket payload handling
   * Geocoding / address resolution storage
   * Route history waypoint recording and playback APIs
5. **Automated Alert & Notification Engine**:
   * Daily/background evaluation of Keuring and Insurance expiration dates
   * Overspeed telemetry breach detection against user-configured threshold (`speedThreshold`)
   * Notification generation, status updates (`read`), and push/email alert flags
6. **Dashboard Aggregations & Analytics**:
   * KPI aggregation endpoints (Active fleet counts, maintenance counts, expiring Keuring/insurance alerts)
   * Fuel consumption time-series trends
   * Vehicle status distribution metrics
7. **Report Generation & Export Services**:
   * Aggregating utilization, fuel spend, maintenance costs, and compliance pass rates
   * Server-side export formatting for Excel, CSV, and PDF downloads
8. **User Profile & System Settings**:
   * Profile update APIs (name, email, avatar, language preferences)
   * Telematics threshold configurations (`speedThreshold`, `idleAlertMinutes`)
   * Notification delivery channel preferences

---

## 4. Main Database Entities

| Entity Name | Purpose | Important Fields | Relationships | Primary UI Pages |
| :--- | :--- | :--- | :--- | :--- |
| **User** | System user account & authentication | `id`, `name`, `email`, `passwordHash`, `role`, `avatar`, `language`, `speedThreshold`, `idleAlertMinutes`, `receivePushNotifications`, `receiveEmailNotifications` | Belongs to `Client` (optional for super admin) | Login, Top Navbar, Settings |
| **RefreshToken** | JWT token refresh lifecycle management | `id`, `tokenHash`, `userId`, `expiresAt`, `revokedAt`, `replacedByToken` | Belongs to `User` | Auth Service |
| **Client** | Multi-tenant organization tenant account | `id`, `name`, `code`, `email`, `phone`, `address`, `status`, `createdDate` | Has Many `Vehicle`, `Driver`, `User` | Clients, Top Navbar Dropdown |
| **Vehicle** | Commercial fleet vehicle record & specs | `id`, `clientId`, `name`, `plate`, `vin`, `engineNumber`, `make`, `model`, `manufactureYear`, `type`, `status`, `gpsEnabled`, `speed`, `fuelLevel`, `battery`, `address`, `driverId`, `odometer`, `fuelType`, `tankCapacity`, `grossPayload`, `netPayload`, `traccarDeviceId`, `trackerImei`, `insuranceExpiry`, `keuringExpiry`, `maintenanceDue`, `photo`, `lat`, `lng`, `course`, `lastUpdate` | Belongs to `Client`, Belongs to `Driver` (optional), Has Many `FuelLog`, `MaintenanceLog`, `KeuringRecord`, `Document`, `Notification`, `RouteHistory` | Dashboard, Vehicles (Grid & 10-Tab Detail), Live Tracking, Reports |
| **Driver** | Fleet driver operator profile | `id`, `clientId`, `name`, `phone`, `email`, `licenseNumber`, `avatar`, `assignedVehicleId`, `status`, `experience` | Belongs to `Client`, Belongs to `Vehicle` (optional), Has Many `DriverAssignmentHistory` | Drivers, Vehicles Detail |
| **DriverAssignmentHistory** | Historical record of driver-to-vehicle allocations | `id`, `driverId`, `vehicleId`, `assignedAt`, `unassignedAt`, `status` | Belongs to `Driver`, Belongs to `Vehicle` | Drivers Detail View |
| **FuelLog** | Refueling transaction record | `id`, `clientId`, `vehicleId`, `date`, `fuelAmount`, `cost`, `odometer`, `driverName` | Belongs to `Client`, Belongs to `Vehicle` | Fuel Management, Vehicles Detail, Dashboard, Reports |
| **MaintenanceLog** | Repair task and service record | `id`, `clientId`, `vehicleId`, `serviceType`, `date`, `cost`, `status`, `notes`, `provider` | Belongs to `Client`, Belongs to `Vehicle` | Maintenance, Vehicles Detail, Dashboard, Reports |
| **KeuringRecord** | Periodic technical safety inspection (APK) | `id`, `clientId`, `vehicleId`, `certificateId`, `lastInspectionDate`, `expiryDate`, `station`, `result`, `status`, `notes`, `documentUrl`, `inspectorName` | Belongs to `Client`, Belongs to `Vehicle` | Keuring / Inspection, Vehicles Detail, Dashboard, Reports |
| **Document** | Attached compliance file metadata | `id`, `clientId`, `vehicleId`, `title`, `category`, `size`, `uploadDate`, `expiryDate`, `fileUrl` | Belongs to `Client`, Belongs to `Vehicle` | Compliance Docs, Vehicles Detail, Insurance |
| **Notification** | System alert & notification log | `id`, `clientId`, `vehicleId`, `type`, `message`, `timestamp`, `severity`, `read` | Belongs to `Client`, Belongs to `Vehicle` | System Alerts, Top Navbar Overlay, Dashboard |
| **RouteHistory** | Telematics GPS location waypoints | `id`, `vehicleId`, `lat`, `lng`, `speed`, `course`, `timestamp`, `address` | Belongs to `Vehicle` | Live Tracking (Route Playback) |

---

## 5. User Roles & Permissions Matrix

Based strictly on existing UI functionality:

| Feature / Action | Platform Operations Manager | Fleet Manager / Client Admin | Driver / Operator |
| :--- | :--- | :--- | :--- |
| **Switch Client Tenant** | ✅ All Tenants | ❌ Restricted to own Tenant | ❌ Restricted to own Tenant |
| **Client Management (CRUD)** | ✅ Full CRUD | ❌ View Only | ❌ View Only |
| **Vehicles (Create / Edit / Delete)** | ✅ Full Access | ✅ Client Scope | ❌ Read Only |
| **Vehicles (View Directory & Detail)** | ✅ Full Access | ✅ Client Scope | ✅ Assigned Vehicle Only |
| **Drivers (Create / Edit / Delete)** | ✅ Full Access | ✅ Client Scope | ❌ View Self Profile Only |
| **Assign Driver to Vehicle** | ✅ Full Access | ✅ Client Scope | ❌ No Access |
| **Fuel Logs (Create / Edit / Delete)** | ✅ Full Access | ✅ Client Scope | ❌ View Only / Self Log |
| **Maintenance (Create / Status Update)** | ✅ Full Access | ✅ Client Scope | ❌ View Only |
| **Insurance (Adjust Date / Renew)** | ✅ Full Access | ✅ Client Scope | ❌ Read Only |
| **Keuring (Create / Edit / Delete)** | ✅ Full Access | ✅ Client Scope | ❌ Read Only |
| **Live Tracking & Route Playback** | ✅ Full Access | ✅ Client Scope | ❌ Assigned Vehicle Only |
| **Analytics & Data Exports** | ✅ Full Access | ✅ Client Scope | ❌ No Access |
| **Notifications (Mark Read / Delete)** | ✅ Full Access | ✅ Client Scope | ✅ View Own Alerts |
| **Profile & System Settings** | ✅ Full Access | ✅ Own Settings | ✅ Own Settings |

---

## 6. External Integrations

Based on the UI elements and functionality inspected:

1. **Traccar GPS Telematics Gateway**
   * **Status**: Required (for real-time telematics ingest, device ID mapping, IMEI registration, and route waypoint storage).
   * **Details**: Integrated via Traccar Device ID (`traccarDeviceId`) and IMEI (`trackerImei`).
2. **Cloud Object Storage (AWS S3 / Azure Blob Storage)**
   * **Status**: Required (for persisting vehicle photos, driver avatars, and compliance document PDFs like Keuring APK certificates and insurance policies).
   * **Details**: Replaces Unsplash mock image URLs and local PDF strings.
3. **Email Notification Service (SendGrid / AWS SES / SMTP)**
   * **Status**: Required (for sending email digests on expiring Keuring certificates and critical overspeed alerts as configured in user settings).
   * **Details**: Triggered by user setting `receiveEmailNotifications`.
4. **Map Tile Provider (CartoDB / OpenStreetMap / Esri)**
   * **Status**: Frontend Client-side (already functioning via Leaflet).
   * **Details**: No direct backend tile server needed; backend provides geocoded address metadata if reverse geocoding is handled server-side.
5. **SMS / WhatsApp Gateway**
   * **Status**: Not currently required by UI.
6. **Payment Gateway (Stripe / PayPal)**
   * **Status**: Not currently required by UI (client tenant subscriptions are tracked via `status` field in UI without direct checkout flow).
