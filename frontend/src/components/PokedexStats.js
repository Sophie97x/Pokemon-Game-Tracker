import React, { useState } from 'react';

const PokedexStats = ({ userId, apiUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPokedexStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/api/pokemon/stats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Pokédex statistics');
      }

      const data = await response.json();
      setStats(data.stats || []);
      setTotals(data.totals || {});
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStats = () => {
    setIsOpen(true);
    if (!stats) {
      fetchPokedexStats();
    }
  };

  return (
    <div>
      {/* Button to open stats */}
      <button
        onClick={handleOpenStats}
        style={{
          padding: '10px 20px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '20px',
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#5568d3'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
      >
        📊 View Pokédex Statistics
      </button>

      {/* Stats Modal/Popup */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>📊 Pokédex Statistics</h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', color: '#999' }}>Loading statistics...</p>
            ) : error ? (
              <p style={{ color: '#d32f2f' }}>Error: {error}</p>
            ) : (
              <>
                {/* Overall stats */}
                {totals && (
                  <div
                    style={{
                      backgroundColor: '#f0f7ff',
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      border: '2px solid #667eea',
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>Overall Statistics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                      <div>
                        <strong>Total Unique Pokémon:</strong> {totals.total_unique_caught || 0}
                      </div>
                      <div>
                        <strong>Total Entries:</strong> {totals.total_entries || 0}
                      </div>
                      <div>
                        <strong>Games with Pokémon:</strong> {totals.games_with_pokemon || 0}
                      </div>
                      <div>
                        <strong>Origin Games:</strong> {totals.origin_games || 0}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pokémon by origin game */}
                <h3>Pokémon by Origin Game</h3>
                {stats && stats.length > 0 ? (
                  <div>
                    {stats.map((stat, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#f9f9f9',
                          padding: '15px',
                          marginBottom: '15px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px',
                          }}
                        >
                          <h4 style={{ margin: '0 0 5px 0' }}>
                            {stat.origin_game_name || 'Unknown Origin'}
                          </h4>
                          <span
                            style={{
                              backgroundColor: '#667eea',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                            }}
                          >
                            {stat.count} Pokémon
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Pokémon:</strong>{' '}
                            {stat.pokemon_list && stat.pokemon_list.length > 0
                              ? stat.pokemon_list.join(', ')
                              : 'None'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>
                    No Pokémon statistics available yet. Upload a save file to get started!
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PokedexStats;
