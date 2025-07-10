// components/ImportDetail/ImportValidationForm.tsx
import { useState } from 'react';
import './ImportDetail.css';

interface ImportValidationFormProps {
  onSubmit: (data: { action: string; notes: string }) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function ImportValidationForm({
  onSubmit,
  isSubmitting
}: ImportValidationFormProps) {
  const [action, setAction] = useState('Validé');
  const [notes, setNotes] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ action, notes });
  };
  
  return (
    <form onSubmit={handleSubmit} className="validation-form">
      <div className="validation-form-group">
        <label htmlFor="action" className="validation-label">
          Action <span className="validation-required">*</span>
        </label>
        <div className="validation-radio-group">
          <div className="validation-radio-option">
            <input
              type="radio"
              id="validate"
              name="action"
              value="Validé"
              checked={action === 'Validé'}
              onChange={() => setAction('Validé')}
              className="validation-radio"
            />
            <label htmlFor="validate" className="validation-radio-label">
              <span className="validation-radio-icon success">
                <i className="fas fa-check"></i>
              </span>
              <span className="validation-radio-text">
                Valider
                <span className="validation-radio-description">
                  Le fichier sera marqué comme validé et pourra être intégré
                </span>
              </span>
            </label>
          </div>
          
          <div className="validation-radio-option">
            <input
              type="radio"
              id="reject"
              name="action"
              value="Rejeté"
              checked={action === 'Rejeté'}
              onChange={() => setAction('Rejeté')}
              className="validation-radio"
            />
            <label htmlFor="reject" className="validation-radio-label">
              <span className="validation-radio-icon error">
                <i className="fas fa-times"></i>
              </span>
              <span className="validation-radio-text">
                Rejeter
                <span className="validation-radio-description">
                  Le fichier sera marqué comme rejeté et ne pourra pas être intégré
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="validation-form-group">
        <label htmlFor="notes" className="validation-label">
          Notes de validation
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="validation-textarea"
          placeholder="Ajouter des notes concernant la validation ou le rejet..."
          rows={4}
        ></textarea>
      </div>
      
      <div className="validation-form-actions">
        <button
          type="submit"
          className={`validation-submit-btn ${action === 'Validé' ? 'success' : 'error'}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Traitement...' : action === 'Validé' ? 'Valider le fichier' : 'Rejeter le fichier'}
        </button>
      </div>
    </form>
  );
}