import React, { useState } from 'react';

const SaveFileImporter = ({ gameId, userId, apiUrl, onImportSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const supportedFormats = {
    'Game Boy': ['.sav'],
    'Game Boy Color': ['.sav'],
    'Game Boy Advance': ['.sav'],
    'Nintendo DS': ['.sav'],
    'Nintendo 3DS': ['.3DS', '.sav'],
    'Nintendo Switch': ['.sav'],
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      // Validate file size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File is too large. Maximum size is 10MB.');
      }

      // Validate file extension
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const validExtensions = Object.values(supportedFormats).flat();
      if (!validExtensions.includes(fileExt)) {
        throw new Error(
          `Invalid file format. Supported formats: ${validExtensions.join(', ')}`
        );
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('savefile', file);

      // Upload file
      const response = await fetch(
        `${apiUrl}/api/savefile/upload/${userId}/${gameId}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload save file');
      }

      const result = await response.json();
      setSuccess(true);
      onImportSuccess?.(result);

      // Reset input
      e.target.value = '';
    } catch (err) {
      setError(err.message || 'An error occurred while uploading the file');
      console.error('Save file import error:', err);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h3>📁 Import Save File</h3>
      
      <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
        Upload your save file to automatically track your progress in this game.
      </p>

      <div style={{ marginBottom: '15px' }}>
        <h4>Supported Formats:</h4>
        <ul style={{ fontSize: '0.85em', color: '#666', paddingLeft: '20px' }}>
          <li>Game Boy/Color: .sav (8-32 KB)</li>
          <li>Game Boy Advance: .sav (128 KB)</li>
          <li>Nintendo DS: .sav (512 KB)</li>
          <li>Nintendo 3DS: .3DS or .sav</li>
          <li>Nintendo Switch: .sav</li>
        </ul>
      </div>

      <div
        style={{
          border: '2px dashed #667eea',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f0f7ff',
        }}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={isLoading}
          accept=".sav,.3ds"
          id="savefile-input"
          style={{ display: 'none' }}
        />
        
        <label htmlFor="savefile-input" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>📤</div>
          <p style={{ fontSize: '1em', color: '#667eea', fontWeight: 'bold' }}>
            {isLoading ? 'Uploading...' : 'Click to select save file'}
          </p>
          <p style={{ fontSize: '0.85em', color: '#999' }}>
            or drag and drop your save file here
          </p>
        </label>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px' }}>
            <div
              style={{
                height: '100%',
                width: `${uploadProgress}%`,
                backgroundColor: '#667eea',
                borderRadius: '4px',
                transition: 'width 0.3s',
              }}
            ></div>
          </div>
          <p style={{ fontSize: '0.85em', textAlign: 'center', marginTop: '8px' }}>
            {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '15px',
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

      {success && (
        <div
          style={{
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#e8f5e9',
            border: '1px solid #4caf50',
            borderRadius: '5px',
            color: '#2e7d32',
            fontSize: '0.9em',
          }}
        >
          ✅ Save file imported successfully! Your progress has been synced.
        </div>
      )}

      <p style={{ marginTop: '15px', fontSize: '0.8em', color: '#999' }}>
        💡 Tip: Save files are typically located in your emulator's save folder or
        your console's save data directory. We support physical console save backups!
      </p>
    </div>
  );
};

export default SaveFileImporter;
