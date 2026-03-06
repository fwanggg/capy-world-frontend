# Capybara AI

A full-stack web application built with React, Node.js, and TypeScript.

## Project Structure

```
├── frontend/       # React + TypeScript web application
├── backend/        # Express.js API server
├── shared/         # Shared types and utilities
└── package.json    # Root workspace configuration
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Running Development Servers

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will:
- Run the frontend on `http://localhost:3000`
- Run the backend on `http://localhost:3001`
- Automatically proxy API calls from frontend to backend

### Running Individual Services

**Frontend only:**
```bash
npm run dev --workspace=frontend
```

**Backend only:**
```bash
npm run dev --workspace=backend
```

### Building

Build all workspaces:

```bash
npm run build
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development servers (frontend + backend) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm test` | Run tests in all workspaces |

## Architecture

### Frontend

- React 18 with TypeScript
- Vite for fast development and optimized builds
- API integration with backend

### Backend

- Express.js server
- CORS enabled for frontend communication
- Runs on port 3001

### Shared

Shared types and utilities used by both frontend and backend.
