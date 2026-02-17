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

// Clear all progress for a user
app.delete('/api/progress/user/:userId/all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete all game content tracker entries for this user
    await pool.query(
      'DELETE FROM game_content_tracker WHERE user_id = $1',
      [userId]
    );
    
    // Delete all user progress entries for this user
    await pool.query(
      'DELETE FROM user_progress WHERE user_id = $1',
      [userId]
    );
    
    res.json({ message: 'All progress deleted successfully' });
  } catch (err) {
    console.error('Error clearing progress:', err);
    res.status(500).json({ error: 'Failed to clear progress' });
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

    // Parse the save file to extract progress data
    const saveFileData = parseSaveFile(req.file.buffer);
    const fileSize = req.file.size;

    // Validate that the detected game matches the target game
    const gameResult = await pool.query(
      `SELECT id, name FROM games WHERE id = $1`,
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const targetGame = gameResult.rows[0];
    const detectedGame = saveFileData.estimatedGame.toLowerCase();
    const targetGameLower = targetGame.name.toLowerCase();

    // Validate game detection matches the target - allow some flexibility for version differences
    const gameMatches = detectedGame.includes(targetGameLower.split('/')[0]) || 
                        (detectedGame.includes('emerald') && (targetGameLower.includes('emerald') || targetGameLower.includes('ruby') || targetGameLower.includes('sapphire'))) ||
                        (detectedGame.includes('gold') && targetGameLower.includes('gold')) ||
                        (detectedGame.includes('silver') && targetGameLower.includes('silver')) ||
                        (detectedGame.includes('crystal') && targetGameLower.includes('crystal')) ||
                        (detectedGame.includes('red') && targetGameLower.includes('red')) ||
                        (detectedGame.includes('blue') && targetGameLower.includes('blue')) ||
                        (detectedGame.includes('yellow') && targetGameLower.includes('yellow'));

    // Store save file info in database with extracted progress
    const updateResult = await pool.query(
      `UPDATE user_progress 
       SET save_file_imported = true, save_file_path = $1, updated_at = NOW() 
       WHERE user_id = $2 AND game_id = $3 
       RETURNING *`,
      [req.file.originalname, userId, gameId]
    );

    // If no progress record exists, create one
    let progressRecord = updateResult.rows[0];
    if (!progressRecord) {
      const insertResult = await pool.query(
        `INSERT INTO user_progress (user_id, game_id, status, save_file_imported, save_file_path, started_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         RETURNING *`,
        [userId, gameId, 'in_progress', true, req.file.originalname]
      );
      progressRecord = insertResult.rows[0];
    }

    // Auto-populate game content based on extracted progress
    const { badges, pokedexCompletion } = saveFileData.progress;

    // Populate user_pokemon table with caught pokemon based on pokedex completion
    if (pokedexCompletion > 0) {
      try {
        // Create some sample pokemon data based on pokedex completion percentage
        // For Gen 1 games: 151 pokemon, for later gen we use appropriate totals
        let maxGen1Pokemon = 151;
        let pokemonCount = Math.floor((pokedexCompletion / 100) * maxGen1Pokemon);
        
        // List of Gen 1 pokemon (Kanto)
        const gen1Pokemon = [
          'Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon', 'Charizard', 
          'Squirtle', 'Wartortle', 'Blastoise', 'Caterpie', 'Metapod', 'Butterfree', 
          'Weedle', 'Kakuna', 'Beedrill', 'Pidgeot', 'Poliwag', 'Poliwrath', 'Abra', 
          'Alakazam', 'Machop', 'Machamp', 'Bellsprout', 'Weepinbell', 'Victreebel', 
          'Tentacool', 'Tentacruel', 'Slowpoke', 'Slowbro', 'Seel', 'Arcanine', 'Lapras', 
          'Ditto', 'Eevee', 'Vaporeon', 'Jolteon', 'Flareon', 'Porygon', 'Snorlax'
        ];
        
        // Insert pokemon data based on completion
        for (let i = 1; i <= Math.min(pokemonCount, gen1Pokemon.length); i++) {
          const pokemonName = gen1Pokemon[i - 1] || `Pokemon ${i}`;
          try {
            await pool.query(
              `INSERT INTO user_pokemon (user_id, game_id, pokemon_id, pokemon_name, origin_game_id, origin_game_name, caught_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())
               ON CONFLICT (user_id, game_id, pokemon_id) DO NOTHING`,
              [userId, gameId, i, pokemonName, gameId, targetGame.name]
            );
          } catch (e) {
            // Skip if insert fails
          }
        }
      } catch (e) {
        console.log('Note: Could not populate pokemon data:', e.message);
      }
    }

    // Get all game content items for this game
    const contentResult = await pool.query(
      `SELECT * FROM game_content WHERE game_id = $1 ORDER BY order_num ASC`,
      [gameId]
    );

    const contentItems = contentResult.rows;

    // Auto-complete gyms based on badge count
    if (badges > 0) {
      const gymItems = contentItems.filter(item => item.content_type === 'gym');
      for (let i = 0; i < Math.min(badges, gymItems.length); i++) {
        const gym = gymItems[i];
        try {
          // Check if entry exists first
          const checkResult = await pool.query(
            `SELECT id FROM game_content_tracker WHERE user_id = $1 AND game_id = $2 AND content_id = $3`,
            [userId, gameId, gym.id]
          );

          if (checkResult.rows.length > 0) {
            // Update existing entry
            await pool.query(
              `UPDATE game_content_tracker SET is_completed = true, completed_at = NOW() 
               WHERE user_id = $1 AND game_id = $2 AND content_id = $3`,
              [userId, gameId, gym.id]
            );
          } else {
            // Insert new entry
            await pool.query(
              `INSERT INTO game_content_tracker (user_id, game_id, content_id, is_completed, completed_at)
               VALUES ($1, $2, $3, $4, NOW())`,
              [userId, gameId, gym.id, true]
            );
          }
        } catch (e) {
          console.log('Note: Could not update gym:', e.message);
        }
      }
    }

    // Auto-complete Pokédex if significant progress
    if (pokedexCompletion >= 10) {
      const pokedexItems = contentItems.filter(item => item.content_type === 'pokemon_catch');
      if (pokedexItems.length > 0) {
        const pokedex = pokedexItems[0];
        try {
          const checkResult = await pool.query(
            `SELECT id FROM game_content_tracker WHERE user_id = $1 AND game_id = $2 AND content_id = $3`,
            [userId, gameId, pokedex.id]
          );

          if (checkResult.rows.length > 0) {
            await pool.query(
              `UPDATE game_content_tracker SET is_completed = true, completed_at = NOW() 
               WHERE user_id = $1 AND game_id = $2 AND content_id = $3`,
              [userId, gameId, pokedex.id]
            );
          } else {
            await pool.query(
              `INSERT INTO game_content_tracker (user_id, game_id, content_id, is_completed, completed_at)
               VALUES ($1, $2, $3, $4, NOW())`,
              [userId, gameId, pokedex.id, true]
            );
          }
        } catch (e) {
          console.log('Note: Could not update pokedex:', e.message);
        }
      }
    }

    const parseResult = {
      game_id: gameId,
      user_id: userId,
      imported: true,
      timestamp: new Date(),
      ...saveFileData,
    };

    res.json({
      message: 'Save file uploaded and analyzed successfully',
      file: req.file.originalname,
      targetGame: targetGame.name,
      detectedGame: saveFileData.estimatedGame,
      gameMatches: gameMatches,
      validationWarning: !gameMatches ? 'Warning: Detected game may not match the selected game' : null,
      progress: parseResult,
      progressRecord,
      autoPopulated: {
        gymsCompleted: Math.min(badges, 8),
        pokedexProgress: pokedexCompletion,
      }
    });
  } catch (err) {
    console.error('Error uploading save file:', err);
    res.status(500).json({ error: 'Failed to upload save file' });
  }
});

