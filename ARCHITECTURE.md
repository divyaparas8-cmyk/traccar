# FleetFlow FMS — Backend Architecture Document

## 1. System Architecture Overview

The FleetFlow backend is designed as a production-grade, scalable, decoupled **MVC (Model-View-Controller)** architecture using:

* **Runtime**: Node.js LTS
* **Web Framework**: Express.js
* **ORM**: Prisma ORM
* **Database**: MySQL (XAMPP)
* **Authentication**: JWT (Short-Lived Access Token + Long-Lived Refresh Token)
* **Validation**: Zod
* **Application Logging**: Pino
* **HTTP Request Logging**: Morgan
* **Security**: Helmet, CORS, Express Rate Limit, Bcrypt

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                   │
│                        React 18 + Vite (FleetFlow Web App)                       │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ HTTP / HTTPS (REST API)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               EXPRESS.JS BACKEND                                 │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                            SECURITY & MIDDLEWARE                           │  │
│  │    Helmet  │  CORS  │  Rate Limiter  │  Morgan  │  JWT Auth  │  Zod Valid   │  │
│  └────────────────────────────────────┬───────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ROUTES LAYER                                  │  │
│  │   /api/v1/auth    /api/v1/vehicles   /api/v1/drivers   /api/v1/telematics   │  │
│  └────────────────────────────────────┬───────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                           CONTROLLERS LAYER                                │  │
│  │            (Extract HTTP request, invoke service, format response)          │  │
│  └────────────────────────────────────┬───────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                            SERVICES LAYER                                  │  │
│  │    (Business Logic, Tenant Scoping, Calculations, External API Calls)      │  │
│  └────────────────────────────────────┬───────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                          PRISMA ORM / DATA LAYER                           │  │
│  │                  (Database Query Generation, Transactions)                 │  │
│  └────────────────────────────────────┬───────────────────────────────────────┘  │
└───────────────────────────────────────┼──────────────────────────────────────────┘
                                        │ SQL Queries
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                DATABASE LAYER                                    │
│                            MySQL Database (XAMPP)                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
backend/
├── src/
│   ├── config/             # Environment variables, database, JWT & service configs
│   ├── controllers/        # Request handlers (HTTP params parsing & response sending)
│   ├── middleware/         # Auth, RBAC, error handling, rate limiting, logging
│   ├── models/             # Business entity interfaces & Prisma wrapper types
│   ├── routes/             # REST endpoint router declarations
│   ├── services/           # Core business logic & database queries via Prisma
│   ├── validators/         # Zod schemas for request validation
│   ├── utils/              # Pino logger, AppError, response helpers, pagination
│   ├── constants/          # Enums, HTTP status codes, error codes, defaults
│   ├── app.js              # Express application setup & middleware assembly
│   └── server.js           # Server entry point & graceful shutdown hooks
│
├── prisma/
│   ├── schema.prisma       # Prisma database schema definition
│   └── migrations/         # MySQL database migrations
│
├── docs/                   # API contracts and specifications
├── .env                    # Local environment secrets (ignored by git)
├── .env.example            # Environment template file
├── package.json            # Dependencies and scripts
└── README.md               # Backend operational setup instructions
```

### Folder Responsibilities:
* `src/config/`: Manages configuration constants, imports `dotenv`, exports validated environment settings (port, database connection string, JWT secrets).
* `src/controllers/`: Receives requests from routes, extracts query/params/body, delegates processing to services, handles response output formatting. Must **never** contain raw database queries or direct business rules.
* `src/services/`: Contains pure business logic, database queries using Prisma Client, multi-tenant filtering (`clientId`), transaction management, and calculations (e.g., Keuring expiry statuses, dashboard metrics).
* `src/routes/`: Defines API routes under `/api/v1/`, attaching validation middleware, authentication middleware, and controller methods.
* `src/middleware/`: Intercepts requests for JWT authentication, role verification (RBAC), request validation, rate limiting, and global error handling.
* `src/validators/`: Defines strict schema validation using Zod for incoming HTTP body payload, URL path parameters, and query strings.
* `src/utils/`: Shared utilities including custom `AppError` class, Pino application logger setup, JWT token generation/verification helpers, and standardized pagination response builders.
* `src/constants/`: System constants (User roles, HTTP status codes, default thresholds, pagination defaults).

---

## 3. Layer Responsibilities & Strict Code Separation

To guarantee code maintainability, scalability, and adherence to clean architectural principles:

1. **Routes Layer**: Pure route declarations mapping URLs to middlewares and controller methods. No logic.
2. **Controllers Layer**: HTTP abstraction layer. Responsible for:
   * Parsing HTTP request headers, body, params, and query strings.
   * Calling the corresponding Service method.
   * Sending HTTP responses using standardized JSON format.
3. **Services Layer**: Domain business logic layer. Responsible for:
   * Applying business validation rules and tenant scoping filters.
   * Executing database queries via Prisma Client.
   * Computing data metrics (e.g., fuel average cost per liter, Keuring days remaining).
   * Throwing custom `AppError` exceptions when domain rules fail.
4. **Prisma ORM Layer**: Database abstraction. Executes parameterised SQL queries, manages relations, indices, and data transactions.

---

## 4. Authentication Architecture

The backend implements a **Dual-Token Authentication System** using **Short-Lived Access Tokens** and **Long-Lived Refresh Tokens**.

```
  ┌─────────┐                                        ┌─────────┐
  │ Client  │                                        │ Server  │
  └────┬────┘                                        └────┬────┘
       │                                                  │
       │ 1. POST /api/v1/auth/login {email, password}     │
       ├─────────────────────────────────────────────────►│ Verify Password (bcrypt)
       │                                                  │ Generate Access Token (15m)
       │                                                  │ Generate Refresh Token (7d)
       │ 2. Returns { accessToken, refreshToken, user }   │ Store RefreshToken in DB
       │◄─────────────────────────────────────────────────┤
       │                                                  │
       │ 3. GET /api/v1/vehicles (Header: Bearer Access) │
       ├─────────────────────────────────────────────────►│ Auth Middleware validates JWT
       │ 4. Returns 200 OK { data }                       │ Inject req.user & req.clientId
       │◄─────────────────────────────────────────────────┤
       │                                                  │
       │ (Access Token Expires)                           │
       │                                                  │
       │ 5. POST /api/v1/auth/refresh { refreshToken }    │
       ├─────────────────────────────────────────────────►│ Verify Refresh Token in DB
       │                                                  │ Rotate Refresh Token
       │ 6. Returns New { accessToken, refreshToken }     │ Update DB record
       │◄─────────────────────────────────────────────────┤
       │                                                  │
