import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import GameList from './components/GameList';
import GameDetail from './components/GameDetail';
import Stats from './components/Stats';
import Analytics from './components/Analytics';
import BulkSaveFileImporter from './components/BulkSaveFileImporter';
import PokedexStats from './components/PokedexStats';

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId] = useState('user_' + Date.now()); // Simple user ID generation
  const [userProgress, setUserProgress] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('pokemonTrackerDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchGames();
    loadUserProgress();
  }, []);

  // Apply dark mode to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('pokemonTrackerDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Set up global drag and drop
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      if (e.target === document) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith('.sav') || f.name.toLowerCase().endsWith('.3ds')
      );

      if (files.length > 0 && !selectedGame) {
        // Trigger bulk import for dropped files
        console.log('Files detected via drag-drop:', files.map((f) => f.name));
        // The BulkSaveFileImporter will pick these up
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [selectedGame]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/games`);
      setGames(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/progress/user/${userId}`);
      const progressMap = {};
      response.data.forEach((p) => {
        progressMap[p.game_id] = p;
      });
      setUserProgress(progressMap);
    } catch (err) {
      console.log('No existing progress found');
    }
  };

  const handleImportSuccess = () => {
    // Refresh progress and stats after successful import
    loadUserProgress();
  };

  const handleClearAllProgress = async () => {
    if (!window.confirm('Are you sure? This will delete ALL progress data (this cannot be undone).')) {
      return;
    }
    
    if (!window.confirm('This is your last chance to cancel! Really delete everything?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/progress/user/${userId}/all`);
      setUserProgress({});
      loadUserProgress();
      alert('All progress data cleared!');
    } catch (err) {
      console.error('Error clearing progress:', err);
      alert('Failed to clear progress');
    }
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
  };

  const handleProgressUpdate = (gameId, newStatus) => {
    const updatedProgress = { ...userProgress };
    updatedProgress[gameId] = {
      ...updatedProgress[gameId],
      game_id: gameId,
      status: newStatus,
    };
    setUserProgress(updatedProgress);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <h1>Pokémon Tracker</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            border: '3px dashed #4CAF50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px 50px',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            📁 Drop save files to import
          </div>
        </div>
      )}
      <div className="container">
        <div className="header">
          <h1>🎮 Pokémon Game Tracker</h1>
          <p>Track your progress through all Pokémon games</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-danger" 
              onClick={handleToggleDarkMode}
              style={{ backgroundColor: darkMode ? '#667eea' : '#f39c12', flex: 1, minWidth: '150px' }}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleClearAllProgress}
              style={{ backgroundColor: '#ff6b6b', flex: 1, minWidth: '150px' }}
            >
              🗑️ Clear All Progress
            </button>
          </div>
          {error && <p style={{ color: '#ff6b6b', marginTop: '10px' }}>{error}</p>}
        </div>

        {!selectedGame && (
          <>
            <BulkSaveFileImporter
              games={games}
              userId={userId}
              apiUrl={API_URL}
              onImportSuccess={handleImportSuccess}
            />
            <PokedexStats userId={userId} apiUrl={API_URL} />
            <Analytics userId={userId} apiUrl={API_URL} />
            <Stats userId={userId} apiUrl={API_URL} />
          </>
        )}

        {selectedGame ? (
          <GameDetail
            game={selectedGame}
            progress={userProgress[selectedGame.id]}
            userId={userId}
            onBack={() => setSelectedGame(null)}
            onProgressUpdate={handleProgressUpdate}
            apiUrl={API_URL}
          />
        ) : (
          <GameList
            games={games}
            userProgress={userProgress}
            onSelectGame={handleGameSelect}
            onProgressUpdate={handleProgressUpdate}
            userId={userId}
            apiUrl={API_URL}
          />
        )}
      </div>
    </div>
  );
}

export default App;
