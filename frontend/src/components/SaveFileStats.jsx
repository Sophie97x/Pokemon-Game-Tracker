import React, { useState } from 'react';
import axios from 'axios';

const SaveFileStats = ({ gameId, gameName, userId, apiUrl, onImportSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    hoursPlayed: 0,
    pokemonCaught: 0,
    pokedexSeen: 0,
    badges: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setStats(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Calculate pokedex completion percentage based on caught Pokemon
      // For Gen 1: 151, Gen 2: 251, Gen 3: 386, Gen 4: 493
      let maxPokedex = 151;
      const gameNameLower = gameName.toLowerCase();
      if (gameNameLower.includes('gold') || gameNameLower.includes('silver') || gameNameLower.includes('crystal')) {
        maxPokedex = 251;
      } else if (gameNameLower.includes('emerald') || gameNameLower.includes('ruby') || gameNameLower.includes('sapphire') ||
                 gameNameLower.includes('fire') || gameNameLower.includes('leaf')) {
        maxPokedex = 386;
      } else if (gameNameLower.includes('diamond') || gameNameLower.includes('pearl') || gameNameLower.includes('platinum') ||
                 gameNameLower.includes('heartgold') || gameNameLower.includes('soulsilver')) {
        maxPokedex = 493;
      }

      const pokedexCompletion = Math.min(Math.round((stats.pokemonCaught / maxPokedex) * 100), 100);

      // Update progress record with manual stats
      await axios.post(`${apiUrl}/api/progress/${userId}/${gameId}/manual-stats`, {
        hoursPlayed: stats.hoursPlayed,
        pokemonCaught: stats.pokemonCaught,
        pokedexCompletion: pokedexCompletion,
        badges: stats.badges,
      });

      // Delete existing Pokemon entries for this game
      await axios.delete(`${apiUrl}/api/pokemon/${userId}/game/${gameId}`);

      // Generate and insert Pokemon based on the caught count
      const pokemonNames = [
        'Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon', 'Charizard',
        'Squirtle', 'Wartortle', 'Blastoise', 'Caterpie', 'Metapod', 'Butterfree',
        'Weedle', 'Kakuna', 'Beedrill', 'Pidgeot', 'Pikachu', 'Raichu', 'Jigglypuff',
        'Wigglytuff', 'Zubat', 'Golbat', 'Oddish', 'Gloom', 'Vileplume', 'Paras',
        'Parasect', 'Venonat', 'Venomoth', 'Diglett', 'Dugtrio', 'Meowth', 'Persian',
        'Psyduck', 'Golduck', 'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Poliwag',
        'Poliwrath', 'Abra', 'Alakazam', 'Machop', 'Machamp', 'Bellsprout', 'Weepinbell',
        'Victreebel', 'Tentacool', 'Tentacruel', 'Slowpoke', 'Slowbro', 'Seel', 'Dewgong',
        'Shellder', 'Cloyster', 'Gastly', 'Haunter', 'Gengar', 'Onix', 'Drowzee', 'Hypno'
      ];

      for (let i = 1; i <= Math.min(stats.pokemonCaught, pokemonNames.length); i++) {
        await axios.post(`${apiUrl}/api/pokemon/caught`, {
          userId,
          gameId,
          pokemonId: i,
          pokemonName: pokemonNames[i - 1],
          originGameId: gameId,
          originGameName: gameName,
        });
      }

      setShowForm(false);
      setStats({ hoursPlayed: 0, pokemonCaught: 0, pokedexSeen: 0, badges: 0 });
      onImportSuccess();
    } catch (err) {
      console.error('Error saving stats:', err);
      setError(err.response?.data?.error || 'Failed to save game stats');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          marginTop: '10px',
          padding: '10px 15px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        📊 Enter Save Stats (Like PKHeX)
      </button>
    );
  }

  return (
    <div style={{
      marginTop: '15px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '2px solid #667eea',
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px' }}>📊 Save File Stats ({gameName})</h3>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
        Enter the stats shown in PKHeX or your emulator for this save file
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>
              ⏱️ Hours Played:
            </label>
            <input
              type="number"
              min="0"
              max="9999"
              value={stats.hoursPlayed}
              onChange={(e) => handleInputChange('hoursPlayed', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="e.g., 25"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>
              🎮 Pokemon Caught:
            </label>
            <input
              type="number"
              min="0"
              max="999"
              value={stats.pokemonCaught}
              onChange={(e) => handleInputChange('pokemonCaught', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="e.g., 75"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>
              👁️ Pokemon Seen:
            </label>
            <input
              type="number"
              min="0"
              max="999"
              value={stats.pokedexSeen}
              onChange={(e) => handleInputChange('pokedexSeen', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="e.g., 100"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>
              🏅 Badges:
            </label>
            <input
              type="number"
              min="0"
              max="16"
              value={stats.badges}
              onChange={(e) => handleInputChange('badges', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="e.g., 4"
            />
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px',
              backgroundColor: '#51cf66',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '💾 Saving...' : '✅ Save Stats'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError(null);
            }}
            style={{
              padding: '10px',
              backgroundColor: '#aaa',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaveFileStats;