```

### Key Security Design Parameters:
* **Password Hashing**: Passwords are hashed using `bcrypt` with a salt round factor of `12`.
* **Access Tokens**: Signed JWT containing `userId`, `email`, `role`, and `clientId`. Short lifespan (`15 minutes`).
* **Refresh Tokens**: Cryptographically random UUID tokens stored as hashed entries in the database (`RefreshToken` model). Lifespan (`7 days`).
* **Token Rotation**: Every time a refresh token is used, it is revoked and replaced with a new refresh token. If a revoked token is reused, all refresh tokens for that user session are invalidated (replay attack prevention).
* **Logout**: Invalidates and soft-deletes/revokes the refresh token record in the database.

---

## 5. Authorization & Multi-Tenancy (RBAC + Tenant Isolation)

### 5.1 Role-Based Access Control (RBAC)
User roles defined in the system:
* `PLATFORM_OPERATIONS_MANAGER` (Super Admin)
* `FLEET_MANAGER` (Client Tenant Admin)
* `DRIVER` (Vehicle Operator)

Role authorization is enforced via middleware: `restrictTo('PLATFORM_OPERATIONS_MANAGER', 'FLEET_MANAGER')`.

### 5.2 Multi-Tenant Scoping Architecture
* Every domain entity (`Vehicle`, `Driver`, `FuelLog`, `MaintenanceLog`, `KeuringRecord`, `Document`, `Notification`) has a mandatory foreign key `clientId`.
* When a non-SuperAdmin user makes a request, the `clientId` is extracted from their verified JWT token.
* Services automatically append `{ where: { clientId: req.user.clientId } }` to all Prisma queries.
* If a `PLATFORM_OPERATIONS_MANAGER` sends a specific `selectedClientId` query param (or `'all'`), the service applies the specified filter or queries globally.

---

## 6. Centralized Error Handling Architecture

Errors are handled consistently across the application using a custom operational error class `AppError` and a global Express error handler middleware.

```javascript
// Operational Error Class
class AppError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Global Error Middleware Strategy:
* Catches all synchronous and asynchronous errors (via Express async wrapper).
* Formats operational errors into standard JSON error responses.
* Translates Prisma database errors (e.g., `P2002` Unique Constraint Violation, `P2025` Record Not Found) into user-friendly HTTP responses (409 Conflict, 404 Not Found).
* Prevents leaking internal stack traces in production environments (`NODE_ENV === 'production'`).

