# SmartFleet - Transport Management System

SmartFleet is a production-structured MERN Transport Management System for manufacturing logistics operations.

## Stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui-compatible setup (`components.json` + reusable primitives)
- React Router DOM
- Axios
- Framer Motion
- Recharts
- React Hook Form + Zod

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs
- dotenv
- cors
- Zod validation

## Repository Structure

```txt
root/
  client/
  server/
  README.md
```

## Features Delivered

- JWT auth with persistent session and `/auth/me` validation
- Role-based access support for:
  - Admin
  - Transport Manager
  - Driver
  - Warehouse Staff
- Dashboard KPIs, charts, recent shipments, alerts
- Fleet module with add/delete, pagination, search, filter, sort
- Shipment module with Kanban board, status updates, timeline view, priority labels
- Driver module with profile management and performance indicators
- Notification center with read tracking
- Analytics dashboards (deliveries, vehicle utilization, fuel trend, performance)
- Responsive app layout with collapsible sidebar
- Light/Dark mode
- Glassmorphism cards, modern tables, loading skeletons, empty states, animation

## Local Setup

## 1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

API runs at `http://localhost:5000`.

## 2) Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Environment Variables

### `server/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartfleet
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Seed Data

```bash
cd server
npm run seed
```

The seed script populates operational records only. Create user accounts through the signup flow.

## API Overview

Base URL: `/api`

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET/POST/PUT/DELETE /vehicles`
- `GET /vehicles/alerts/maintenance`
- `GET/POST/PUT/DELETE /drivers`
- `GET /drivers/performance/top`
- `GET/POST/PUT/DELETE /shipments`
- `GET /shipments/board`
- `GET /shipments/:id/timeline`
- `GET /analytics`
- `GET /notifications`
- `POST /notifications`
- `PATCH /notifications/:id/read`

## Deployment Guide

## Frontend -> Vercel

1. Import repository in Vercel.
2. Set root directory to `client`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env: `VITE_API_BASE_URL=https://<render-backend-domain>/api`

## Backend -> Render

1. Create a new Web Service from repository.
2. Set root directory to `server`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `server/.env.example`.
6. Allow CORS origin from deployed Vercel URL.

## Database -> MongoDB Atlas

1. Create cluster and database named `smartfleet`.
2. Add user credentials.
3. Whitelist Render outbound IPs (or use broader IP rule if required).
4. Put full connection URI into `MONGO_URI`.

## Suggested Production Enhancements (Optional)

- Socket.IO for live dashboard updates
- Google Maps live trip tracking
- PDF exports for reports
- Audit/activity log stream
- E2E tests + CI pipelines
