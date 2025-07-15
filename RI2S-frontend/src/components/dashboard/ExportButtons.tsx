import React from 'react';

interface ExportButtonsProps {
  experimentationId?: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ experimentationId }) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  const handleExportExcel = (format = 'beneficiaires') => {
    let url = `${baseUrl}/statistiques/export?format=${format}`;
    if (experimentationId) {
      url += `&experimentationId=${experimentationId}`;
    }
    window.open(url, '_blank');
  };

  const handleExportPDF = (type = 'general') => {
    let url = `${baseUrl}/statistiques/rapport-pdf?type=${type}`;
    if (experimentationId) {
      url += `&experimentationId=${experimentationId}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="export-buttons">
      <div className="dropdown">
        <button className="btn btn-primary dropdown-toggle">
          <i className="fas fa-file-excel me-2"></i>
          Exporter Excel
        </button>
        <div className="dropdown-menu">
          <button 
            className="dropdown-item" 
            onClick={() => handleExportExcel('beneficiaires')}
          >
            Bénéficiaires
          </button>
          <button 
            className="dropdown-item" 
            onClick={() => handleExportExcel('actions')}
          >
            Actions
          </button>
          <button 
            className="dropdown-item" 
            onClick={() => handleExportExcel('complet')}
          >
            Export complet
          </button>
        </div>
      </div>

      <div className="dropdown">
        <button className="btn btn-danger dropdown-toggle">
          <i className="fas fa-file-pdf me-2"></i>
          Exporter PDF
        </button>
        <div className="dropdown-menu">
          <button 
            className="dropdown-item" 
            onClick={() => handleExportPDF('general')}
          >
            Rapport général
          </button>
          {experimentationId && (
            <button 
              className="dropdown-item" 
              onClick={() => handleExportPDF('experimentation')}
            >
              Rapport d'expérimentation
            </button>
          )}
          <button 
            className="dropdown-item" 
            onClick={() => handleExportPDF('efficacite')}
          >
            Rapport d'efficacité
          </button>
        </div>
      </div>

      <style jsx>{`
        .export-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
          color: white;
        }
        
        .btn-primary {
          background-color: #4e73df;
        }
        
        .btn-primary:hover {
          background-color: #2e59d9;
        }
        
        .btn-danger {
          background-color: #e74a3b;
        }
        
        .btn-danger:hover {
          background-color: #c72a1c;
        }
        
        .dropdown {
          position: relative;
          display: inline-block;
        }
        
        .dropdown-toggle::after {
          content: '';
          display: inline-block;
          margin-left: 8px;
          vertical-align: middle;
          border-top: 4px solid;
          border-right: 4px solid transparent;
          border-left: 4px solid transparent;
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1000;
          display: none;
          min-width: 10rem;
          padding: 0.5rem 0;
          margin: 0.125rem 0 0;
          background-color: #fff;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.25rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .dropdown:hover .dropdown-menu {
          display: block;
        }
        
        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.25rem 1.5rem;
          clear: both;
          font-weight: 400;
          color: #212529;
          text-align: inherit;
          white-space: nowrap;
          background-color: transparent;
          border: 0;
          cursor: pointer;
        }
        
        .dropdown-item:hover {
          color: #16181b;
          text-decoration: none;
          background-color: #f8f9fa;
        }
        
        .me-2 {
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default ExportButtons;