---

## 7. Request Validation Layer

All incoming client requests are validated before reaching controller logic using **Zod** schema middleware:

```javascript
// Middleware pattern
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    next(new AppError('Validation failed', 400, err.errors));
  }
};
```

---

## 8. Logging & Telemetry Architecture

The system employs two distinct logging mechanisms:

1. **Application & Service Logger**: `Pino`
   * Fast, structured JSON logging.
   * Used in services, background schedulers, and error handlers.
   * Logs include timestamps, log levels, transaction IDs, and error stack traces.
2. **HTTP Request Logger**: `Morgan`
   * Logs incoming HTTP request methods, URLs, status codes, response times, and IP addresses.
   * Piped directly into Pino stream in production mode.

---

## 9. Security Architecture & Controls

* **Helmet**: Sets security HTTP headers (`Content-Security-Policy`, `X-Frame-Options`, `X-XSS-Protection`, etc.).
* **CORS**: Restricted to authorized origins configured in `FRONTEND_URL`.
* **Rate Limiting**: `express-rate-limit` enforces IP rate limits (e.g., max 100 requests per 15 minutes for general API endpoints; max 10 requests per 15 minutes for `/api/v1/auth/login`).
* **Input Sanitization**: Prevents SQL injection (inherent with Prisma parameterized queries) and XSS payload injections.
* **Sensitive Field Masking**: Password hashes and refresh tokens are excluded from API response JSON structures.

---

## 10. Database Architecture & Indexing Strategy

MySQL database (XAMPP) managed by **Prisma ORM**.

### Primary Key Strategy:
* `UUID` strings (`@default(uuid())`) are used for external entity IDs (`User`, `Client`, `Vehicle`, `Driver`, `Document`, `Notification`) to prevent enumeration attacks.
* Sequential BigInt/Integers (`@id @default(autoincrement())`) used for high-frequency logs (`FuelLog`, `MaintenanceLog`, `KeuringRecord`, `RouteHistory`).

### Indexing Strategy:
To optimize filtering, multi-tenant queries, and telemetry time-series queries:
* `Vehicle`: Index on `(clientId, status)`, Index on `(vin)`, Index on `(plate)`, Index on `(traccarDeviceId)`.
* `Driver`: Index on `(clientId, status)`, Index on `(assignedVehicleId)`.
* `FuelLog`: Index on `(clientId, vehicleId, date)`.
* `MaintenanceLog`: Index on `(clientId, vehicleId, status)`.
* `KeuringRecord`: Index on `(clientId, vehicleId, expiryDate, status)`.
* `Notification`: Index on `(clientId, read, timestamp)`.
* `RouteHistory`: Index on `(vehicleId, timestamp)`.

---

## 11. Environment Configuration

The application loads runtime variables from `.env` using `dotenv`.

### Required Environment Variables:
```env
# Server Config
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Connection (MySQL - XAMPP)
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/fleetflow_fms"

# JWT Authentication Config
JWT_ACCESS_SECRET=your_super_secret_access_key_here_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Telematics & External Integrations (If active)
TRACCAR_SERVER_URL=http://traccar.internal:8082
TRACCAR_API_TOKEN=your_traccar_api_token
```
