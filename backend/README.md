# Backend Setup

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file (already created with your connection string):

```
DATABASE_URL=mysql://user:password@host:port/database
PORT=3000
NODE_ENV=development
```

## Running the Server

Development (with auto-reload):
```bash
npm run dev
```

Production:
```bash
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Health
- `GET /api/health` - Server health check

## Database Schema

Make sure your MySQL database has these tables:

### users
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR) - hashed
- `name` (VARCHAR, nullable)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### items
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR)
- `quantity` (INT)
- `condition` (VARCHAR)
- `price` (DECIMAL)
- `status` (VARCHAR)
- `image_url` (VARCHAR, nullable)
- `description` (TEXT, nullable)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

