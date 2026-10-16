# Solar Service – Admin Frontend (React + Vite)

Frontend for the provided Express/MySQL backend. Plain React (JavaScript), React Router, Axios, hand-written CSS
(dark navy sidebar, orange actions).

## Run on Windows (PowerShell)

Backend first (in the `backend` folder):

```powershell
cd backend
copy .env.example .env      # if you don't have a .env yet; set DB + JWT_SECRET values
npm install
npm run server              # http://localhost:3000
```

Frontend (in this folder):

```powershell
cd solar-frontend
copy .env.example .env
npm install
npm run dev
```

Open the URL Vite prints: **http://localhost:5173**

> The backend only allows the origins listed in its `CORS_ORIGINS` env var
> (default `http://localhost:5173,http://127.0.0.1:5173`). `vite.config.js` pins the dev server to port 5173
> (`strictPort`) so it always matches. If you change the port, add the new origin to the backend's `CORS_ORIGINS`.

Backend URL is set in `.env`: `VITE_API_BASE_URL=http://localhost:3000` (used only in `src/api/client.js`).

First login: create the first SuperAdmin once with
`POST /SuperAdmin/setup-first-superadmin { name, email, password, setupKey }`
(setupKey = `SUPERADMIN_SETUP_KEY` from backend `.env`). Then log in as SuperAdmin, register a Junior Admin
(Junior Admins page), and log in as that Junior Admin to create employees/customers.

## Roles (from the backend JWT)

| Role | Login endpoint | Sees |
|---|---|---|
| `SuperAdmin` | `POST /SuperAdmin/SuperAdmin_Login` | everything; must give a **Junior Admin ID** when creating employees/customers; Junior Admins page |
| `junior_admin` | `POST /Junior_Admin/junior_Admin_Login` | only rows whose `admin_id` is their own id (enforced by the backend) |

No Employee/Customer login exists in the backend, so none is built.

## Project layout

```
src/api/client.js        axios instance, base URL, JWT header, 401 handling, error messages
src/api/endpoints.js     every backend call, grouped by module
src/auth/AuthContext.jsx login/logout, session restore, token-expiry handling
src/components/          Layout (sidebar/topbar), ui.jsx (Modal, Notice, Card, useFetch…), AdminIdField
src/pages/               one file per screen
```

## APIs used per module

| Module | Endpoints |
|---|---|
| Login | POST `/SuperAdmin/SuperAdmin_Login`, POST `/Junior_Admin/junior_Admin_Login` |
| Junior Admins | POST `/Junior_Admin/Junior_Admin_register`, GET `/Junior_Admin/junior_Admin/:id` |
| Dashboard | GET `/Employe/Employees`, `/Customer/Customers`, `/Service/services`, `/Site/sitenames` |
| Employees | POST `/Employe/Employe_create`, GET `/Employe/Employees`, PUT/DELETE `/Employe/Employees/:id` |
| Customers | POST `/Customer/Customer_Create`, GET `/Customer/Customers`, PUT/DELETE `/Customer/Customers/:id`, POST `/Customer/Customers/:id/addresses`, GET `/Service/services/:customerId/History` |
| Services | POST `/Service/service_create`, GET `/Service/services`, PUT `/Service/services/:id/{Assign,Start,Hold,Resume,Complete}` |
| Attendance | POST `/Hr/attendance`, GET `/Hr/attendance/:id?month&year`, GET `/Hr/attendance/:id/summary?month&year` |
| Salary | PUT/GET `/Hr/salary/:id`, GET `/Hr/salary/:id/calculate?month&year` |
| Locations | POST `/Livelocation/live-user`, GET `/Livelocation/live-user/:id`, GET `/Livelocation/live-user/history/:id` |
| Site Names | POST `/Site/sitename`, GET `/Site/sitenames` |
| Chat | GET `/admin/user-info`, GET `/admin/user-chat/history?group_id`, POST `/admin/chat-upload-image` (multipart field `image`), POST `/admin/chat-message`, PATCH `/admin/messages/:id/seen`, DELETE `/admin/messages/:id` |
| Alerts | POST `/admin/alert-all` |

## Status

**Implemented (code complete, matched to backend source):** all modules above.

**Runtime-tested:** none. The build environment could not install npm packages (registry blocked) and had no MySQL,
so the app was only compile-checked (esbuild parsed every JSX file without errors). Please run the Windows steps above
and test Login → Employee Create first.

**Not built (backend routes exist but were outside the requested modules):** expenses (`/Hr/expenses*`),
office expense (`/admin/office-expense`), weekly leaderboard, salary slip (`/Hr/salary-slip/:userId`).

## Backend limitations that affect the UI

1. No "list Junior Admins" route → SuperAdmin types the Junior Admin ID when creating employees/customers (verified through the lookup route).
2. No "list chat groups" route → staff must enter a `group_id` to open a support chat.
3. No "list alerts" route → the Alerts page can only create alerts (and shows those sent this session).
4. Locations are stored updates only; there is no live/streaming endpoint, so no live tracking is shown.
5. Attendance dates are DATE columns serialised by mysql2 as timestamps; the UI formats them in the browser's local time, so browser and server should be in the same time zone (normal for local use).
6. Backend compares passwords in plain text (`password !== password` in the login controllers) even though `bcrypt` is installed. Not changed here, but worth fixing before production.
7. `Hr/salary-slip`, expense and leaderboard routes only check for a valid token (no admin scoping) — another reason they were left out of the UI.
