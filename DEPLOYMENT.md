# Pokémon Track Deployment Guide

This guide will help you deploy and run the Pokémon Tracker application using Docker.

## Prerequisites

### Required
- Docker Desktop (version 20.10 or higher)
  - Download from: https://www.docker.com/products/docker-desktop
- Docker Compose (usually included with Docker Desktop)
- At least 4GB of available RAM
- About 1GB of disk space

### Verification
To verify Docker installation, run in PowerShell:
```powershell
docker --version
docker-compose --version
```

## Quick Start (Recommended)

### Step 1: Navigate to the Project Directory
Open PowerShell and navigate to the project folder:
```powershell
cd "C:\Users\sophie.wilson\OneDrive - Verisure\Documents\Work\Scripts\Pokemon tracking Site"
```

### Step 2: Start All Services
Build and start all containers:
```powershell
docker-compose up --build
```

This command will:
- Build the backend Docker image
- Build the frontend Docker image
- Pull the PostgreSQL image
- Create a network between containers
- Initialize the database with all Pokémon game data
- Start all services

### Step 3: Wait for Services to Start
Look for these messages in the console:
- `pokemon_db | PostgreSQL 15 is now accepting connections` - Database is ready
- `pokemon_api | Pokemon Tracker API listening on port 5000` - API is ready
- `pokemon_ui | webpack compiled with...` - Frontend is ready

This typically takes 1-2 minutes for first run.

### Step 4: Access the Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000/api/games
- **Health Check**: http://localhost:5000/api/health

## File Uploads & Storage

### Save Files Location
When you upload save files through the web interface, they are:
- Stored in the backend container's memory temporarily
- Parsed for game progress information
- Progress data saved to PostgreSQL database

The actual save files are not persisted on disk unless you modify the configuration.

### To Enable Persistent Save File Storage

Edit `docker-compose.yml` and add under `backend` service:
```yaml
volumes:
  - ./backend:/app
  - /app/node_modules
  - ./saves:/app/saves  # Add this line
```

Create the `saves` folder in your project root:
```powershell
New-Item -ItemType Directory -Force -Path "saves"
```

## Stopping and Restarting

### Stop All Services
```powershell
docker-compose down
```

### Stop and Remove Data (Fresh Start)
```powershell
docker-compose down -v
```

⚠️ **Warning**: The `-v` flag removes all data including the database!

### Restart Services
```powershell
docker-compose restart
```

## Checking Logs

### View All Logs
```powershell
docker-compose logs -f
```

### View Specific Service Logs
```powershell
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f db
```

Press `Ctrl+C` to exit logs.

## Troubleshooting

### Port Already in Use
If you get "port already in use" error:

**Option 1: Kill the Process Using the Port**
```powershell
# Find process using port 3000
Get-Process | Where-Object { $_.Id -eq (Get-NetTCPConnection -LocalPort 3000).OwningProcess }

# Kill the process (replace PID with the actual process ID)
Stop-Process -Id PID
```

**Option 2: Change Ports in docker-compose.yml**
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Changed from 3000:3000
  
  backend:
    ports:
      - "5001:5000"  # Changed from 5000:5000
```

### Database Connection Error
```powershell
# Check database container status
docker-compose ps

# View database logs
docker-compose logs -f db

# Restart database
docker-compose restart db
```

### Frontend Can't Connect to API
Ensure the API URL in frontend matches your backend:
- File: `frontend/src/App.js`
- Default: `http://localhost:5000`
- Change if using a different port

### Out of Memory
```powershell
# Check Docker resource usage
docker stats

# Limit container memory in docker-compose.yml
services:
  backend:
    memory: 512m
```

## Development Workflow

### Making Code Changes

**Backend Changes:**
1. Edit files in `backend/src/`
2. The container automatically reloads (nodemon enabled)
3. Check logs: `docker-compose logs -f backend`

**Frontend Changes:**
1. Edit files in `frontend/src/`
2. The container automatically reloads (React dev server)
3. Check http://localhost:3000

**Database Changes:**
1. Modify `db/init.sql`
2. Run: `docker-compose down -v` (removes data)
3. Run: `docker-compose up` (recreates with new schema)

### Installing New Packages

**Backend:**
```powershell
docker-compose exec backend npm install <package-name>
```

**Frontend:**
```powershell
docker-compose exec frontend npm install <package-name>
```

## Environment Variables

### Backend (.env file)
Create `backend/.env` with:
```env
NODE_ENV=development
DB_HOST=db
DB_PORT=5432
DB_USER=pokemon_user
DB_PASSWORD=pokemon_password
DB_NAME=pokemon_tracker
PORT=5000
```

### Frontend Environment
Edit `docker-compose.yml` under frontend service:
```yaml
environment:
  REACT_APP_API_URL: http://localhost:5000
  REACT_APP_VERSION: 1.0.0
```

## Performance Optimization

### Use BuildKit (Faster Builds)
```powershell
$env:DOCKER_BUILDKIT=1
docker-compose up --build
```

### Reduce Image Size
- Images are ~400MB for backend, ~300MB for frontend
- First build may take 3-5 minutes
- Subsequent builds use cache and are much faster

## Monitoring

### Real-time Container Stats
```powershell
docker stats
```

### Database Connection Health
The database includes a health check:
```powershell
docker-compose ps
# Shows PostgreSQL health status
```

## Backup & Restore

### Backup Database
```powershell
docker-compose exec db pg_dump -U pokemon_user pokemon_tracker > backup.sql
```

### Restore Database
```powershell
docker-compose exec -T db psql -U pokemon_user pokemon_tracker < backup.sql
```

## Advanced: Running Without Docker

If you prefer to run services manually:

1. Install PostgreSQL 15
2. Install Node.js 18+
3. Create database and run `db/init.sql`
4. Set environment variables
5. Run: `npm start` in backend and frontend folders

See README.md for manual setup instructions.

## Production Deployment

For production deployment:

1. Update environment variables
2. Use stronger database passwords
3. Enable HTTPS
4. Use a reverse proxy (nginx)
5. Set up backups and monitoring
6. Consider using Docker Swarm or Kubernetes

See Docker documentation for production best practices.

## Support & Issues

For issues:
1. Check logs: `docker-compose logs`
2. Verify Docker is running: `docker ps`
3. Check internet connection (first build downloads images)
4. Try a fresh start: `docker-compose down -v && docker-compose up --build`

## Next Steps

After deployment:
1. Create a user profile
2. Import your save files
3. Start tracking your Pokémon game progress!
4. Check out the features in the application

Enjoy tracking your Pokémon journey! 🎮✨
