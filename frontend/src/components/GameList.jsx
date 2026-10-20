import React from 'react';

const GameList = ({ games, userProgress, onSelectGame, onProgressUpdate, userId, apiUrl }) => {
  const getProgressPercentage = (gameId) => {
    const progress = userProgress[gameId];
    if (!progress) return 0;
    
    const statusMap = {
      'not_started': 0,
      'in_progress': 50,
      'completed': 100,
      'paused': 25,
    };
    
    return statusMap[progress.status] || 0;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'not_started': '#999',
      'in_progress': '#667eea',
      'completed': '#51cf66',
      'paused': '#ffa94d',
    };
    return colorMap[status] || '#999';
  };

  const handleStatusChange = async (game, newStatus) => {
    try {
      // Create or update progress record
      await fetch(`${apiUrl}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId: game.id,
          status: newStatus,
        }),
      });
      onProgressUpdate(game.id, newStatus);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  return (
    <div className="games-list">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>{{
          "all": `All Games (${games.length} total)`,
          "recommended": 'Recommended Order'
        }['all']}</h2>
      </div>

      <div className="games-grid">
        {games.map((game) => {
          const progress = userProgress[game.id];
          const percentage = getProgressPercentage(game.id);
          const currentStatus = progress?.status || 'not_started';

          return (
            <div
              key={game.id}
              className="game-card"
              onClick={() => onSelectGame(game)}
              style={{ cursor: 'pointer' }}
            >
              <h3 className="game-title">{game.name}</h3>
              
              <div className="game-info">
                <p><strong>Gen:</strong> Generation {game.generation}</p>
                <p><strong>Released:</strong> {game.release_year}</p>
                <p><strong>Platform:</strong> {game.platform}</p>
                <p><strong>Est. Time:</strong> {game.completion_time_hours} hours</p>
              </div>

              <div style={{ margin: '15px 0' }}>
                <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '8px' }}>
                  Status: <span style={{ color: getStatusColor(currentStatus), fontWeight: 'bold' }}>
                    {currentStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </p>
                
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div style={{ fontSize: '0.85em', color: '#999' }}>
                  {percentage}% Progress
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(game, 'in_progress');
                  }}
                  style={{
                    backgroundColor: currentStatus === 'in_progress' ? '#667eea' : undefined,
                    color: currentStatus === 'in_progress' ? 'white' : undefined,
                  }}
                >
                  Playing
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(game, 'completed');
                  }}
                  style={{
                    backgroundColor: currentStatus === 'completed' ? '#51cf66' : undefined,
                    color: currentStatus === 'completed' ? 'white' : undefined,
                  }}
                >
                  Done
                </button>
              </div>

              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectGame(game);
                }}
              >
                View Details
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameList;
