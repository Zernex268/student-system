import React, { useState, useRef } from 'react';

export default function FileUpload({ 
  onUpload, 
  accept = '*', 
  maxSize = 50, // MB
  label = 'Выберите файл',
  multiple = false,
  uploadedFiles = [],
  onDelete 
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Проверьте, что onUpload вызывается правильно
const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files);
  setError('');

  if (files.length === 0) return;

  // Проверка размера
  for (const file of files) {
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Файл "${file.name}" превышает лимит ${maxSize}MB`);
      e.target.value = '';
      return;
    }
  }

  setUploading(true);
  try {
    console.log('📤 Загрузка файла:', files[0].name);
    await onUpload(files);
    e.target.value = '';
    console.log('✅ Файл загружен');
  } catch (err) {
    console.error('❌ Ошибка загрузки:', err);
    setError(err.message || 'Ошибка загрузки');
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="file-upload">
      <div className="mb-2">
        <button 
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <i className="bi bi-paperclip me-1"></i>
          {uploading ? 'Загрузка...' : label}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        {error && <small className="text-danger ms-2">{error}</small>}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          {uploadedFiles.map(file => (
            <div key={file.id} className="d-flex align-items-center justify-content-between p-2 mb-1" 
                 style={{ background: 'rgba(72,97,136,0.08)', border: '1px solid var(--border)' }}>
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark me-2" style={{ color: '#486188' }}></i>
                <div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    <strong>{file.name}</strong>
                  </a>
                  <div className="text-muted small">{formatSize(file.size)}</div>
                </div>
              </div>
              {onDelete && (
                <button 
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(file.id)}
                  title="Удалить"
                >
                  <i className="bi bi-trash"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}