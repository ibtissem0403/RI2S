import React from 'react';
import './FormSectionCaregiver.css';

type Props = {
  formData: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
};

export default function FormSectionCaregiver({ formData, handleChange }: Props) {
  return (
    <div className="caregiver-card">
      <div className="caregiver-card-header">
        <h2><i className="fas fa-user-friends"></i> Responsable légal</h2>
      </div>
      <div className="caregiver-card-body">
        <div className="caregiver-form-group">
          <div>
            <label htmlFor="caregiver.name">
              <i className="fas fa-id-card"></i> Nom
            </label>
            <input
              type="text"
              id="caregiver.name"
              name="caregiver.name"
              value={formData.caregiver.name || ''}
              onChange={handleChange}
              className="caregiver-input"
            />
          </div>
          <div>
            <label htmlFor="caregiver.firstName">
              <i className="fas fa-user"></i> Prénom
            </label>
            <input
              type="text"
              id="caregiver.firstName"
              name="caregiver.firstName"
              value={formData.caregiver.firstName || ''}
              onChange={handleChange}
              className="caregiver-input"
            />
          </div>
        </div>
        <div className="caregiver-form-group">
          <div>
            <label htmlFor="caregiver.relation">
              <i className="fas fa-link"></i> Lien de parenté
            </label>
            <input
              type="text"
              id="caregiver.relation"
              name="caregiver.relation"
              value={formData.caregiver.relation || ''}
              onChange={handleChange}
              className="caregiver-input"
            />
          </div>
          <div>
            <label htmlFor="caregiver.phone">
              <i className="fas fa-phone"></i> Téléphone
            </label>
            <input
              type="tel"
              id="caregiver.phone"
              name="caregiver.phone"
              value={formData.caregiver.phone || ''}
              onChange={handleChange}
              className="caregiver-input"
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .caregiver-card-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .caregiver-card-header h2 i {
          color: #22577a;
        }
        
        label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        label i {
          color: #64748b;
          width: 1rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}