import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PokedexTracker = ({ gameId, userId, apiUrl }) => {
  const [pokedexData, setPokedexData] = useState({
    caught: 0,
    total: 0,
    completionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  const GENERATION_POKEMON_COUNTS = {
    1: 151, // Gen 1: Red/Blue/Yellow
    2: 251, // Gen 2: Gold/Silver/Crystal (includes Gen 1)
    3: 386, // Gen 3: Ruby/Sapphire/Emerald
    4: 493, // Gen 4: Diamond/Pearl/Platinum
    5: 649, // Gen 5: Black/White
    6: 721, // Gen 6: X/Y
    7: 802, // Gen 7: Sun/Moon
    8: 898, // Gen 8: Sword/Shield
    9: 1025, // Gen 9: Scarlet/Violet
  };

  useEffect(() => {
    if (gameId) {
      loadPokedexData();
    }
  }, [gameId, userId, apiUrl]);

  const loadPokedexData = async () => {
    try {
      setLoading(true);

      // Fetch game details to get generation
      const gameRes = await axios.get(`${apiUrl}/api/games/${gameId}`);
      const game = gameRes.data;

      // Fetch progress for this game
      const progressRes = await axios.get(`${apiUrl}/api/progress/${userId}/game/${gameId}`);
      const progress = progressRes.data;

      // Calculate Pokédex completion
      const pokemonCaught =
        progress
          .filter((item) => item.content_type === 'pokemon_catch')
          .reduce((count) => count + 1, 0) || 0;

      const totalPokemon = GENERATION_POKEMON_COUNTS[game.generation] || 151;
      const completionPercentage = (pokemonCaught / totalPokemon) * 100;

      setPokedexData({
        caught: pokemonCaught,
        total: totalPokemon,
        completionPercentage: parseFloat(completionPercentage.toFixed(1)),
        generationName: `Gen ${game.generation}`,
      });
      setLoading(false);
    } catch (err) {
      console.error('Error loading Pokédex data:', err);
      // Set default values if error
      setPokedexData({
        caught: 0,
        total: 151,
        completionPercentage: 0,
      });
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '10px', fontSize: '0.9em' }}>Loading Pokédex...</div>;
  }

  const progressColor =
    pokedexData.completionPercentage >= 100
      ? '#43e97b'
      : pokedexData.completionPercentage >= 50
        ? '#4facfe'
        : '#f5576c';

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>
        📖 Pokédex: {pokedexData.caught}/{pokedexData.total} ({pokedexData.completionPercentage}%)
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          background: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pokedexData.completionPercentage}%`,
            height: '100%',
            background: progressColor,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

export default PokedexTracker;
