import React from 'react';
import './FormSectionRecruitment.css';

interface Cohort {
  _id: string;
  name: string;
  experimentation?: {
    name?: string;
    _id?: string;
  };
}

interface User {
  _id: string;
  fullName: string;
  email: string;
}

type ValidationErrors = {
  recruiter?: string;
  cohort?: string;
  recruitmentMethod?: string;
  inclusionDate?: string;
};

type Props = {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  recruiters: User[];
  cohorts: Cohort[];
  errors?: ValidationErrors;
};

export default function FormSectionRecruitment({ 
  formData, 
  handleChange, 
  recruiters = [], 
  cohorts = [],
  errors = {}
}: Props) {
  return (
    <div className="recruitment-card">
      <div className="recruitment-card-header">
        <h2><i className="fas fa-clipboard-list"></i> Informations de recrutement</h2>
      </div>
      <div className="recruitment-card-body">
        <div className="recruitment-form-group">
          <div>
            <label htmlFor="recruiter" className="recruitment-required">
              <i className="fas fa-user-tie"></i> Coordinateur
            </label>
            <select
              id="recruiter"
              name="recruiter"
              required
              value={formData.recruiter || ''} 
              onChange={handleChange}
              className={`recruitment-select ${errors.recruiter ? 'input-error' : ''}`}
            >
              <option value="">Sélectionner un coordinateur</option>
              {recruiters.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.fullName} ({r.email})
                </option>
              ))}
            </select>
            {errors.recruiter && <div className="recruitment-error-message"><i className="fas fa-exclamation-circle"></i> {errors.recruiter}</div>}
          </div>
          <div>
            <label htmlFor="cohort" className="recruitment-required">
              <i className="fas fa-users"></i> Cohorte
            </label>
            <select
              id="cohort"
              name="cohort"
              required
              value={formData.cohort || ''}
              onChange={handleChange}
              className={`recruitment-select ${errors.cohort ? 'input-error' : ''}`}
            >
              <option value="">Sélectionner une cohorte</option>
              {cohorts.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.experimentation?.name && `(${c.experimentation.name})`}
                </option>
              ))}
            </select>
            {errors.cohort && <div className="recruitment-error-message"><i className="fas fa-exclamation-circle"></i> {errors.cohort}</div>}
          </div>
        </div>
        <div className="recruitment-form-group">
          <div>
            <label htmlFor="recruitmentMethod" className="recruitment-required">
              <i className="fas fa-bullhorn"></i> Méthode de recrutement
            </label>
            <select
              id="recruitmentMethod"
              name="recruitmentMethod"
              required
              value={formData.recruitmentMethod}
              onChange={handleChange}
              className={`recruitment-select ${errors.recruitmentMethod ? 'input-error' : ''}`}
            >
              <option value="Domicile">Domicile</option>
              <option value="Partenaire">Partenaire</option>
              <option value="Spontané">Spontané</option>
              <option value="Autre">Autre</option>
            </select>
            {errors.recruitmentMethod && <div className="recruitment-error-message"><i className="fas fa-exclamation-circle"></i> {errors.recruitmentMethod}</div>}
          </div>
          <div>
            <label htmlFor="inclusionDate" className="recruitment-required">
              <i className="fas fa-calendar-plus"></i> Date d'inclusion
            </label>
            <input
              type="date"
              id="inclusionDate"
              name="inclusionDate"
              required
              value={formData.inclusionDate}
              onChange={handleChange}
              className={`recruitment-input ${errors.inclusionDate ? 'input-error' : ''}`}
            />
            {errors.inclusionDate && <div className="recruitment-error-message"><i className="fas fa-exclamation-circle"></i> {errors.inclusionDate}</div>}
          </div>
        </div>
      </div>

      <style jsx>{`
        .recruitment-card-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .recruitment-card-header h2 i {
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
        
        .recruitment-error-message {
          color: #dc3545;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .recruitment-error-message i {
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}