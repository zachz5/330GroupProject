# Setup Instructions for Collaborators

Follow these steps to get the project running on your local machine.

## Prerequisites

- Node.js (v18 or higher) - [Download here](https://nodejs.org/)
- Git - [Download here](https://git-scm.com/)
- Access to the Heroku database (connection string from Heroku dashboard)

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with the actual GitHub repository details.

## Step 2: Get Database Connection String

1. Go to [Heroku Dashboard](https://dashboard.heroku.com)
2. Select the app
3. Go to **Settings** → **Config Vars**
4. Find `DATABASE_URL` (or the MySQL connection string)
5. Copy the entire connection string

## Step 3: Set Up Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```bash
# Create .env file
touch .env
```

Add this to the `.env` file (replace with your actual connection string):

```
DATABASE_URL=mysql://user:password@host:port/database
PORT=3000
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

The backend should now be running on `http://localhost:3000`

## Step 4: Set Up Frontend

Open a **new terminal window** (keep the backend running):

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```bash
# Create .env file
touch .env
```

Add this to the `.env` file:

```
VITE_API_URL=http://localhost:3000/api
```

Start the frontend development server:

```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

## Step 5: Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
- Backend (port 3000): Change `PORT=3001` in `backend/.env`
- Frontend (port 5173): Vite will automatically use the next available port

### Database Connection Issues
- Make sure you copied the entire `DATABASE_URL` from Heroku
- Check that the connection string starts with `mysql://`
- Verify you have access to the Heroku app as a collaborator

### Module Not Found Errors
- Delete `node_modules` folders and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

## Project Structure

```
├── backend/          # Node.js/Express API server
│   ├── .env         # Database connection (create this)
│   ├── routes/      # API routes
│   └── db/          # Database connection
├── frontend/        # React frontend
│   ├── .env         # API URL (create this)
│   └── src/         # React components and pages
└── README.md        # Project overview
```

## Common Commands

### Backend
```bash
cd backend
npm run dev      # Start development server
npm start        # Start production server
```

### Frontend
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
```

## Need Help?

- Check the main [README.md](./README.md) for project overview
- Make sure both backend and frontend servers are running
- Check that your `.env` files are in the correct locations
- Verify database connection string is correct