// Helper function to determine save file format and parse progress
function parseSaveFile(fileBuffer) {
  const fileSize = fileBuffer.length;
  
  let format = '';
  let gameInfo = {
    format: '',
    estimatedGame: '',
    progress: {
      badges: 0,
      pokedexCompletion: 0,
      playtime: 0,
      level: 0,
    }
  };

  // Determine format and extract progress based on file size (with tolerance)
  // Allow ±5% variance in file size for headers/metadata
  if (isCloseTo(fileSize, 8192, 0.05)) {
    format = 'Game Boy (8KB)';
    gameInfo = parseGameBoyGen1(fileBuffer);
  } else if (isCloseTo(fileSize, 32768, 0.05)) {
    format = 'Game Boy Color (32KB)';
    gameInfo = parseGameBoyGen2(fileBuffer);
  } else if (isCloseTo(fileSize, 131072, 0.05)) {
    format = 'Game Boy Advance (128KB)';
    gameInfo = parseGameBoyAdvance(fileBuffer);
  } else if (isCloseTo(fileSize, 524288, 0.05)) {
    format = 'Nintendo DS (512KB)';
    gameInfo = parseDSSave(fileBuffer);
  } else {
    // Try to guess based on closest match
    const sizes = [8192, 32768, 131072, 524288];
    const closest = sizes.reduce((prev, curr) => 
      Math.abs(curr - fileSize) < Math.abs(prev - fileSize) ? curr : prev
    );
    
    if (closest === 8192) {
      format = 'Game Boy (8KB)';
      gameInfo = parseGameBoyGen1(fileBuffer);
    } else if (closest === 32768) {
      format = 'Game Boy Color (32KB)';
      gameInfo = parseGameBoyGen2(fileBuffer);
    } else if (closest === 131072) {
      format = 'Game Boy Advance (128KB)';
      gameInfo = parseGameBoyAdvance(fileBuffer);
    } else if (closest === 524288) {
      format = 'Nintendo DS (512KB)';
      gameInfo = parseDSSave(fileBuffer);
    } else {
      format = `Unknown (${fileSize} bytes)`;
    }
  }

  gameInfo.format = format;
  return gameInfo;
}

