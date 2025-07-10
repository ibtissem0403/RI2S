'use client';
import './WeakSignalDetail.css';

interface Action {
  _id?: string;
  date: string;
  description: string;
  performedBy: {
    _id: string;
    fullName: string;
  };
}

interface WeakSignalDetailActionsProps {
  actions: Action[];
  onAddAction: () => void;
}

export default function WeakSignalDetailActions({
  actions = [],
  onAddAction
}: WeakSignalDetailActionsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <div className="ws-detail-card">
      <div className="ws-detail-card-header">
        <h2 className="ws-detail-card-title">
          <i className="fas fa-tasks"></i>
          Actions effectuées
        </h2>
        <button 
          onClick={onAddAction} 
          className="ws-detail-add-action-btn"
        >
          <i className="fas fa-plus"></i> Ajouter
        </button>
      </div>
      <div className="ws-detail-card-body">
        {actions && actions.length > 0 ? (
          <div className="ws-detail-actions-list">
            {actions.map((action, index) => (
              <div key={action._id || index} className="ws-detail-action-item">
                <div className="ws-detail-action-header">
                  <div className="ws-detail-action-date">{formatDate(action.date)}</div>
                  <div className="ws-detail-action-author">{action.performedBy?.fullName || 'Utilisateur inconnu'}</div>
                </div>
                <div className="ws-detail-action-description">
                  {action.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ws-detail-empty-state">
            <p>Aucune action n'a encore été effectuée</p>
            <button 
              onClick={onAddAction} 
              className="ws-detail-empty-action-btn"
            >
              <i className="fas fa-plus"></i>
              Ajouter la première action
            </button>
          </div>
        )}
      </div>
    </div>
  );
}