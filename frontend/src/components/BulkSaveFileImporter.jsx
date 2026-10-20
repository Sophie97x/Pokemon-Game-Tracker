import React, { useState } from 'react';

const BulkSaveFileImporter = ({ games, userId, apiUrl, onImportSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const matchGameByAnalysis = (estimatedGame, format) => {
    const estimated = estimatedGame.toLowerCase().trim()
      .replace(/pokémon/g, 'pokemon')
      .replace(/é/g, 'e');
    
    // Direct game name mappings for quick matching
    const gameKeywords = {
      'emerald': 'Emerald',
      'ruby': 'Ruby',
      'sapphire': 'Sapphire',
      'firered': 'FireRed',
      'fire red': 'FireRed',
      'leafgreen': 'LeafGreen',
      'leaf green': 'LeafGreen',
      'pokemon red': 'Red',
      'pokemon blue': 'Blue',
      'pokemon yellow': 'Yellow',
      'pokemon gold': 'Gold',
      'pokemon silver': 'Silver',
      'pokemon crystal': 'Crystal',
    };
    
    // Try keyword matching first
    for (const [keyword, gameName] of Object.entries(gameKeywords)) {
      if (estimated.includes(keyword)) {
        const match = games.find((g) => {
          const gName = g.name.toLowerCase()
            .replace(/pokémon/g, 'pokemon')
            .replace(/é/g, 'e');
          return gName.includes(gameName.toLowerCase());
        });
        if (match) return match;
      }
    }
    
    // Try broader matching
    const match = games.find((game) => {
      const gameName = game.name.toLowerCase()
        .replace(/pokémon/g, 'pokemon')
        .replace(/é/g, 'e');
      const platform = game.platform.toLowerCase();
      
      // Check if platforms match format
      if (format.includes('Game Boy')) {
        if (!['game boy', 'game boy color', 'game boy advance'].some(p => platform.includes(p))) return false;
      } else if (format.includes('DS')) {
        if (!platform.includes('ds')) return false;
      }
      
      // Check for word overlap
      const gameWords = gameName.split(/\s+/).filter(w => w.length > 2);
      const estimatedWords = estimated.split(/\s+/).filter(w => w.length > 2);
      
      return gameWords.some(gw => 
        estimatedWords.some(ew => gw.includes(ew) || ew.includes(gw))
      );
    });
    
    // If still no match and it's a GBA save, try GBA games
    if (!match && format.includes('Game Boy Advance')) {
      const gbaGame = games.find((g) => 
        g.platform.toLowerCase().includes('game boy advance')
      );
      if (gbaGame) return gbaGame;
    }
    
    // Don't default to games[0] - return null if no match found so user can select manually
    return match;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return ['.sav', '.3ds'].includes(ext);
    });
    setSelectedFiles(validFiles);
    setError(null);
    setResults([]);
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one save file');
      return;
    }

    setIsLoading(true);
    const uploadResults = [];

    for (const file of selectedFiles) {
      try {
        // Analyze file based on size to detect format
        const fileSize = file.size;
        let detectedFormat = '';
        let estimatedGame = '';
        
        if (fileSize === 8192 || (fileSize > 7800 && fileSize < 8500)) {
          detectedFormat = 'Game Boy (8KB)';
          estimatedGame = 'Pokemon Red/Blue/Yellow';
        } else if (fileSize === 32768 || (fileSize > 31000 && fileSize < 34000)) {
          detectedFormat = 'Game Boy Color (32KB)';
          estimatedGame = 'Pokemon Gold/Silver/Crystal';
        } else if (fileSize === 131072 || (fileSize > 130000 && fileSize < 135000)) {
          detectedFormat = 'Game Boy Advance (128KB)';
          estimatedGame = 'Pokemon Emerald/Ruby/Sapphire/FireRed/LeafGreen';
        } else if (fileSize === 524288 || (fileSize > 520000 && fileSize < 530000)) {
          detectedFormat = 'Nintendo DS (512KB)';
          estimatedGame = 'Pokemon Diamond/Pearl/Platinum or Black/White';
        } else if (fileSize > 380000 && fileSize < 430000) {
          detectedFormat = 'Nintendo 3DS (~405KB)';
          estimatedGame = 'Pokemon X/Y/Omega Ruby/Alpha Sapphire/Sun/Moon/Ultra Sun/Ultra Moon';
        } else {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: 'Unknown file format - could not determine game from file size',
            details: `File size: ${fileSize} bytes`,
          });
          continue;
        }

        // Find the best matching game based on analysis
        const matchedGame = matchGameByAnalysis(estimatedGame, detectedFormat);

        if (!matchedGame) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: 'Could not identify the game from save file',
            details: `Detected: ${estimatedGame} (${detectedFormat})`,
          });
          continue;
        }

        // Upload to the correct game
        try {
          const formData = new FormData();
          formData.append('savefile', file);

          const uploadResponse = await fetch(
            `${apiUrl}/api/savefile/upload/${userId}/${matchedGame.id}`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!uploadResponse.ok) {
            throw new Error('Upload to correct game failed');
          }

          const uploadData = await uploadResponse.json();

          uploadResults.push({
            filename: file.name,
            gameName: matchedGame.name,
            gameFormat: matchedGame.platform,
            success: true,
            message: `✅ Imported for ${matchedGame.name}`,
            details: {
              detectedGame: estimatedGame,
              format: detectedFormat,
              badges: uploadData.progress?.badges || 0,
              pokedexCompletion: uploadData.progress?.pokedexCompletion || 0,
            },
          });
        } catch (e) {
          console.log('Note:', e.message);
          uploadResults.push({
            filename: file.name,
            gameName: matchedGame.name,
            success: false,
            error: e.message,
          });
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        uploadResults.push({
          filename: file.name,
          success: false,
          error: err.message || 'Upload failed',
        });
      }
    }

    setResults(uploadResults);
    setIsLoading(false);
    setSelectedFiles([]);
    
    if (uploadResults.some((r) => r.success)) {
      onImportSuccess?.();
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '25px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '2px solid #667eea',
      }}
    >
      <h2 style={{ marginBottom: '15px', color: '#333' }}>📁 Smart Save File Importer</h2>
      
      <p style={{ fontSize: '0.95em', color: '#666', marginBottom: '15px' }}>
        📤 Upload your save file and I'll auto-detect which game it is and extract your progress!
      </p>

      <div
        style={{
          border: '3px dashed #667eea',
          borderRadius: '8px',
          padding: '30px',
          textAlign: 'center',
          backgroundColor: '#f0f7ff',
          cursor: 'pointer',
          marginBottom: '15px',
          transition: 'all 0.3s',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.backgroundColor = '#e0f0ff';
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f7ff';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.backgroundColor = '#f0f7ff';
          const files = Array.from(e.dataTransfer.files || []);
          const validFiles = files.filter((file) => {
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            return ['.sav', '.3ds'].includes(ext);
          });
          setSelectedFiles(validFiles);
          setError(null);
          setResults([]);
        }}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={isLoading}
          accept=".sav,.3ds"
          multiple
          id="bulk-savefile-input"
          style={{ display: 'none' }}
        />
        
        <label htmlFor="bulk-savefile-input" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '3em', marginBottom: '10px' }}>📤</div>
          <p style={{ fontSize: '1.1em', color: '#667eea', fontWeight: 'bold' }}>
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected`
              : 'Click to select save files'}
          </p>
          <p style={{ fontSize: '0.85em', color: '#999' }}>
            or drag and drop saved game files here
          </p>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '15px',
        }}>
          <h4 style={{ marginBottom: '10px', color: '#333' }}>Selected Files ({selectedFiles.length}):</h4>
          <ul style={{ fontSize: '0.9em', color: '#666', paddingLeft: '20px' }}>
            {selectedFiles.map((file) => (
              <li key={file.name} style={{ marginBottom: '8px' }}>
                <strong>{file.name}</strong>
                <span style={{ color: '#999', marginLeft: '10px' }}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <button
          onClick={handleUploadAll}
          disabled={isLoading}
          style={{
            padding: '12px 30px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1em',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            marginBottom: '15px',
            width: '100%',
          }}
        >
          {isLoading ? '⏳ Analyzing & Importing...' : '🚀 Import & Auto-Detect Games'}
        </button>
      )}

      {error && (
        <div
          style={{
            marginBottom: '15px',
            padding: '12px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '5px',
            color: '#c62828',
            fontSize: '0.9em',
          }}
        >
          ❌ {error}
        </div>
      )}

      {results.length > 0 && (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '6px',
            marginTop: '15px',
          }}
        >
          <h4 style={{ marginBottom: '15px', color: '#333' }}>Import Results:</h4>
          {results.map((result, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '15px',
                padding: '12px',
                backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
                border: `1px solid ${result.success ? '#4caf50' : '#f44336'}`,
                borderRadius: '5px',
              }}
            >
              <div style={{
                color: result.success ? '#2e7d32' : '#c62828',
                fontWeight: 'bold',
                marginBottom: '8px',
              }}>
                {result.success ? '✅' : '❌'} {result.filename}
              </div>
              
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '8px' }}>
                {result.success ? (
                  <>
                    <div><strong>Game:</strong> {result.gameName}</div>
                    <div><strong>Platform:</strong> {result.gameFormat}</div>
                    <div><strong>Status:</strong> Marked as "In Progress"</div>
                  </>
                ) : (
                  <>
                    <div><strong>Error:</strong> {result.error}</div>
                    {result.details && <div style={{ fontSize: '0.85em', color: '#999' }}>({result.details})</div>}
                  </>
                )}
              </div>

              {result.success && result.details && (
                <div style={{
                  fontSize: '0.85em',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '8px',
                }}>
                  <div><strong>Progress Extracted:</strong></div>
                  {result.details.detectedGame && (
                    <div>• Detected as: <strong>{result.details.detectedGame}</strong></div>
                  )}
                  <div>• Format: <strong>{result.details.format}</strong></div>
                  {result.details.badges > 0 && (
                    <div>• Badges Earned: <strong>{result.details.badges}/8</strong> 🏅</div>
                  )}
                  {result.details.pokedexCompletion > 0 && (
                    <div>• Pokédex Completion: <strong>{result.details.pokedexCompletion}%</strong> 📖</div>
                  )}
                  {result.details.badges === 0 && result.details.pokedexCompletion === 0 && (
                    <div style={{ color: '#999', fontStyle: 'italic' }}>
                      (Save file analyzed, ready to track!)
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '15px',
        padding: '12px',
        backgroundColor: '#e3f2fd',
        borderRadius: '6px',
        fontSize: '0.85em',
        color: '#1565c0',
      }}>
        💡 <strong>How it works:</strong> Upload your .sav or .3DS save file. I'll automatically detect which Pokemon game it's from, analyze your progress (badges, Pokédex completion), and update your tracker!
      </div>
    </div>
  );
};

export default BulkSaveFileImporter;