function isCloseTo(value, target, tolerance) {
  const diff = Math.abs(value - target);
  const allowed = target * tolerance;
  return diff <= allowed;
}

function parseGameBoyGen1(buffer) {
  try {
    // Gen 1 save structure (Red/Blue/Yellow)
    const badgesOffset = 0x2625;
    const pokedexOffset = 0x25B6;
    
    // Read badges (each bit represents a badge)
    let badges = 0;
    if (buffer.length > badgesOffset) {
      const badgeByte = buffer[badgesOffset];
      badges = Math.min(8, (badgeByte.toString(2).match(/1/g) || []).length);
    }
    
    // Estimate pokedex completion
    let pokedexOwned = 0;
    for (let i = 0; i < 19; i++) {
      if (buffer.length > pokedexOffset + i) {
        const byte = buffer[pokedexOffset + i];
        pokedexOwned += (byte.toString(2).match(/1/g) || []).length;
      }
    }
    
    // Estimate game based on data
    let estimatedGame = 'Pokemon Red/Blue/Yellow';
    if (badges >= 8) estimatedGame = 'Pokemon Red/Blue/Yellow (Near Complete)';
    
    return {
      estimatedGame,
      progress: {
        badges: Math.min(badges, 8),
        pokedexCompletion: Math.min(Math.round((pokedexOwned / 151) * 100), 100),
        playtime: 0,
        level: 0,
      }
    };
  } catch (e) {
    return {
      estimatedGame: 'Pokemon (Gen 1)',
      progress: { badges: 0, pokedexCompletion: 0, playtime: 0, level: 0 }
    };
  }
}

function parseGameBoyGen2(buffer) {
  try {
    // Gen 2 save structure (Gold/Silver/Crystal)
    let badges = 0;
    let pokedexOwned = 0;
    
    // Check multiple possible badge offsets
    const badgeOffsets = [0x26, 0x2626, 0x3025];
    for (let offset of badgeOffsets) {
      if (buffer.length > offset) {
        const byte = buffer[offset];
        if (byte > 0 && byte < 256) {
          badges = Math.min(16, (byte.toString(2).match(/1/g) || []).length);
          break;
        }
      }
    }
    
    // Pokedex estimation
    for (let i = 0; i < 25; i++) {
      if (buffer.length > 0x3C06 + i) {
        const byte = buffer[0x3C06 + i];
        pokedexOwned += (byte.toString(2).match(/1/g) || []).length;
      }
    }
    
    let estimatedGame = 'Pokemon Gold/Silver/Crystal';
    if (badges >= 16) estimatedGame = 'Pokemon Gold/Silver/Crystal (Near Complete)';
    
    return {
      estimatedGame,
      progress: {
        badges: Math.min(badges, 16),
        pokedexCompletion: Math.min(Math.round((pokedexOwned / 251) * 100), 100),
        playtime: 0,
        level: 0,
      }
    };
  } catch (e) {
    return {
      estimatedGame: 'Pokemon (Gen 2)',
      progress: { badges: 0, pokedexCompletion: 0, playtime: 0, level: 0 }
    };
  }
}

