import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Analytics = ({ userId, apiUrl }) => {
  const [analytics, setAnalytics] = useState({
    totalGames: 0,
    gamesStarted: 0,
    gamesCompleted: 0,
    gamesPaused: 0,
    completionPercentage: 0,
    estimatedHoursSpent: 0,
    estimatedHoursRemaining: 0,
    contentCompletionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userId, apiUrl]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all games
      const gamesRes = await axios.get(`${apiUrl}/api/games`);
      const games = gamesRes.data;

      // Fetch user progress
      const progressRes = await axios.get(`${apiUrl}/api/progress/user/${userId}`);
      const progress = progressRes.data;

      // Calculate analytics
      const totalGames = games.length;
      const gamesStarted = progress.filter((p) => p.status !== 'not_started').length;
      const gamesCompleted = progress.filter((p) => p.status === 'completed').length;
      const gamesPaused = progress.filter((p) => p.status === 'paused').length;
      const completionPercentage = totalGames > 0 ? (gamesCompleted / totalGames) * 100 : 0;

      // Calculate time estimates
      let estimatedHoursSpent = 0;
      let estimatedHoursRemaining = 0;

      progress.forEach((p) => {
        const game = games.find((g) => g.id === p.game_id);
        if (game) {
          if (p.status === 'completed') {
            estimatedHoursSpent += game.completion_time_hours;
          } else if (p.status === 'in_progress') {
            estimatedHoursSpent += Math.floor(game.completion_time_hours * 0.5); // Assume 50% done
            estimatedHoursRemaining += Math.ceil(game.completion_time_hours * 0.5);
          }
        }
      });

      // Games not started yet
      const gamesNotStarted = totalGames - gamesStarted;
      estimatedHoursRemaining += games.reduce((total, game) => {
        if (!progress.find((p) => p.game_id === game.id)) {
          return total + game.completion_time_hours;
        }
        return total;
      }, 0);

      setAnalytics({
        totalGames,
        gamesStarted,
        gamesCompleted,
        gamesPaused,
        gamesNotStarted,
        completionPercentage: parseFloat(completionPercentage.toFixed(1)),
        estimatedHoursSpent,
        estimatedHoursRemaining,
      });
      setLoading(false);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading analytics...</div>;
  }

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      <h2 style={{ marginBottom: '20px' }}>📊 Progress Analytics</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
      }}>
        {/* Stat Card - Total Games */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{analytics.totalGames}</div>
          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Total Games</div>
        </div>

        {/* Stat Card - Games Completed */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{analytics.gamesCompleted}</div>
          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Completed</div>
        </div>

        {/* Stat Card - Games In Progress */}
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{analytics.gamesStarted}</div>
          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Started</div>
        </div>

        {/* Stat Card - Completion Rate */}
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{analytics.completionPercentage}%</div>
          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Completion Rate</div>
        </div>
      </div>

      {/* Hours Analytics */}
      <div style={{
        background: '#f9f9f9',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '15px',
      }}>
        <h3 style={{ marginBottom: '15px', fontSize: '1.1em' }}>⏱️ Time Analytics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Hours Spent</div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#667eea' }}>
              {analytics.estimatedHoursSpent}h
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Hours Remaining</div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#f5576c' }}>
              {analytics.estimatedHoursRemaining}h
            </div>
          </div>
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#999' }}>
          Total series playtime: {analytics.estimatedHoursSpent + analytics.estimatedHoursRemaining}h
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{
        background: '#f9f9f9',
        padding: '15px',
        borderRadius: '8px',
      }}>
        <h3 style={{ marginBottom: '15px', fontSize: '1.1em' }}>📈 Status Breakdown</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          fontSize: '0.9em',
        }}>
          <div style={{ padding: '10px', background: '#fff', borderRadius: '5px', borderLeft: '4px solid #667eea' }}>
            <div style={{ fontWeight: 'bold' }}>{analytics.gamesNotStarted}</div>
            <div style={{ color: '#666' }}>Not Started</div>
          </div>
          <div style={{ padding: '10px', background: '#fff', borderRadius: '5px', borderLeft: '4px solid #4facfe' }}>
            <div style={{ fontWeight: 'bold' }}>{analytics.gamesStarted - analytics.gamesCompleted}</div>
            <div style={{ color: '#666' }}>In Progress</div>
          </div>
          <div style={{ padding: '10px', background: '#fff', borderRadius: '5px', borderLeft: '4px solid #43e97b' }}>
            <div style={{ fontWeight: 'bold' }}>{analytics.gamesCompleted}</div>
            <div style={{ color: '#666' }}>Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
