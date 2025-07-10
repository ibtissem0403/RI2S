'use client';
import { useState } from 'react';
import { WeakSignal } from '@/types/models';
import { useUser } from '@/contexts/UserContext';
import './WeakSignalDetail.css';

// Styles pour l'indicateur "Vous"
const styles = {
  currentUser: {
    backgroundColor: "#22577a",
    color: "white",
    padding: "0.25rem 0.625rem",
    borderRadius: "9999px",
    fontWeight: 600,
    fontSize: "0.85rem"
  }
};

interface WeakSignalDetailHeaderProps {
  signal: WeakSignal;
  onChangeStatus: (status: string) => Promise<boolean>;
  onEdit: () => void;
}

export default function WeakSignalDetailHeader({
  signal,
  onChangeStatus,
  onEdit
}: WeakSignalDetailHeaderProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const { user } = useUser();
  
  // Fonction pour rendre le coordinateur exactement comme dans le tableau
  const renderCoordinator = () => {
    // Si le coordinateur du signal est l'utilisateur connecté, on affiche "Vous"
    if (user && signal.coordinator._id === user._id) {
      return <span style={styles.currentUser}>Vous</span>;
    }
    // Sinon, on affiche le nom du coordinateur
    return signal.coordinator.fullName;
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'En cours':
        return 'status-in-progress';
      case 'Clôturé':
        return 'status-closed';
      default:
        return '';
    }
  };
  
  const getTypeClass = (type: string) => {
    switch (type) {
      case 'Technique':
        return 'type-technical';
      case 'Santé':
        return 'type-health';
      case 'Comportement':
        return 'type-behavior';
      default:
        return 'type-other';
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === signal.status) {
      setShowStatusMenu(false);
      return;
    }
    
    setIsChangingStatus(true);
    try {
      const success = await onChangeStatus(newStatus);
      if (success) {
        setShowStatusMenu(false);
      }
    } finally {
      setIsChangingStatus(false);
    }
  };
  
  return (
    <div className="ws-detail-header">
      <div className="ws-detail-header-main">
        <div className="ws-detail-title-container">
          <div className="ws-detail-badges">
            <span className={`ws-detail-type-badge ${getTypeClass(signal.signalType)}`}>
              {signal.signalType}
            </span>
            <div className="ws-detail-status-container">
              <button 
                className={`ws-detail-status-badge ${getStatusClass(signal.status)}`} 
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isChangingStatus || signal.status === 'Clôturé'}
              >
                {signal.status}
                {signal.status !== 'Clôturé' && (
                  <span className="ws-detail-status-arrow">▼</span>
                )}
              </button>
              
              {showStatusMenu && (
                <div className="ws-detail-status-menu">
                  {['En cours', 'Clôturé'].map(status => (
                    <button 
                      key={status}
                      className={`ws-detail-status-option ${status === signal.status ? 'active' : ''}`}
                      onClick={() => handleStatusChange(status)}
                      disabled={isChangingStatus}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <h1 className="ws-detail-title">
            Signalement {signal.source}
          </h1>
          
          <div className="ws-detail-meta">
            <div className="ws-detail-meta-item">
              <span className="ws-detail-meta-label">Créé le:</span>
              <span className="ws-detail-meta-value">{formatDate(signal.receptionDate)}</span>
            </div>
            <div className="ws-detail-meta-item">
              <span className="ws-detail-meta-label">Coordinateur:</span>
              <span className="ws-detail-meta-value">
                {renderCoordinator()}
              </span>
            </div>
        
          </div>
        </div>
        
        <div className="ws-detail-header-actions">
          <button 
            onClick={onEdit} 
            className="ws-detail-edit-btn"
          >
            <i className="fas fa-edit"></i> Modifier
          </button>
        </div>
      </div>
    </div>
  );
}