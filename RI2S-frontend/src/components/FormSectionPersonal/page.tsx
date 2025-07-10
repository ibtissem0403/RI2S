import React from 'react';
import './FormSectionPersonal.css';

type ValidationErrors = {
  fullName?: string;
  firstName?: string;
  birthDate?: string;
  sex?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
};

type Props = {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors?: ValidationErrors;
};

export default function FormSectionPersonal({ formData, handleChange, errors = {} }: Props) {
  return (
    <div className="personal-card">
      <div className="personal-card-header">
        <h2><i className="fas fa-user-circle"></i> Informations personnelles</h2>
      </div>
      <div className="personal-card-body">
        <div className="personal-form-group">
          <div>
            <label htmlFor="fullName" className="personal-required">
              <i className="fas fa-id-card"></i> Nom complet
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className={`personal-input ${errors.fullName ? 'input-error' : ''}`}
            />
            {errors.fullName && <div className="personal-error-message"><i className="fas fa-exclamation-circle"></i> {errors.fullName}</div>}
          </div>
          <div>
            <label htmlFor="firstName" className="personal-required">
              <i className="fas fa-user"></i> Prénom
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className={`personal-input ${errors.firstName ? 'input-error' : ''}`}
            />
            {errors.firstName && <div className="personal-error-message"><i className="fas fa-exclamation-circle"></i> {errors.firstName}</div>}
          </div>
        </div>

        <div className="personal-form-group">
          <div>
            <label htmlFor="birthDate" className="personal-required">
              <i className="fas fa-calendar-alt"></i> Date de naissance
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              required
              value={formData.birthDate}
              onChange={handleChange}
              className={`personal-input ${errors.birthDate ? 'input-error' : ''}`}
            />
            {errors.birthDate && <div className="personal-error-message"><i className="fas fa-exclamation-circle"></i> {errors.birthDate}</div>}
          </div>
          <div>
            <label htmlFor="sex" className="personal-required">
              <i className="fas fa-venus-mars"></i> Sexe
            </label>
            <select
              id="sex"
              name="sex"
              required
              value={formData.sex}
              onChange={handleChange}
              className={`personal-select ${errors.sex ? 'input-error' : ''}`}
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="Other">Autre</option>
            </select>
            {errors.sex && <div className="personal-error-message"><i className="fas fa-exclamation-circle"></i> {errors.sex}</div>}
          </div>
        </div>

        <div className="personal-form-group">
          <div>
            <label htmlFor="address" className="personal-required">
              <i className="fas fa-home"></i> Adresse
            </label>
            <input
              type="text"
              id="address"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              className={`personal-input ${errors.address ? 'input-error' : ''}`}
            />
            {errors.address && <div className="personal-error-message"><i className="fas fa-exclamation-circle"></i> {errors.address}</div>}
          </div>
          <div>
            <label htmlFor="phone" className="personal-required">
              <i className="fas fa-phone"></i> Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className={`personal-input ${errors.phone ? 'input-error' : ''}`}
            />
            {errors.phone && <div className="personal-error-message"><i className="fas fa-exclamation-circle"></i> {errors.phone}</div>}
          </div>
        </div>

        <div className="personal-form-group">
          <div>
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={`personal-input ${errors.email ? 'input-error' : ''}`}
            />
            {errors.email && <div className="personal-error-message"><i className="fas fa-exclamation-circle"></i> {errors.email}</div>}
          </div>
          <div>
            <label htmlFor="status" className="personal-required">
              <i className="fas fa-user-check"></i> Statut
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className={`personal-select ${errors.status ? 'input-error' : ''}`}
            >
              <option value="Actif">Actif</option>
              <option value="Sorti">Sorti</option>
              <option value="Suspendu">Suspendu</option>
            </select>
            {errors.status && <div className="personal-error-message"><i className="fas fa-exclamation-circle"></i> {errors.status}</div>}
          </div>
        </div>
      </div>

      <style jsx>{`
        .personal-card-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .personal-card-header h2 i {
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
        
        .input-error {
          border-color: #dc3545 !important;
          background-color: #fff8f8;
        }
        
        .personal-error-message {
          color: #dc3545;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .personal-error-message i {
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}