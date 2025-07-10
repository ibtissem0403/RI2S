// components/DeleteConfirmation/DeleteConfirmation.tsx
'use client';
import '@fortawesome/fontawesome-free/css/all.min.css';

interface DeleteConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  signalType?: string;
  beneficiaryName?: string;
}

const styles = `
  .delete-confirmation {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .delete-icon {
    background-color: #fee2e2;
    color: #dc2626;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .delete-message {
    text-align: center;
    color: #4b5563;
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  .delete-highlight {
    font-weight: 600;
    color: #111827;
  }

  .delete-actions {
    display: flex;
    gap: 1rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .delete-btn {
    flex: 1;
    padding: 0.625rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .delete-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .delete-btn-cancel {
    background-color: #f3f4f6;
    color: #4b5563;
  }

  .delete-btn-cancel:hover:not(:disabled) {
    background-color: #e5e7eb;
  }

  .delete-btn-confirm {
    background-color: #ef4444;
    color: white;
  }

  .delete-btn-confirm:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .delete-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .delete-actions {
      flex-direction: column-reverse;
    }
    
    .delete-btn {
      width: 100%;
    }
  }
`;

export default function DeleteConfirmation({
  onConfirm,
  onCancel,
  isLoading = false,
  signalType = '',
  beneficiaryName = ''
}: DeleteConfirmationProps) {
  return (
    <>
      <style>{styles}</style>
      <div className="delete-confirmation">
        <div className="delete-icon">
          <i className="fas fa-trash-alt"></i>
        </div>
        
        <div className="delete-message">
          {signalType && beneficiaryName ? (
            <>
              Êtes-vous sûr de vouloir supprimer définitivement le signal de type 
              <span className="delete-highlight"> "{signalType}" </span> 
              pour 
              <span className="delete-highlight"> {beneficiaryName}</span>?
            </>
          ) : (
            <>
              Êtes-vous sûr de vouloir supprimer ce signal?
            </>
          )}
          <p>Cette action est irréversible et toutes les données associées seront perdues.</p>
        </div>
        
        <div className="delete-actions">
          <button 
            className="delete-btn delete-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            <i className="fas fa-times"></i>
            Annuler
          </button>
          
          <button 
            className="delete-btn delete-btn-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="delete-spinner"></div>
                Suppression...
              </>
            ) : (
              <>
                <i className="fas fa-trash-alt"></i>
                Supprimer
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}