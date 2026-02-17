const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'pokemon_user',
  password: process.env.DB_PASSWORD || 'pokemon_password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pokemon_tracker',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all games
app.get('/api/games', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY release_year ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get game by ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching game:', err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Get user progress
app.get('/api/progress/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM user_progress WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get game content tracker
app.get('/api/progress/:userId/game/:gameId', async (req, res) => {
  try {
    const { userId, gameId } = req.params;
    const result = await pool.query(
      'SELECT * FROM game_content_tracker WHERE user_id = $1 AND game_id = $2',
      [userId, gameId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching content tracker:', err);
    res.status(500).json({ error: 'Failed to fetch content tracker' });
  }
});

// Create user progress
app.post('/api/progress', async (req, res) => {
  try {
    const { userId, gameId, status } = req.body;
    const result = await pool.query(
      'INSERT INTO user_progress (user_id, game_id, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, gameId, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating progress:', err);
    res.status(500).json({ error: 'Failed to create progress' });
  }
});

// Update game content item
app.put('/api/content/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const { is_completed } = req.body;
    const result = await pool.query(
      'UPDATE game_content_tracker SET is_completed = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [is_completed, contentId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating content:', err);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Get game content items
app.get('/api/games/:gameId/content', async (req, res) => {
  try {
    const { gameId } = req.params;
    const result = await pool.query(
      'SELECT * FROM game_content WHERE game_id = $1 ORDER BY order_num ASC',
      [gameId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching game content:', err);
    res.status(500).json({ error: 'Failed to fetch game content' });
  }
});

// Create or update game progress
app.post('/api/progress/user/:userId/game/:gameId', async (req, res) => {
  try {
    const { userId, gameId } = req.params;
    const { status, started_at, completed_at } = req.body;
    
    // Check if progress exists
    const existingResult = await pool.query(
      'SELECT id FROM user_progress WHERE user_id = $1 AND game_id = $2',
      [userId, gameId]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update existing
      result = await pool.query(
        'UPDATE user_progress SET status = $1, completed_at = $2, updated_at = NOW() WHERE user_id = $3 AND game_id = $4 RETURNING *',
        [status, completed_at, userId, gameId]
      );
    } else {
      // Create new
      result = await pool.query(
        'INSERT INTO user_progress (user_id, game_id, status, started_at, completed_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, gameId, status, started_at || new Date(), completed_at]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error managing progress:', err);
    res.status(500).json({ error: 'Failed to manage progress' });
  }
});

// Upload and parse save file
app.post('/api/savefile/upload/:userId/:gameId', upload.single('savefile'), async (req, res) => {
  try {
    const { userId, gameId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine file format based on size
    const fileSize = req.file.size;
    const formatInfo = determineSaveFileFormat(fileSize);

    // Store save file info in database
    await pool.query(
      'UPDATE user_progress SET save_file_imported = true, save_file_path = $1 WHERE user_id = $2 AND game_id = $3',
      [req.file.originalname, userId, gameId]
    );

    // Parse save file (simplified - actual parsing depends on format)
    const parseResult = {
      format: formatInfo,
      fileSize: fileSize,
      game_id: gameId,
      user_id: userId,
      imported: true,
      timestamp: new Date(),
    };

    res.json({
      message: 'Save file uploaded successfully',
      file: req.file.originalname,
      format: formatInfo,
      size: fileSize,
      parseResult,
    });
  } catch (err) {
    console.error('Error uploading save file:', err);
    res.status(500).json({ error: 'Failed to upload save file' });
  }
});

// Helper function to determine save file format
function determineSaveFileFormat(fileSize) {
  const formats = {
    8192: 'Game Boy (8KB)',
    32768: 'Game Boy Color (32KB)',
    131072: 'Game Boy Advance (128KB)',
    524288: 'Nintendo DS (512KB)',
  };
  
  return formats[fileSize] || `Unknown (${fileSize} bytes)`;
}

// Get user statistics
app.get('/api/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_games,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_games,
        SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_games,
        SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started_games,
        ROUND(SUM(CASE WHEN status = 'completed' THEN completion_time_hours ELSE 0 END)) as total_hours_completed
      FROM user_progress
      JOIN games ON user_progress.game_id = games.id
      WHERE user_id = $1`,
      [userId]
    );

    res.json(statsResult.rows[0]);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Pokemon Tracker API listening on port ${PORT}`);
});
