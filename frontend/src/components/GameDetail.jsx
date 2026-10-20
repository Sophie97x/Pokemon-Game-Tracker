import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SaveFileImporter from './SaveFileImporter';
import SaveFileStats from './SaveFileStats';
import PokedexTracker from './PokedexTracker';

const GameDetail = ({ game, progress, userId, onBack, onProgressUpdate, apiUrl, onImportSuccess, refreshCounter }) => {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentProgress, setContentProgress] = useState({});
  const [showSaveImport, setShowSaveImport] = useState(false);

  useEffect(() => {
    fetchContentItems();
    loadContentProgress();
  }, [game.id, refreshCounter]);

  const fetchContentItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/games/${game.id}/content`);
      setContentItems(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching content:', err);
      setLoading(false);
    }
  };

  const loadContentProgress = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/progress/${userId}/game/${game.id}`
      );
      const progressMap = {};
      response.data.forEach((item) => {
        progressMap[item.content_id] = item;
      });
      setContentProgress(progressMap);
    } catch (err) {
      console.log('No content progress found');
    }
  };

  const handleContentToggle = async (contentItem) => {
    try {
      const isCompleted = contentProgress[contentItem.id]?.is_completed || false;
      
      // Update in database
      await axios.put(`${apiUrl}/api/content/${contentItem.id}`, {
        is_completed: !isCompleted,
      });

      // Update local state
      const updated = { ...contentProgress };
      updated[contentItem.id] = {
        content_id: contentItem.id,
        is_completed: !isCompleted,
      };
      setContentProgress(updated);
    } catch (err) {
      console.error('Error updating content:', err);
    }
  };

  const currentStatus = progress?.status || 'not_started';
  const completedCount = Object.values(contentProgress).filter(
    (item) => item.is_completed
  ).length;

  return (
    <div className="game-detail">
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '20px' }}>
        ← Back to Games
      </button>

      <h2>{game.name}</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <p><strong>Generation:</strong> {game.generation}</p>
            <p><strong>Release Year:</strong> {game.release_year}</p>
            <p><strong>Platform:</strong> {game.platform}</p>
          </div>
          <div>
            <p><strong>Estimated Time:</strong> {game.completion_time_hours} hours</p>
            <p><strong>Current Status:</strong> <span style={{ color: 'green' }}>{currentStatus}</span></p>
            <p><strong>Save File Format:</strong> {game.save_file_format}</p>
          </div>
        </div>
      </div>

      {game.description && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h3>About This Game</h3>
          <p>{game.description}</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Game Progress Tracking</h3>
        <div className="progress-bar" style={{ height: '30px' }}>
          <div
            className="progress-fill"
            style={{ width: `${completedCount > 0 && contentItems.length > 0 ? (completedCount / contentItems.length) * 100 : 0}%` }}
          ></div>
        </div>
        <p>{completedCount} of {contentItems.length} items completed</p>
        
        <PokedexTracker gameId={game.id} userId={userId} apiUrl={apiUrl} refreshTrigger={refreshCounter} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Import Save File</h3>
        <button
          className="btn btn-secondary"
          onClick={() => setShowSaveImport(!showSaveImport)}
        >
          {showSaveImport ? '✕ Close' : '+ Import Save File'}
        </button>

        {showSaveImport && (
          <div style={{ marginTop: '15px' }}>
            <SaveFileImporter
              gameId={game.id}
              userId={userId}
              apiUrl={apiUrl}
              onImportSuccess={(result) => {
                console.log('Save file imported:', result);
                // Refresh content progress after import
                loadContentProgress();
                // notify parent to refresh global progress/stats
                onImportSuccess && onImportSuccess(result);
              }}
            />
            <SaveFileStats
              gameId={game.id}
              gameName={game.name}
              userId={userId}
              apiUrl={apiUrl}
              onImportSuccess={() => {
                setShowSaveImport(false);
                loadContentProgress();
                onImportSuccess && onImportSuccess();
              }}
            />
          </div>
        )}
      </div>

      <div>
        <h3>Gyms & Milestones</h3>
        {contentItems.length === 0 ? (
          <p>No content items for this game</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {contentItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: contentProgress[item.id]?.is_completed ? '#e8f5e9' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onClick={() => handleContentToggle(item)}
              >
                <input
                  type="checkbox"
                  checked={contentProgress[item.id]?.is_completed || false}
                  onChange={() => {}}
                  style={{ marginRight: '10px' }}
                />
                <span style={{
                  textDecoration: contentProgress[item.id]?.is_completed ? 'line-through' : 'none',
                  color: contentProgress[item.id]?.is_completed ? '#999' : '#333',
                }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn btn-primary" style={{ marginTop: '20px' }}>
        Save Progress
      </button>
    </div>
  );
};

export default GameDetail;
