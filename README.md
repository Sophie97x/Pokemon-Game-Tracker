# Pokémon Game Tracker

A comprehensive web application to track your progress through all Pokémon games, including gym badges, side missions, and game completion status. Features save file import capability for Game Boy, DS, and 3DS save files.

## Features

- **Game Database**: All 36+ Pokémon games with release years, platforms, and completion times
- **Progress Tracking**: Mark games as "Not Started", "In Progress", "Paused", or "Completed"
- **Detailed Tracking**: Track individual gyms, side missions, Pokédex completion, and more
- **Progress Bars**: Visual progress indicators for each game
- **Save File Import**: Import save files from Game Boy, DS, 3DS, and Switch (coming soon)
- **Manual Tracking**: Manually check off progress items
- **Recommended Play Order**: Games organized by generation and release order

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React 18
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose

## Project Structure

```
pokemon-tracking-site/
├── backend/                    # Express.js API server
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── Dockerfile             # Docker container for backend
│   └── src/                   # API routes and utilities
├── frontend/                  # React application
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── index.js          # Entry point
│   │   ├── index.css         # Global styles
│   │   └── components/       # React components
│   ├── package.json          # Frontend dependencies
│   ├── Dockerfile            # Docker container for frontend
│   └── public/               # Static assets
├── db/
│   └── init.sql             # Database schema and initial data
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # This file
```

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)

## Quick Start with Docker

1. **Clone or navigate to the project directory**:
   ```bash
   cd pokemon-tracking-site
   ```

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

   This will:
   - Create a PostgreSQL database with all Pokémon games
   - Start the Node.js/Express backend API on port 5000
   - Start the React frontend on port 3000

3. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:5000
   - Health check: http://localhost:5000/api/health

4. **Stop the services**:
   ```bash
   docker-compose down
   ```

## Manual Setup (Without Docker)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=pokemon_user
DB_PASSWORD=pokemon_password
DB_NAME=pokemon_tracker
PORT=5000
```

Start the backend:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will open at http://localhost:3000

### Database Setup

Make sure PostgreSQL is installed and running, then run the SQL from `db/init.sql`.

## API Endpoints

### Games
- `GET /api/games` - Get all Pokémon games
- `GET /api/games/:id` - Get specific game details

### User Progress
- `GET /api/progress/user/:userId` - Get user's game progress
- `POST /api/progress` - Create/update game progress
- `GET /api/progress/:userId/game/:gameId` - Get specific game progress

### Content Tracking
- `GET /api/progress/:userId/game/:gameId` - Get all content items for a game
- `PUT /api/content/:contentId` - Update content item completion status

## Database Schema

### games
- `id`: Game ID
- `name`: Game name
- `generation`: Generation number (1-9)
- `release_year`: Year released
- `platform`: Gaming platform (Game Boy, DS, 3DS, Switch, etc.)
- `completion_time_hours`: Average completion time
- `description`: Game description
- `recommended_order`: Order to play games
- `save_file_format`: Save file format (SAV, 3DS, sav)

### game_content
- `id`: Content ID
- `game_id`: Reference to game
- `content_type`: Type (gym, side_mission, pokemon_catch, story_chapter)
- `name`: Content name
- `description`: Content description

### user_progress
- `id`: Progress ID
- `user_id`: User identifier
- `game_id`: Reference to game
- `status`: Current status (not_started, in_progress, completed, paused)
- `save_file_imported`: Whether save file was imported

### game_content_tracker
- `id`: Tracker ID
- `user_id`: User identifier
- `game_id`: Reference to game
- `content_id`: Reference to content
- `is_completed`: Completion status

## Features in Development

- **Save File Parsing**: Automatic parsing of save files to extract game progress
- **Achievements**: Track special achievements and milestones
- **Statistics**: Detailed statistics about your Pokémon game history
- **Social Features**: Share progress with other players
- **Mobile App**: Native mobile applications
- **Advanced Analytics**: Time spent, completion rates, shinies caught, etc.

## Supported Save File Formats

Currently, the following formats are planned for support:

- Game Boy/Color: `.sav` (8KB/32KB)
- Game Boy Advance: `.sav` (128KB)
- Nintendo DS: `.sav`
- Nintendo 3DS: `.3DS` format
- Nintendo Switch: `.sav` format

## Troubleshooting

### Port Already in Use
If ports 3000, 5000, or 5432 are already in use:
```bash
# Change port mapping in docker-compose.yml
# Or kill the process using the port
```

### Database Connection Error
Ensure PostgreSQL container is healthy:
```bash
docker-compose ps
docker-compose logs db
```

### Frontend Can't Reach API
Make sure the backend is running and check CORS settings in `backend/server.js`.

## Future Enhancements

- [ ] Multi-user authentication
- [ ] Save file automatic import and parsing
- [ ] Mobile responsiveness improvements
- [ ] Advanced progress analytics
- [ ] Pokédex tracker integration
- [ ] Route optimization based on Pokédex
- [ ] Trading/battling features
- [ ] Multiplayer progress sharing
- [ ] Dark mode
- [ ] Offline support

## Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

## License

MIT License

## Support

For issues or questions, please open an issue in the repository.
