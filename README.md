# Calculator — Full-Stack Application

A full-stack calculator with a **Go REST API** back end and a **React** front end.

---

## Architecture

```
Calculator/
├── backend/                 # Go REST API
│   ├── handlers/
│   │   ├── handlers.go
│   │   └── handlers_test.go
│   ├── middleware/
│   │   ├── cors.go
│   │   └── cors_test.go
│   ├── models/
│   │   └── models.go
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
└── frontend/                # React SPA
    ├── src/
    │   ├── components/      # Calculator UI
    │   ├── hooks/           # useCalculator logic hook
    │   ├── services/        # Axios API calls
    │   └── utils/           # Pure validators
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── Dockerfile
```

---

## Prerequisites

| Tool              | Minimum version |
|-------------------|-----------------|
| Docker            | 24.x            |
| Docker Compose    | v2.x            |
| Go *(dev only)*   | 1.21            |
| Node.js *(dev only)* | 20.x         |

---

## Running with Docker (recommended)

```bash
# 1. Clone / navigate to the project root
cd Calculator

# 2. Build and start both services
docker compose up --build

# 3. Open the app
#    Frontend → http://localhost:3000
#    Backend  → http://localhost:8080
```

To stop:
```bash
docker compose down
```

---

## Running locally (development)

### Backend

```bash
cd backend
go run .
# API listens on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App opens on http://localhost:3000
# Vite proxies /api/* → http://localhost:8080
```

---

## API Reference

All endpoints accept `Content-Type: application/json` via `POST`.

### `POST /add`

```json
{ "addend1": 232.2, "addend2": -232.1 }
```

### `POST /subtract`

```json
{ "minuend": 1.2, "subtrahend": 2.1 }
```

### `POST /multiply`

```json
{ "multiplicand": 1.2, "multiplier": 2.1 }
```

### `POST /divide`

```json
{ "dividend": 1.2, "divisor": 2.1 }
```

### Success response `200 OK`

```json
{ "result": "23.2" }
```

### Error response `400 Bad Request`

```json
{
  "errors": [
    {
      "errorCode": "MISSING_FIELD",
      "errorClass": "VALIDATION",
      "errorMessage": "field 'addend1' is required and must be numeric"
    }
  ]
}
```

**Error codes**

| `errorCode`        | `errorClass` | Meaning                              |
|--------------------|--------------|--------------------------------------|
| `MISSING_FIELD`    | `VALIDATION` | Field absent or non-numeric          |
| `DIVISION_BY_ZERO` | `VALIDATION` | Divisor is zero                      |
| `INTERNAL_ERROR`   | `INTERNAL`   | Invalid JSON or unexpected condition |

---

## Running tests

### Backend

```bash
cd backend

# Run all unit tests
go test ./...

# Run with verbose output
go test -v ./...

# Generate coverage report (HTML)
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
# Open coverage.html in a browser

# Or view in terminal
go tool cover -func=coverage.out
```

### Frontend

```bash
cd frontend
npm install

# Run all unit tests once
npm test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run coverage
# HTML report → frontend/coverage/index.html
```

---

## Environment variables

### Frontend

| Variable        | Default | Description                                          |
|-----------------|---------|------------------------------------------------------|
| `VITE_API_URL`  | `/api`  | Base URL for backend API calls (override in prod).   |

Create a `.env.local` file inside `frontend/` to set this locally:

```
VITE_API_URL=http://localhost:8080
```

When running via Docker Compose the nginx `proxy_pass` directive forwards
`/api/*` traffic to the `backend` container, so no env-var change is needed.
