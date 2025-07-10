'use client';
import { useState } from 'react';
import './WeakSignalDetail.css';

interface PhysicianContactInterface {
  name: string;
  contactDate: string;
  contactMethod: string;
}

interface PhysicianResponseInterface {
  date: string;
  content: string;
  responseMethod: string;
}

interface WeakSignalDetailPhysicianProps {
  physician: PhysicianContactInterface;
  physicianResponse: PhysicianResponseInterface;
  status: string;
  onContactPhysician: (data: {
    name: string;
    contactMethod: string;
    contactDate?: string;
  }) => Promise<boolean>;
  onAddResponse: (data: {
    content: string;
    responseMethod: string;
    date?: string;
  }) => Promise<boolean>;
}

export default function WeakSignalDetailPhysician({
  physician,
  physicianResponse,
  status,
  onContactPhysician,
  onAddResponse
}: WeakSignalDetailPhysicianProps) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactData, setContactData] = useState({
    name: physician?.name || '',
    contactMethod: physician?.contactMethod || 'Téléphone',
    contactDate: new Date().toISOString().split('T')[0]
  });
  const [responseData, setResponseData] = useState({
    content: physicianResponse?.content || '',
    responseMethod: physicianResponse?.responseMethod || 'Téléphone',
    date: new Date().toISOString().split('T')[0]
  });
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const success = await onContactPhysician(contactData);
      if (success) {
        setShowContactForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseData.content.trim()) return;
    
    setIsSubmitting(true);
    try {
      const success = await onAddResponse(responseData);
      if (success) {
        setShowResponseForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isClosed = status === 'Clôturé';
  const hasPhysician = physician && physician.name;
  const hasResponse = physicianResponse && physicianResponse.content;
  
  return (
    <div className="ws-detail-card">
      <div className="ws-detail-card-header physician-header">
        <h2 className="ws-detail-card-title">
          <i className="fas fa-user-md"></i>
          Suivi médical
        </h2>
      </div>
      <div className="ws-detail-card-body">
        {/* Contact du médecin */}
        <div className="ws-detail-physician-section">
          <div className="ws-detail-section-header">
            <h3 className="ws-detail-section-title">Contact du médecin</h3>
            {!hasPhysician && !showContactForm && !isClosed && (
              <button 
                onClick={() => setShowContactForm(true)} 
                className="ws-detail-action-button"
              >
                <i className="fas fa-plus"></i> Contacter
              </button>
            )}
          </div>
          
          {showContactForm ? (
            <form onSubmit={handleContactSubmit} className="ws-detail-form">
              <div className="ws-detail-form-group">
                <label htmlFor="physician-name" className="ws-detail-form-label">
                  Nom du médecin <span className="ws-detail-required">*</span>
                </label>
                <input
                  type="text"
                  id="physician-name"
                  value={contactData.name}
                  onChange={(e) => setContactData({...contactData, name: e.target.value})}
                  className="ws-detail-form-input"
                  required
                />
              </div>
              
              <div className="ws-detail-form-group">
                <label htmlFor="contact-method" className="ws-detail-form-label">
                  Méthode de contact
                </label>
                <select
                  id="contact-method"
                  value={contactData.contactMethod}
                  onChange={(e) => setContactData({...contactData, contactMethod: e.target.value})}
                  className="ws-detail-form-select"
                >
                  <option value="Téléphone">Téléphone</option>
                  <option value="Email">Email</option>
                  <option value="Courrier">Courrier</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              
              <div className="ws-detail-form-group">
                <label htmlFor="contact-date" className="ws-detail-form-label">
                  Date de contact
                </label>
                <input
                  type="date"
                  id="contact-date"
                  value={contactData.contactDate}
                  onChange={(e) => setContactData({...contactData, contactDate: e.target.value})}
                  className="ws-detail-form-input"
                />
              </div>
              
              <div className="ws-detail-form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowContactForm(false)} 
                  className="ws-detail-cancel-btn"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="ws-detail-submit-btn"
                  disabled={isSubmitting || !contactData.name.trim()}
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          ) : hasPhysician ? (
            <div className="ws-detail-physician-info">
              <div className="ws-detail-info-row">
                <div className="ws-detail-info-label">Médecin</div>
                <div className="ws-detail-info-value">{physician.name}</div>
              </div>
              <div className="ws-detail-info-row">
                <div className="ws-detail-info-label">Contacté le</div>
                <div className="ws-detail-info-value">{formatDate(physician.contactDate)}</div>
              </div>
              <div className="ws-detail-info-row">
                <div className="ws-detail-info-label">Méthode</div>
                <div className="ws-detail-info-value">{physician.contactMethod}</div>
              </div>
            </div>
          ) : (
            <div className="ws-detail-empty-state">
              <p>Aucun médecin n'a encore été contacté</p>
            </div>
          )}
        </div>
        
        {/* Réponse du médecin */}
        {(hasPhysician || hasResponse) && (
          <div className="ws-detail-physician-section">
            <div className="ws-detail-section-header">
              <h3 className="ws-detail-section-title">Réponse du médecin</h3>
              {!hasResponse && !showResponseForm && !isClosed && hasPhysician && (
                <button 
                  onClick={() => setShowResponseForm(true)} 
                  className="ws-detail-action-button"
                >
                  <i className="fas fa-plus"></i> Ajouter
                </button>
              )}
            </div>
            
            {showResponseForm ? (
              <form onSubmit={handleResponseSubmit} className="ws-detail-form">
                <div className="ws-detail-form-group">
                  <label htmlFor="response-content" className="ws-detail-form-label">
                    Contenu de la réponse <span className="ws-detail-required">*</span>
                  </label>
                  <textarea
                    id="response-content"
                    value={responseData.content}
                    onChange={(e) => setResponseData({...responseData, content: e.target.value})}
                    className="ws-detail-form-textarea"
                    rows={4}
                    required
                  ></textarea>
                </div>
                
                <div className="ws-detail-form-group">
                  <label htmlFor="response-method" className="ws-detail-form-label">
                    Méthode de réponse
                  </label>
                  <select
                    id="response-method"
                    value={responseData.responseMethod}
                    onChange={(e) => setResponseData({...responseData, responseMethod: e.target.value})}
                    className="ws-detail-form-select"
                  >
                    <option value="Téléphone">Téléphone</option>
                    <option value="Email">Email</option>
                    <option value="Courrier">Courrier</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                
                <div className="ws-detail-form-group">
                  <label htmlFor="response-date" className="ws-detail-form-label">
                    Date de réponse
                  </label>
                  <input
                    type="date"
                    id="response-date"
                    value={responseData.date}
                    onChange={(e) => setResponseData({...responseData, date: e.target.value})}
                    className="ws-detail-form-input"
                  />
                </div>
                
                <div className="ws-detail-form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowResponseForm(false)} 
                    className="ws-detail-cancel-btn"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="ws-detail-submit-btn"
                    disabled={isSubmitting || !responseData.content.trim()}
                  >
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            ) : hasResponse ? (
              <div className="ws-detail-physician-response">
                <div className="ws-detail-info-row">
                  <div className="ws-detail-info-label">Date de réponse</div>
                  <div className="ws-detail-info-value">{formatDate(physicianResponse.date)}</div>
                </div>
                <div className="ws-detail-info-row">
                  <div className="ws-detail-info-label">Méthode</div>
                  <div className="ws-detail-info-value">{physicianResponse.responseMethod}</div>
                </div>
                <div className="ws-detail-response-content">
                  {physicianResponse.content}
                </div>
              </div>
            ) : (
              <div className="ws-detail-empty-state">
                <p>Aucune réponse n'a encore été reçue</p>
              </div>
            )}
          </div>
        )}
        
        {/* État clôturé */}
        {isClosed && hasResponse && (
          <div className="ws-detail-closed-state">
            <i className="fas fa-check-circle"></i>
            <p>Ce signal a été clôturé</p>
          </div>
        )}
      </div>
    </div>
  );
}