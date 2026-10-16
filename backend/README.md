# SolarApp Backend (Node.js + Express + MySQL)

## Run on Windows (PowerShell)
```
cd backend
copy .env.example .env        # then edit DB_PASSWORD, JWT_SECRET, SUPERADMIN_SETUP_KEY
npm install
npm run server                # nodemon, or: npm start
```
Server: http://localhost:3000 (health check: GET /health). Frontend origin allowed: http://localhost:5173 (CORS_ORIGINS).

First SuperAdmin (once): `POST /SuperAdmin/setup-first-superadmin` `{name,email,password,setupKey}`.

## Auth
`Authorization: Bearer <token>`. Roles in the JWT: `SuperAdmin`, `junior_admin`. Only these two may use the APIs below.
A junior admin only ever sees/changes rows whose `admin_id` is their own id. SuperAdmin sees everything and must pass `admin_id` when creating employees/customers.

## Endpoints (prefix : route)
| Area | Method + path |
|---|---|
| SuperAdmin | POST /SuperAdmin/setup-first-superadmin, POST /SuperAdmin/SuperAdmin_Login (also POST /Junior_Admin/superadmin-login) |
| Junior admin | POST /Junior_Admin/Junior_Admin_register (SuperAdmin), POST /Junior_Admin/junior_Admin_Login, GET /Junior_Admin/junior_Admin/:id (SuperAdmin) |
| Employees | POST /Employe/Employe_create, GET /Employe/Employees, GET/PUT/DELETE /Employe/Employees/:id |
| Customers | POST /Customer/Customer_Create, GET /Customer/Customers, GET/PUT/DELETE /Customer/Customers/:id, POST /Customer/Customers/:id/addresses |
| Services | POST /Service/service_create, GET /Service/services, GET /Service/services/:id, PUT .../:id/Assign, /Start, /Hold, /Resume, /Complete, GET .../:customerId/History |
| Attendance | POST /Hr/attendance, GET /Hr/attendance/:employee_id?month&year, GET /Hr/attendance/:employee_id/summary?month&year |
| Salary | PUT/GET /Hr/salary/:employeeId, GET /Hr/salary/:employeeId/calculate?month&year, GET /Hr/salary-slip/:userId |
| Location | POST /Livelocation/live-user, GET /Livelocation/live-user/:id, GET /Livelocation/live-user/history/:id |
| Sites | POST /Site/sitename, GET /Site/sitenames |
| Chat / alerts | under /admin (user-info, user-chat/history, chat-upload-image, chat-message, messages/:id/seen, alert-all, messages/:id) |
| Other | /Hr/expenses*, /Hr/weekly-leaderboard, /admin/office-expense |

Service status flow: PENDING -> ASSIGNED -> IN_PROGRESS <-> HOLD (hold needs `hold_reason`) -> COMPLETED.

## Tests
`database/schema.sql` is a reconstructed schema for a scratch database. With the server running against it: `npm run test:api`
(needs Node 18+; set `API_BASE` not supported — edit `B` in tests/api_test.mjs if the port differs).
