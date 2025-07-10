// components/ImportDetail/ImportPreviewTable.tsx
import './ImportDetail.css';

interface ImportPreviewTableProps {
  preview: any;
  isLoading: boolean;
  error: string | null;
}

export default function ImportPreviewTable({
  preview,
  isLoading,
  error
}: ImportPreviewTableProps) {
  if (isLoading) {
    return (
      <div className="preview-loading">
        <div className="preview-spinner"></div>
        <p>Chargement de la prévisualisation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="preview-error">
        <h3>Erreur de prévisualisation</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!preview) {
    return (
      <div className="preview-empty">
        <p>Aucune donnée à prévisualiser</p>
      </div>
    );
  }
  
  // Check if data is not structured
  if (preview.detectedFormat !== 'structured') {
    return (
      <div className="preview-unstructured">
        <div className="preview-unstructured-icon">
          <i className="fas fa-file-alt"></i>
        </div>
        <h3>Fichier non structuré</h3>
        <p>Ce type de fichier ({preview.originalFormat}) ne contient pas de données structurées qui peuvent être prévisualisées sous forme de tableau.</p>
      </div>
    );
  }
  
  if (!preview.preview || preview.preview.length === 0) {
    return (
      <div className="preview-empty">
        <p>Aucune donnée trouvée dans le fichier</p>
      </div>
    );
  }
  
  // Extract headers from the first row
  const headers = preview.headers || Object.keys(preview.preview[0]);
  
  return (
    <div className="preview-container">
      <div className="preview-stats">
        <div className="preview-stat">
          <span className="preview-stat-label">Lignes totales</span>
          <span className="preview-stat-value">{preview.rowCount || preview.preview.length}</span>
        </div>
        <div className="preview-stat">
          <span className="preview-stat-label">Colonnes</span>
          <span className="preview-stat-value">{headers.length}</span>
        </div>
        <div className="preview-stat">
          <span className="preview-stat-label">Aperçu</span>
          <span className="preview-stat-value">{preview.preview.length} sur {preview.rowCount || preview.preview.length}</span>
        </div>
      </div>
      
      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.preview.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex}>
                    {row[header] !== undefined ? String(row[header]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}