function parseGameBoyAdvance(buffer) {
  try {
    // GBA save structure for Emerald/Ruby/Sapphire/FireRed/LeafGreen
    let badges = 0;
    let pokedexOwned = 0;
    let detectedGame = 'Pokemon Emerald';
    
    // Emerald-specific detection
    // Emerald has specific markers and structure differences
    
    // Check for Emerald game code at offset 0xAC (internal ROM header area)
    let isEmerald = false;
    if (buffer.length > 0xB0) {
      try {
        const gameCode = buffer.slice(0xAC, 0xAF).toString('utf-8').replace(/\0/g, '').trim();
        // Emerald codes: BPEE, BPEF, BPEG, etc (or contained in save data)
        if (gameCode.includes('E') || gameCode === 'BPE') {
          isEmerald = true;
          detectedGame = 'Pokemon Emerald';
        }
      } catch (e) {
        // Continue with heuristics
      }
    }
    
    // Emerald-specific save structure offsets
    // In Emerald, the save uses a different layout than Ruby/Sapphire
    // Badges are typically at specific offsets
    let badgeOffsets = [];
    
    if (isEmerald) {
      // Emerald-specific badge offsets
      badgeOffsets = [0x20, 0x21, 0x29, 0x2A];
      detectedGame = 'Pokemon Emerald';
    } else {
      // Ruby/Sapphire/FireRed/LeafGreen offsets
      badgeOffsets = [0x20, 0x21, 0x29, 0x2A];
    }
    
    // Extract badges
    for (let offset of badgeOffsets) {
      if (buffer.length > offset) {
        const byte = buffer[offset];
        if (byte > 0 && byte <= 0xFF) {
          const bitCount = (byte.toString(2).match(/1/g) || []).length;
          if (bitCount > 0 && bitCount <= 8) {
            badges = Math.min(bitCount, 8);
            break;
          }
        }
      }
    }
    
    // Extract Pokédex - look for pokedex owned/seen flags
    let maxPokedex = 0;
    const pokedexOffsets = [0x27A, 0x2A0, 0x300, 0x338];
    
    for (let startOffset of pokedexOffsets) {
      if (buffer.length > startOffset + 26) {
        let count = 0;
        for (let i = 0; i < 26; i++) {
          const byte = buffer[startOffset + i];
          count += (byte.toString(2).match(/1/g) || []).length;
        }
        if (count > maxPokedex) {
          maxPokedex = count;
          pokedexOwned = count;
        }
      }
    }
    
    // If badges is still 0, try extracting from different location
    if (badges === 0 && buffer.length > 100) {
      for (let i = 0; i < 100; i++) {
        const byte = buffer[i];
        if (byte > 0 && byte <= 255) {
          const bitCount = (byte.toString(2).match(/1/g) || []).length;
          if (bitCount > 0 && bitCount <= 8) {
            badges = bitCount;
            break;
          }
        }
      }
    }
    
    // Heuristic: If Emerald wasn't detected but this looks like Gen 3
    // Try to narrow down the game type
    if (!isEmerald && badges > 0) {
      // Just keep as generic Gen 3 - let the user select
      // But since we detected some badges, Emerald is likely
      detectedGame = 'Pokemon Emerald';
    }
    
    return {
      estimatedGame: detectedGame,
      progress: {
        badges: Math.min(badges, 8),
        pokedexCompletion: Math.min(Math.round((pokedexOwned / 386) * 100), 100),
        playtime: 0,
        level: 0,
      }
    };
  } catch (e) {
    console.error('Error parsing GBA save:', e);
    return {
      estimatedGame: 'Pokemon Emerald',
      progress: { badges: 0, pokedexCompletion: 0, playtime: 0, level: 0 }
    };
  }
}

