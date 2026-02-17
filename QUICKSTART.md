# 🎮 Pokémon Tracker Quick Start Guide (Windows)

Welcome! This guide will get your Pokémon Tracker up and running in just a few minutes.

## Installation (5 minutes)

### 1. Install Docker
- Download Docker Desktop from: https://www.docker.com/products/docker-desktop
- Run the installer
- Complete the installation and restart your computer if prompted
- Open a new PowerShell window and verify: `docker --version`

### 2. Start the Application

Open PowerShell in the project folder and run:

```powershell
docker-compose up --build
```

Wait for these messages to appear:
```
pokemon_db | PostgreSQL 15 is now accepting connections
pokemon_api | Pokemon Tracker API listening on port 5000
pokemon_ui | webpack compiled successfully
```

### 3. Open Your Browser
- Go to: **http://localhost:3000**
- That's it! 🎉

## Using the Application

### Track Progress
1. Click any game to view details
2. Click "Playing" or "Done" to update status
3. Check off gyms and side quests as you complete them

### Import Save Files
1. Click a game to open it
2. Click "Import Save File"
3. Browse for your save file (.sav or .3ds)
4. Upload and watch your progress populate!

### View Statistics
Your progress is automatically saved and visible in the main list with progress bars.

## Stopping the App

Press `Ctrl+C` in PowerShell to stop all services.

To clean up (remove all data):
```powershell
docker-compose down -v
```

## Common Issues

### "Port 3000 is already in use"
```powershell
# Kill the process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### "Cannot connect to Docker daemon"
- Make sure Docker Desktop is running
- Right-click the Docker icon in system tray

### Frontend opens but shows "Connecting..."
Wait a bit longer - the backend may still be starting
Check: http://localhost:5000/api/health

## File Locations

- **Games Database**: `db/init.sql` (35+ games included!)
- **Backend API**: `backend/server.js`
- **Frontend App**: `frontend/src/App.js`
- **Save Storage**: Backend memory (can be persisted)

## Features Included

✅ All 36+ Pokémon games
✅ Release years and platforms
✅ Completion time estimates
✅ Progress bars for each game
✅ Manual progress tracking
✅ Gym badge tracking
✅ Save file import (Game Boy to Switch)
✅ User statistics

## Next Steps

1. **Customize Games**: Edit `db/init.sql` to add more content items
2. **Import Your Saves**: Use the import feature for auto-filling progress
3. **Track Everything**: Mark gyms, side quests, and milestones
4. **Change Ports**: Edit `docker-compose.yml` if conflicts occur

## Helpful Commands

```powershell
# See all running containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Completely fresh start
docker-compose down -v
docker-compose up --build
```

## Need Help?

- **API Documentation**: See `DEPLOYMENT.md`
- **Detailed Setup**: See `README.md`
- **Logs**: Run `docker-compose logs -f` to see what's happening

---

**You're all set!** 🎮 Go track that Pokémon game progress!

For questions or feature requests, check the project's documentation files.
