# NexusHR — Enterprise HR Management System

NexusHR is a modern, enterprise-ready Human Resource Management System (HRMS) designed to streamline employee tracking, attendance logs, leave cycles, performance reviews, and real-time corporate communications. Rebranded and upgraded from the SyncWork core engine, the application is divided into a robust backend API service and an interactive frontend client dashboard.

---

## 🚀 Key Features

* **Employee Lifecycle Management**: Register employees, assign roles, manage CTC allocations, and track department rosters.
* **Attendance & Time Logs**: Daily check-in/out tracking with built-in validation rules to prevent duplicate punches or missing check-in entries.
* **Leave Management Flow**: Full request-and-approval pipeline. Applying for leave validates employee records and sends background email notifications to administrators.
* **Performance Review Cycles**: Standardized evaluation periods (e.g., quarterly reviews) featuring employee self-assessments, manager feedback, and ratings.
* **Real-time Notifications**: Notice board announcements and task assignments are dispatched asynchronously using background threads to ensure low HTTP latency.
* **Corporate Chat**: Real-time department chat messaging backed by a STOMP-over-WebSocket protocol.

---

## 🛠️ Technology Stack

| Layer | Technology / Framework | Details |
| :--- | :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.3.0 | Bean container, REST API web server, Spring WebSockets |
| **Persistence** | Hibernate JPA, PostgreSQL 14+ | Relational data persistence, automatic schema mapping |
| **Security** | Spring Security, BCrypt | Secure passwords, Role-Based Access Control (RBAC) |
| **Frontend** | React 18, TypeScript, Vite | Single-page application, fast Hot Module Replacement |
| **Styling** | Tailwind CSS | Utility-first responsive dashboard layout |
| **Email Alerts** | Brevo API / SMTP | Asynchronous notification broadcasting |

---

## ⚙️ Decoupled Architecture Flow

The application implements a decoupled client-server architecture model:

```
+--------------------------------------------------------+
|                      React Client                      |
+--------------------------------------------------------+
         | (Axios HTTP)                   ^ (STOMP WebSockets)
         v                                |
+------------------+             +-----------------------+
|  REST Controllers|             | WebSocket Broker      |
+------------------+             +-----------------------+
         |                                |
         +----------------+---------------+
                          v
+--------------------------------------------------------+
|                 Spring Boot Service Layer              |
+--------------------------------------------------------+
         | (Spring Data JPA)              | (ForkJoinPool Async)
         v                                v
+------------------+             +-----------------------+
| PostgreSQL DB    |             | SMTP / Brevo Mailer   |
+------------------+             +-----------------------+
```

1. **HTTP Requests**: The React frontend sends JSON payloads to the Spring Boot REST endpoints (port `8080`).
2. **Database Operations**: Spring Data JPA maps Java entities directly to PostgreSQL tables (`localhost:5432`).
3. **Asynchronous Handlers**: Long-running email alerts (e.g., notice board publications) run inside a background thread pool (`ForkJoinPool.commonPool`), returning a `200 OK` response to the client immediately.
4. **WebSocket Server**: Active frontend clients subscribe to STOMP channels to receive live chat messages.

---

## 📋 Pre-requisites & Local Environment Setup

To run the application locally, ensure you have the following packages installed:
* **Operating System**: Linux (Ubuntu 20.04+ recommended)
* **Java SDK**: OpenJDK 17
* **Build Tool**: Maven 3.6+
* **Database**: PostgreSQL 14+
* **Node.js**: Node v22.x (a local binary package can be auto-configured)

### 1. Database Installation & Configuration
Create a PostgreSQL user `postgres` with password `postgres` and initialize a database named `nexushr`:

```bash
# Run the automated database setup script
./setup_postgres.sh
```

Alternatively, configure it manually in PostgreSQL CLI (`psql`):
```sql
ALTER USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE nexushr;
```

### 2. Dependency & Path Configurations
Set up OpenJDK 17, Maven, and extract local Node.js binaries:
```bash
./setup_env.sh
```

### 3. Launching the Services
Start the backend service in the background and run the frontend development server:
```bash
./run_local.sh
```
* **Frontend Access**: Open [http://localhost:5173](http://localhost:5173) in your web browser.
* **Backend API Docs**: View [http://localhost:8080](http://localhost:8080).
* **Logs**: Backend logs are written directly to `backend.log`.

---

## 🔑 Default Seed Accounts (Admin)

When the server starts, the database is auto-populated with three default administrator accounts if no employee records exist:

1. **Sahil Sepat**
   * Employee Code: `SAHIL@NEXUSHR`
   * Email: `sahil.sepat@nexushr.com`
   * Role: `ADMIN`
2. **Rudra Tiwari**
   * Employee Code: `RUDRA@NEXUSHR`
   * Email: `rudra.tiwari@nexushr.com`
   * Role: `ADMIN`
3. **Aditi Gupta**
   * Employee Code: `ADITI@NEXUSHR`
   * Email: `aditi.gupta@nexushr.com`
   * Role: `ADMIN`

---

## 🔌 Core REST API Endpoint Catalog

### 👥 Employees
* `POST /api/employees` - Register a new employee. Uniqueness of email and employee code is strictly enforced.
* `GET /api/employees` - Retrieve a full list of employees.
* `GET /api/employees/code/{empCode}` - Retrieve employee details by employee code.
* `PUT /api/employees/{id}/ctc` - Update employee CTC value.
* `DELETE /api/employees/{id}` - Cascade-delete an employee and all associated logs.

### 📅 Attendance
* `POST /api/attendance/check-in/{empCode}` - Daily clock-in. Returns `400 Bad Request` if already checked in today.
* `PUT /api/attendance/check-out/{empCode}` - Daily clock-out. Returns `400 Bad Request` if no check-in exists for today or if already checked out.

### ✉️ Leaves
* `POST /api/leaves` - Request a leave period. Validates employee code and dispatches async notification emails to admin users.
* `PUT /api/leaves/{id}/status` - Approve or reject a leave request. Sends async update email to the employee.

### 📊 Performance Reviews
* `POST /api/reviews` - Initiate a review cycle for an employee. Sends async start email to the employee.
* `PATCH /api/reviews/{id}` - Update a review record. Used by employees to submit self-assessments (notifies admins) and by managers to add ratings & feedback (notifies employee).

---

## 🛠️ Troubleshooting

### 1. Port Collision (8080 or 5173 already in use)
If backend or frontend servers fail to start because the port is locked, clear the process manually:
```bash
# Release port 8080
kill -9 $(lsof -t -i:8080) || true

# Release port 5173
kill -9 $(lsof -t -i:5173) || true
```

### 2. Database Connections Failed
Check if the PostgreSQL daemon is active:
```bash
pg_isready -h localhost -p 5432
# If inactive, restart it:
sudo systemctl restart postgresql
```
