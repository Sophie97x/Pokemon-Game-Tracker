# Pokémon Tracker API Documentation

Complete API reference for the Pokémon Tracker backend.

## Base URL

```
http://localhost:5000
```

## Authentication

Currently, the API does not require authentication. User tracking is based on `userId` passed in requests.

## Endpoints

### Health Check

#### Get API Health
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### Games

#### Get All Games
```
GET /api/games
```

**Query Parameters:**
- None

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Pokémon Red",
    "generation": 1,
    "release_year": 1996,
    "platform": "Game Boy",
    "completion_time_hours": 25,
    "description": "The original Pokémon adventure that started it all!",
    "recommended_order": 1,
    "save_file_format": "SAV"
  },
  ...
]
```

#### Get Game by ID
```
GET /api/games/:id
```

**Parameters:**
- `id` (number): Game ID

**Response (200):**
```json
{
  "id": 1,
  "name": "Pokémon Red",
  "generation": 1,
  "release_year": 1996,
  "platform": "Game Boy",
  "completion_time_hours": 25,
  "description": "The original Pokémon adventure that started it all!",
  "recommended_order": 1,
  "save_file_format": "SAV"
}
```

**Response (404):**
```json
{
  "error": "Game not found"
}
```

#### Get Game Content
```
GET /api/games/:gameId/content
```

**Parameters:**
- `gameId` (number): Game ID

**Response (200):**
```json
[
  {
    "id": 1,
    "game_id": 1,
    "content_type": "gym",
    "name": "Brock's Gym",
    "description": "Rock-type Gym Leader",
    "order_num": 1
  },
  ...
]
```

---

### User Progress

#### Get All User Progress
```
GET /api/progress/user/:userId
```

**Parameters:**
- `userId` (string): User identifier

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": "user_123456",
    "game_id": 1,
    "status": "in_progress",
    "started_at": "2026-02-17T10:00:00Z",
    "completed_at": null,
    "save_file_imported": false,
    "created_at": "2026-02-17T10:00:00Z",
    "updated_at": "2026-02-17T10:00:00Z"
  },
  ...
]
```

#### Get Game Progress for User
```
GET /api/progress/:userId/game/:gameId
```

**Parameters:**
- `userId` (string): User identifier
- `gameId` (number): Game ID

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": "user_123456",
    "game_id": 1,
    "content_id": 1,
    "is_completed": true,
    "completed_at": "2026-02-17T11:00:00Z",
    "created_at": "2026-02-17T10:00:00Z",
    "updated_at": "2026-02-17T11:00:00Z"
  },
  ...
]
```

#### Create/Update User Progress
```
POST /api/progress/user/:userId/game/:gameId
```

**Parameters:**
- `userId` (string): User identifier
- `gameId` (number): Game ID

**Request Body:**
```json
{
  "status": "in_progress",
  "started_at": "2026-02-17T10:00:00Z",
  "completed_at": null
}
```

Status options: `not_started`, `in_progress`, `completed`, `paused`

**Response (201):**
```json
{
  "id": 1,
  "user_id": "user_123456",
  "game_id": 1,
  "status": "in_progress",
  "started_at": "2026-02-17T10:00:00Z",
  "completed_at": null,
  "save_file_imported": false,
  "created_at": "2026-02-17T10:00:00Z",
  "updated_at": "2026-02-17T10:00:00Z"
}
```

---

### Content Tracking

#### Update Content Completion
```
PUT /api/content/:contentId
```

**Parameters:**
- `contentId` (number): Content item ID

**Request Body:**
```json
{
  "is_completed": true
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": "user_123456",
  "game_id": 1,
  "content_id": 1,
  "is_completed": true,
  "completed_at": "2026-02-17T11:00:00Z",
  "created_at": "2026-02-17T10:00:00Z",
  "updated_at": "2026-02-17T11:00:00Z"
}
```

**Response (404):**
```json
{
  "error": "Content not found"
}
```

---

### Save File Import

#### Upload and Import Save File
```
POST /api/savefile/upload/:userId/:gameId
```

**Parameters:**
- `userId` (string): User identifier
- `gameId` (number): Game ID

**Request:**
- Form data with `savefile` field containing the binary file

**Supported Formats:**
- Game Boy: `.sav` (8-32 KB)
- Game Boy Advance: `.sav` (128 KB)
- Nintendo DS: `.sav` (512 KB)
- Nintendo 3DS: `.3DS` format
- Nintendo Switch: `.sav` format

**Response (200):**
```json
{
  "message": "Save file uploaded successfully",
  "file": "Pokemon_Red.sav",
  "format": "Game Boy (8KB)",
  "size": 8192,
  "parseResult": {
    "format": "Game Boy",
    "fileSize": 8192,
    "game_id": 1,
    "user_id": "user_123456",
    "imported": true,
    "timestamp": "2026-02-17T10:00:00Z"
  }
}
```

**Response (400):**
```json
{
  "error": "No file uploaded"
}
```

**Response (500):**
```json
{
  "error": "Failed to upload save file"
}
```

---

### Statistics

#### Get User Statistics
```
GET /api/stats/:userId
```

**Parameters:**
- `userId` (string): User identifier

**Response (200):**
```json
{
  "total_games": 36,
  "completed_games": 5,
  "in_progress_games": 2,
  "paused_games": 1,
  "not_started_games": 28,
  "total_hours_completed": 125
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Data Types

### Game Object
```typescript
{
  id: number;
  name: string;
  generation: number;
  release_year: number;
  platform: string;
  completion_time_hours: number;
  description: string;
  recommended_order: number;
  save_file_format: string;
  created_at: ISO8601DateTime;
}
```

### Progress Object
```typescript
{
  id: number;
  user_id: string;
  game_id: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  started_at: ISO8601DateTime;
  completed_at: ISO8601DateTime | null;
  save_file_imported: boolean;
  save_file_path: string | null;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
}
```

### Content Object
```typescript
{
  id: number;
  game_id: number;
  content_type: 'gym' | 'side_mission' | 'pokemon_catch' | 'story_chapter';
  name: string;
  description: string;
  order_num: number;
  created_at: ISO8601DateTime;
}
```

### Content Progress Object
```typescript
{
  id: number;
  user_id: string;
  game_id: number;
  content_id: number;
  is_completed: boolean;
  completed_at: ISO8601DateTime | null;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. This is recommended for production deployments.

## CORS

CORS is enabled for all origins. This can be restricted in `backend/server.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

## Testing Endpoints

### Using cURL

```bash
# Get all games
curl http://localhost:5000/api/games

# Get specific game
curl http://localhost:5000/api/games/1

# Create user progress
curl -X POST http://localhost:5000/api/progress/user/test_user/game/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'

# Get user progress
curl http://localhost:5000/api/progress/user/test_user
```

### Using Postman

1. Import the API endpoints listed above
2. Set variables: `baseUrl=http://localhost:5000`, `userId=your_user_id`
3. Test each endpoint

---

## Future Enhancements

- [ ] Authentication & authorization
- [ ] Rate limiting
- [ ] Request validation schemas
- [ ] API versioning
- [ ] Webhooks
- [ ] Advanced filtering and sorting
- [ ] Pagination support
- [ ] Caching headers

---

Last updated: February 17, 2026
