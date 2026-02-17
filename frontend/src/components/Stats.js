import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Stats = ({ userId, apiUrl }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/stats/${userId}`);
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'white' }}>Loading stats...</div>;
  }

  if (error || !stats) {
    return <div style={{ color: 'white' }}>No statistics available yet</div>;
  }

  const completionRate = stats.total_games > 0 
    ? Math.round((stats.completed_games / stats.total_games) * 100)
    : 0;

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>📊 Your Statistics</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
      }}>
        <StatCard
          title="Total Games"
          value={stats.total_games || 0}
          icon="🎮"
          color="#667eea"
        />
        
        <StatCard
          title="Completed"
          value={stats.completed_games || 0}
          icon="✅"
          color="#51cf66"
        />
        
        <StatCard
          title="In Progress"
          value={stats.in_progress_games || 0}
          icon="▶️"
          color="#ffa94d"
        />
        
        <StatCard
          title="Paused"
          value={stats.paused_games || 0}
          icon="⏸️"
          color="#ff8c94"
        />
        
        <StatCard
          title="Not Started"
          value={stats.not_started_games || 0}
          icon="🔒"
          color="#999"
        />
        
        <StatCard
          title="Hours Completed"
          value={stats.total_hours_completed || 0}
          icon="⏱️"
          color="#a78bfa"
        />
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
      }}>
        <h3 style={{ marginBottom: '10px', color: '#333' }}>Overall Progress</h3>
        <div style={{ height: '30px', backgroundColor: '#e0e0e0', borderRadius: '15px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${completionRate}%`,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9em',
              transition: 'width 0.3s ease',
            }}
          >
            {completionRate > 10 && `${completionRate}%`}
          </div>
        </div>
        <p style={{ fontSize: '0.85em', color: '#666', marginTop: '8px' }}>
          {stats.completed_games} of {stats.total_games} games completed
        </p>
      </div>

      {stats.total_hours_completed > 0 && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          color: '#2e7d32',
        }}>
          🎯 You've spent {stats.total_hours_completed} hours completing Pokémon games!
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#f9f9f9',
      border: `2px solid ${color}20`,
      borderRadius: '8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '2em', marginBottom: '8px' }}>{icon}</div>
      <div style={{
        fontSize: '1.5em',
        fontWeight: 'bold',
        color: color,
        marginBottom: '5px',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.85em',
        color: '#666',
      }}>
        {title}
      </div>
    </div>
  );
};

export default Stats;