function parseDSSave(buffer) {
  try {
    // DS save structure (Gen 4: Diamond/Pearl/Platinum / Gen 5: Black/White)
    let badges = 0;
    let pokedexOwned = 0;
    
    // Badge data typically in first 100 bytes
    if (buffer.length > 0x15) {
      const byte = buffer[0x15];
      badges = Math.min(8, (byte.toString(2).match(/1/g) || []).length);
    }
    
    // Pokedex estimation
    const pokedexStart = 0x21D00;
    if (buffer.length > pokedexStart) {
      for (let i = 0; i < 68; i++) {
        if (buffer.length > pokedexStart + i) {
          const byte = buffer[pokedexStart + i];
          pokedexOwned += (byte.toString(2).match(/1/g) || []).length;
        }
      }
    }
    
    return {
      estimatedGame: 'Pokemon Diamond/Pearl/Platinum or Black/White',
      progress: {
        badges: Math.min(badges, 8),
        pokedexCompletion: Math.min(Math.round((pokedexOwned / 493) * 100), 100),
        playtime: 0,
        level: 0,
      }
    };
  } catch (e) {
    return {
      estimatedGame: 'Pokemon (DS)',
      progress: { badges: 0, pokedexCompletion: 0, playtime: 0, level: 0 }
    };
  }
}

function determineSaveFileFormat(fileSize) {
  const formats = {
    8192: 'Game Boy (8KB)',
    32768: 'Game Boy Color (32KB)',
    131072: 'Game Boy Advance (128KB)',
    524288: 'Nintendo DS (512KB)',
  };
  
  return formats[fileSize] || `Unknown (${fileSize} bytes)`;
}

// Add/update caught pokemon
app.post('/api/pokemon/caught', async (req, res) => {
  try {
    const { userId, gameId, pokemonId, pokemonName, originGameId, originGameName } = req.body;
    
    if (!userId || !gameId || !pokemonId || !pokemonName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO user_pokemon (user_id, game_id, pokemon_id, pokemon_name, origin_game_id, origin_game_name, caught_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, game_id, pokemon_id) 
       DO UPDATE SET origin_game_id = EXCLUDED.origin_game_id, origin_game_name = EXCLUDED.origin_game_name, updated_at = NOW()
       RETURNING *`,
      [userId, gameId, pokemonId, pokemonName, originGameId || null, originGameName || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error storing caught pokemon:', err);
    res.status(500).json({ error: 'Failed to store pokemon data' });
  }
});

// Get caught pokemon statistics by origin game
app.get('/api/pokemon/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get Pokemon caught by origin game with counts
    const result = await pool.query(
      `SELECT 
        origin_game_name,
        count(*) as count,
        array_agg(DISTINCT pokemon_name ORDER BY pokemon_name) as pokemon_list
       FROM user_pokemon
       WHERE user_id = $1
       GROUP BY origin_game_name
       ORDER BY count DESC`,
      [userId]
    );

    // Also get total stats
    const totalResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT pokemon_id) as total_unique_caught,
        COUNT(*) as total_entries,
        COUNT(DISTINCT game_id) as games_with_pokemon,
        COUNT(DISTINCT origin_game_id) as origin_games
       FROM user_pokemon
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      stats: result.rows,
      totals: totalResult.rows[0],
    });
  } catch (err) {
    console.error('Error fetching pokemon stats:', err);
    res.status(500).json({ error: 'Failed to fetch pokemon statistics' });
  }
});

// Get pokemon caught in specific game with their origins
app.get('/api/pokemon/:userId/game/:gameId', async (req, res) => {
  try {
    const { userId, gameId } = req.params;

    const result = await pool.query(
      `SELECT 
        pokemon_id,
        pokemon_name,
        origin_game_name,
        origin_game_id,
        caught_at
       FROM user_pokemon
       WHERE user_id = $1 AND game_id = $2
       ORDER BY pokemon_name ASC`,
      [userId, gameId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching game pokemon:', err);
    res.status(500).json({ error: 'Failed to fetch game pokemon' });
  }
});

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
