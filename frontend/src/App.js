import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import GameList from './components/GameList';
import GameDetail from './components/GameDetail';
import Stats from './components/Stats';
import BulkSaveFileImporter from './components/BulkSaveFileImporter';

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId] = useState('user_' + Date.now()); // Simple user ID generation
  const [userProgress, setUserProgress] = useState({});

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchGames();
    loadUserProgress();
  }, []);

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
    <div>
      <div className="container">
        <div className="header">
          <h1>🎮 Pokémon Game Tracker</h1>
          <p>Track your progress through all Pokémon games</p>
          {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        </div>

        {!selectedGame && (
          <>
            <BulkSaveFileImporter
              games={games}
              userId={userId}
              apiUrl={API_URL}
              onImportSuccess={handleImportSuccess}
            />
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
