# 330 Group Project

Campus ReHome - A furniture marketplace for campus communities.

## Quick Start

**New to the project?** See [SETUP.md](./SETUP.md) for detailed setup instructions.

## Project Structure

```
├── frontend/          # React frontend application
├── backend/           # Node.js/Express backend server
├── api/               # API services
├── docs/              # Documentation
├── tests/             # Test files
└── scripts/           # Utility scripts
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Access to Heroku database (get connection string from Heroku dashboard)

### Backend Setup
```bash
cd backend
npm install

# Create .env file with:
# DATABASE_URL=mysql://user:password@host:port/database
# PORT=3000
# NODE_ENV=development

npm run dev
```
Server runs on `http://localhost:3000`

### Frontend Setup
```bash
cd frontend
npm install

# Create .env file with:
# VITE_API_URL=http://localhost:3000/api

npm run dev
```
Frontend runs on `http://localhost:5173`

## For Collaborators

**First time setting up?** Follow the detailed instructions in [SETUP.md](./SETUP.md)

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL (Heroku)

