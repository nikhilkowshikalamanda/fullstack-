# CivicFix - Smart Public Issue Reporting and Resolution Platform

A Full Stack Web Development group project (React + Vite client, Node.js + Express server, local JSON data store).

> **Academic demonstration.** Authentication, storage and hosting choices are designed for a classroom demo, not for a real public service. See [Limitations](#limitations).

## 1. Real-life problem
Citizens meet potholes, overflowing garbage bins, broken streetlights, blocked drains and leaking pipes every day. Reporting them is confusing (which office? which phone number?), and people almost never learn whether their complaint was acted on. Authorities, in turn, lack a simple view of what is pending and what is resolved.

## 2. Proposed solution and objectives
CivicFix is a web platform where citizens report public issues with a description, location and photo, receive a **complaint ID**, and track progress publicly. Administrators review reports, update their status, document resolutions and monitor statistics.

Objectives:
- Make reporting simple (one form, optional photo, optional GPS).
- Make progress transparent (status history and resolution notes).
- Protect privacy (reporter e-mail never shown publicly; tracking needs ID **and** e-mail).
- Give administrators a secure dashboard (server-side authentication, search, filters, activity history).
- Demonstrate full-stack skills: React, REST API, validation, file uploads, sessions, rate limiting.

## 3. Users and roles
| User | What they can do |
|---|---|
| Visitor | View home page statistics, browse public issues |
| Citizen (reporter) | Submit issues with photo, track their complaint (ID + e-mail), mark a resolved complaint as unresolved |
| Administrator | Log in, view all complaints (with reporter e-mail), search/filter/sort, change status, add notes and after-resolution photos, view statistics and activity history |

## 4. Features
- Public home page with statistics, category cards, recent reports and announcements
- Issue form with validation, optional photo, optional browser geolocation, duplicate-report warning
- Unique complaint IDs (`CF-YYYYMMDD-XXXXX`), timestamps, full status history
- Complaint tracking with e-mail verification; "mark as unresolved" after resolution
- Public issue list with search, category/status filters, sorting and paging
- Admin dashboard: stats, category and status charts, complaint table, details, status updates, activity log
- Photo uploads: type + size + signature checks, random server-generated file names
- Free map support: OpenStreetMap links (no API key, no paid service)
- Security: bcrypt-hashed admin password, HttpOnly SameSite session cookie, rate limiting, input validation, restricted CORS, private data kept out of public responses

## 5. Technology stack
- **Client:** React 18, React Router 6, Vite 5, plain CSS (HTML, CSS, JavaScript)
- **Server:** Node.js 18+, Express 4, multer (uploads), bcryptjs (hashing), cookie-parser, cors, express-rate-limit, dotenv
- **Data:** local JSON file (`server/data/db.json`, created automatically) and image files in `server/uploads/`

## 6. Folder structure
```
Group-Project/
├── README.md
├── .gitignore
├── screenshots/
│   └── README.md            (how to capture genuine screenshots)
├── client/
│   ├── package.json  vite.config.js  index.html  .gitignore
│   └── src/
│       ├── main.jsx  App.jsx  api.js  constants.js  styles.css
│       ├── context/AuthContext.jsx
│       ├── hooks/useAsync.js
│       ├── components/  Navbar Footer StatusBadge IssueCard Feedback Field
│       │                LocationLink Timeline ProtectedRoute
│       └── pages/       Home ReportIssue TrackComplaint BrowseIssues IssueDetail
│                        AdminLogin AdminDashboard NotFound
└── server/
    ├── package.json  server.js  .env.example  .gitignore
    ├── uploads/.gitkeep      (uploaded photos are saved here)
    ├── data/                 (db.json is generated on first run; not committed)
    └── src/
        ├── app.js  config.js  db.js  seedData.js  validate.js  upload.js
        ├── auth.js  sessions.js  middleware.js  serializers.js
        ├── similar.js  stats.js  list.js  activity.js  errors.js
        └── routes/  public.js issues.js auth.js admin.js
```

## 7. Prerequisites
- Node.js 18 or newer (check with `node -v`) - https://nodejs.org (LTS)
- Visual Studio Code - https://code.visualstudio.com
- Git and GitHub Desktop (for uploading)

## 8. Setup in VS Code
1. Unzip `Group-Project.zip`. In VS Code choose **File > Open Folder** and select `Group-Project`.
2. Open two terminals: **Terminal > New Terminal**, then click the **+** (or split icon) to get a second one.

**Terminal 1 - server**
```bash
cd server
npm install
```
Create your environment file (never commit it):
```bash
# Windows PowerShell / Command Prompt
copy .env.example .env
# macOS / Linux
cp .env.example .env
```
Open `server/.env` and set `ADMIN_PASSWORD` to a password of your own (8+ characters). Optionally change `ADMIN_USERNAME`. Then:
```bash
npm run dev
```
You should see `CivicFix API running at http://localhost:5000`. Check `http://localhost:5000/api/health`.

**Terminal 2 - client**
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173**. The Vite dev server forwards `/api` and `/uploads` to port 5000 (see `client/vite.config.js`), so keep the server running.

## 9. Environment variables (`server/.env`)
| Variable | Meaning | Default |
|---|---|---|
| `PORT` | API port | 5000 |
| `NODE_ENV` | `development` or `production` (production makes cookies HTTPS-only) | development |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS | http://localhost:5173 |
| `ADMIN_USERNAME` | Demo admin username | admin |
| `ADMIN_PASSWORD` | Demo admin password (hashed with bcrypt at start-up). **No default - you must set it.** | - |
| `SESSION_HOURS` | Admin session length | 8 |
| `MAX_UPLOAD_MB` | Maximum photo size | 5 |

### Seeded admin without publishing credentials
The administrator is "seeded" from `.env` each time the server starts: the password you write in your **local** `.env` is hashed in memory and only the hash is used. `.env` is listed in `.gitignore`, so it is never uploaded. Share the password with your teacher privately, not in the repository.

## 10. API documentation
Base URL: `http://localhost:5000` (the client uses `/api` through the Vite proxy). Errors return JSON `{ "message": "...", "errors": { field: "..." } }`.

| Method & path | Access | Description | Main status codes |
|---|---|---|---|
| GET `/api/health` | public | Server check | 200 |
| GET `/api/stats` | public | Totals for the home page | 200 |
| GET `/api/announcements` | public | Announcements | 200 |
| GET `/api/issues` | public | List (query: `search, category, status, sort, page, limit`). Rejected reports and private data are excluded | 200 |
| GET `/api/issues/similar` | public | Possible duplicates (query: `category, address, lat, lng`) | 200 |
| GET `/api/issues/:id` | public | One public issue | 200, 404 |
| POST `/api/issues` | public, rate-limited | Create issue. `multipart/form-data`: `title, description, category, address, email, lat?, lng?, photo?` | 201, 400, 413, 429 |
| GET `/api/issues/track/:complaintId` | reporter | Header `X-Reporter-Email` must match the stored e-mail | 200, 400, 404, 429 |
| POST `/api/issues/:id/flag-unresolved` | reporter | JSON `{ email, reason }`; only for resolved complaints | 200, 400, 404, 409 |
| POST `/api/auth/login` | public, rate-limited | JSON `{ username, password }`; sets HttpOnly cookie | 200, 400/401, 429, 503 |
| POST `/api/auth/logout` | any | Ends the session, clears cookie | 200 |
| GET `/api/auth/me` | admin | Current admin | 200, 401 |
| GET `/api/admin/stats` | admin | Full statistics | 200, 401 |
| GET `/api/admin/issues` | admin | List with `search, status, category, sort, page, limit` | 200, 401 |
| GET `/api/admin/issues/:id` | admin | Detail including reporter e-mail | 200, 401, 404 |
| PATCH `/api/admin/issues/:id/status` | admin | `multipart/form-data`: `status, note, resolutionPhoto?` | 200, 400, 401, 404 |
| GET `/api/admin/activity` | admin | Latest 50 administrative actions | 200, 401 |

Status values: `pending`, `in_progress`, `resolved`, `rejected`. Categories: `pothole`, `garbage`, `streetlight`, `drainage`, `water_leakage`, `other`.

## 11. Example testing workflow
Sample data is created on first run (8 issues, 3 announcements, all with `@example.com` addresses). A ready-made sample for tracking: complaint ID `CF-20261017-PTH01` with e-mail `citizen1@example.com`.

**Citizen**
1. Open Home - check statistics and recent reports.
2. Report an issue: choose *Pothole*, address `Gandhi Road near City Bus Stand` - a **similar report warning** should appear. Try submitting an empty form to see validation messages.
3. Submit a valid report with a small JPG/PNG. Note the complaint ID.
4. Open Track Complaint, enter the ID and your e-mail - status is *Pending*. A wrong e-mail must be rejected.
5. Open Public issues - your report is listed without your e-mail or complaint ID.

**Administrator**
6. Open Admin, log in with the credentials from your `.env`. Wrong password should fail.
7. Find your complaint (search by its ID), open it, set *In progress* with a note, then *Resolved* with a note and an optional photo.
8. Check the Activity history tab.

**Back to the citizen**
9. Track the complaint again: see history and resolution note, then use **Mark as unresolved**. The status returns to *Pending*.
10. Without logging in, open `http://localhost:5000/api/admin/stats` - it must answer `401`.

## 12. Screenshots
Capture genuine screenshots of your own running copy using `screenshots/README.md`, then add the images here:

<!-- ![Home](screenshots/01-home.png) -->
<!-- ![Report form](screenshots/02-report-form.png) -->
<!-- ![Tracking](screenshots/03-track-complaint.png) -->
<!-- ![Public issues](screenshots/04-public-issues.png) -->
<!-- ![Admin dashboard](screenshots/05-admin-dashboard.png) -->

## 13. Group members (edit before submission)
| Name | Roll number | Contribution |
|---|---|---|
| [Member 1 name] | [Roll no.] | [e.g. Server API] |
| [Member 2 name] | [Roll no.] | [e.g. Report/track pages] |
| [Member 3 name] | [Roll no.] | [e.g. Admin dashboard] |
| [Member 4 name] | [Roll no.] | [e.g. Documentation/testing] |

## 14. How it works (viva notes)
- **Request flow:** React page -> `api.js` -> Vite proxy -> Express route -> `validate.js` -> `db.js` (JSON) -> `serializers.js` (decides what each audience may see) -> JSON response.
- **Privacy:** `serializers.js` has three views (public / reporter / admin). Public views never contain e-mail or complaint ID.
- **Admin protection:** `requireAdmin` middleware checks the cookie session on every admin route. Hiding buttons in React is only for convenience.
- **Safe JSON writes:** all writes go through one queue and use write-temp-file-then-rename, so concurrent requests cannot corrupt `db.json`.
- **Uploads:** random file names, MIME allow-list, size limit, magic-byte check, files saved on disk (never base64 in JSON), served read-only with `nosniff`.
- **Sessions:** random 256-bit token in an HttpOnly, SameSite=Lax cookie; the server stores only its SHA-256 hash.

## Verification status (be honest in your viva)
This project was assembled and checked **offline**: the server's data layer, validation, duplicate detection, statistics and privacy serializers were run with a Node test script, all server files passed `node --check`, and all client files passed a JSX syntax parse. The full application (installing dependencies, running Express and Vite, browser flows) could **not** be run where the code was generated, so run the testing workflow above on your machine and fix any small issue you find before submission. Do not state that the project has been fully tested until you have done so.

## Limitations
- JSON file storage suits a **single server instance** only; use PostgreSQL/MongoDB in production.
- Admin sessions are held in memory (lost on restart); one shared demo admin account; no password reset or roles.
- Reporter "verification" is just knowing the e-mail used; no e-mail confirmation is sent.
- Uploaded photos are served publicly by (unguessable) URL; images are not re-encoded and EXIF metadata (e.g. GPS) is not removed; no virus scanning; local disk is not durable on most cloud hosts.
- Rate limits are per process and in memory. No CSRF tokens (SameSite cookie + CORS only). No HTTPS in development.
- Duplicate detection is simple word/distance matching. No map tiles are embedded; links open OpenStreetMap.

## Future scope
Real database, e-mail/SMS notifications, hashed multi-admin accounts with roles, e-mail verification, cloud image storage with EXIF stripping, interactive maps, department assignment and SLA timers, multilingual UI, automated tests and CI.

## Conclusion
CivicFix shows how a small full-stack application can turn scattered civic complaints into a transparent, trackable workflow while respecting privacy and following basic security practice.
