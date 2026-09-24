# FleetFlow FMS — Production Backend API

Enterprise Multi-Tenant Fleet Management System (FMS) Backend API built with Node.js LTS, Express.js, Prisma ORM, and MySQL (XAMPP).

---

## 1. Features & Architecture

* **Architecture**: Production MVC + Service Layer design
* **Multi-Tenant Isolation**: Enforces tenant-level data scoping (`clientId`) across all API routes
* **Authentication**: Dual-token authentication with short-lived JWT Access Tokens (15m) and database-stored hashed Refresh Tokens (7d) with token rotation & revocation
* **Authorization**: Role-Based Access Control (RBAC) supporting `PLATFORM_OPERATIONS_MANAGER`, `FLEET_MANAGER`, and `DRIVER`
* **Validation**: Strict schema validation using Zod
* **Error Handling**: Centralized operational error management with custom `AppError` class
* **Logging**: Fast structured JSON application logging with Pino and HTTP request logging with Morgan
* **Security**: HTTP security headers (Helmet), CORS origin whitelist, IP rate limiting, input sanitization
* **Database**: MySQL (XAMPP) with Prisma ORM migrations, seeding, and UUID identifiers

---

## 2. Prerequisites & Setup

### Requirements
* **Node.js**: v18.x LTS or higher
* **MySQL**: v8.x or higher (via XAMPP)
* **npm**: v9.x or higher

### Environment Configuration
Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

Configure your MySQL (XAMPP) database connection string in `.env`:
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/fleetflow_fms"
```

---

## 3. Installation & Database Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **Run MySQL Database Migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed Database with Initial Enterprise Data**:
   ```bash
   npm run seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:5000` with health check endpoint available at `http://localhost:5000/health`.

---

## 4. API Endpoints Overview (`/api/v1`)

| Module | Base Path | Key Functionality |
| :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | Login, Token Refresh, Logout, User Profile (`/me`) |
| **Clients** | `/api/v1/clients` | Multi-tenant organization CRUD |
| **Vehicles** | `/api/v1/vehicles` | Fleet vehicle directory, 10-tab detail view endpoint, 4-step wizard registration |
| **Drivers** | `/api/v1/drivers` | Driver staff registry, vehicle allocation/unassign, assignment history |
| **Fuel Logs** | `/api/v1/fuel-logs` | Refueling tickets, volume & spend calculations |
| **Maintenance**| `/api/v1/maintenance` | Service logs, status progression (`scheduled` → `in_progress` → `completed`) |
| **Insurance** | `/api/v1/insurance` | Commercial policy coverage, 1-year auto-renewals, expiry date adjustments |
| **Keuring** | `/api/v1/keuring` | Periodic technical safety inspections (APK), status countdown calculation |
| **Documents** | `/api/v1/documents` | Compliance attachment repository, local file storage abstraction |
| **Telematics** | `/api/v1/telematics` | Live telemetry stream, route history playback waypoints & trip metrics |
| **Dashboard** | `/api/v1/dashboard` | Real-time database aggregations (Total Vehicles, Active, Maintenance, Alerts) |
| **Reports** | `/api/v1/reports` | Analytics summary & file export downloads (Excel, CSV, PDF) |
| **System Alerts**| `/api/v1/notifications`| Overspeed alerts, expiration notifications, mark read, delete |

---

## 5. Default Credentials for Testing

* **Platform Operations Manager**: `admin@fleetflow.com` / `admin123`
* **Fleet Manager**: `manager@wishutransport.com` / `admin123`

---

## 6. Project Structure

```
backend/
├── src/
│   ├── config/             # Environment, Database & Logger configs
│   ├── controllers/        # Request & Response handling
│   ├── middleware/         # Auth, RBAC, Rate Limiting, Error handling
│   ├── routes/             # REST endpoint routers
│   ├── services/           # Business logic & Prisma queries
│   ├── validators/         # Zod schemas
│   ├── utils/              # Pino logger, AppError, Response helpers, JWT
│   ├── constants/          # Enums & Status codes
│   ├── app.js              # Express app setup
│   └── server.js           # Server entry point
├── prisma/                 # Schema & Database seed script
├── uploads/                # Local storage directory for document attachments
├── logs/                   # Log output files
└── README.md
```
