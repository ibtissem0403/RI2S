'use client';
import { useState, useEffect } from 'react';
import { WeakSignal, Contact } from '@/types/models';
import { useUser } from '@/contexts/UserContext';
import './WeakSignalEditForm.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

interface WeakSignalEditFormProps {
  signal: WeakSignal;
  onSubmit: (updates: Partial<WeakSignal>) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export default function WeakSignalEditForm({
  signal,
  onSubmit,
  isSubmitting,
  onCancel
}: WeakSignalEditFormProps) {
  const { user } = useUser();
  
  const [formData, setFormData] = useState({
    description: signal.description || '',
    signalType: signal.signalType || '',
    source: signal.source || '',
    status: signal.status || 'En cours',
    notes: signal.notes || '',
    contacts: signal.contacts || []
  });

  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [newContact, setNewContact] = useState<Contact>({
    contactedPerson: {
      name: '',
      profession: ''
    },
    contactDate: new Date().toISOString().split('T')[0],
    contactMethod: 'Téléphone',
    contactSubject: '',
    contactContent: '',
    response: {
      hasResponse: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fonction utilitaire pour valider que la date n'est pas dans le futur
  const validateDateNotInFuture = (dateStr: string): boolean => {
    if (!dateStr) return true; // Si pas de date, pas d'erreur de validation
    
    const inputDate = new Date(dateStr);
    const today = new Date();
    
    // Réinitialiser les heures pour comparer uniquement les dates
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return inputDate <= today;
  };

  // Fonction pour valider l'ordre chronologique des dates
  const validateChronologicalDates = (earlierDate: string, laterDate: string): boolean => {
    if (!earlierDate || !laterDate) return true;
    
    const earlier = new Date(earlierDate);
    const later = new Date(laterDate);
    
    // Réinitialiser les heures pour comparer uniquement les dates
    earlier.setHours(0, 0, 0, 0);
    later.setHours(0, 0, 0, 0);
    
    return earlier <= later;
  };

  // Réinitialiser le formulaire de contact
  const resetContactForm = () => {
    setNewContact({
      contactedPerson: {
        name: '',
        profession: ''
      },
      contactDate: new Date().toISOString().split('T')[0],
      contactMethod: 'Téléphone',
      contactSubject: '',
      contactContent: '',
      response: {
        hasResponse: false
      }
    });
    setEditingContactIndex(null);
    setShowContactForm(false);
  };

  // Gestionnaire de changement pour les champs principaux
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Gestionnaire de changement pour le nouveau contact
  const handleNewContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactedPerson.')) {
      const field = name.split('.')[1];
      setNewContact(prev => ({
        ...prev,
        contactedPerson: {
          ...prev.contactedPerson,
          [field]: value
        }
      }));
    } else if (name.startsWith('response.')) {
      const field = name.split('.')[1];
      setNewContact(prev => ({
        ...prev,
        response: {
          ...prev.response,
          [field]: value,
          hasResponse: field === 'content' ? !!value : prev.response?.hasResponse || false
        }
      }));
    } else {
      setNewContact(prev => ({ ...prev, [name]: value }));
    }
  };

  // Ajouter ou modifier un contact
  const handleSaveContact = () => {
    const contactErrors: Record<string, string> = {};
    
    if (!newContact.contactedPerson.name || !newContact.contactSubject) {
      contactErrors.contact = 'Veuillez remplir au minimum le nom de la personne et le sujet du contact';
    }
    
    // Validation de la date de contact
    if (newContact.contactDate && !validateDateNotInFuture(newContact.contactDate)) {
      contactErrors.contactDate = 'La date de contact ne peut pas être dans le futur';
    }
    
    // Validation que la date de contact est après la date de réception du signal
    if (newContact.contactDate && signal.receptionDate) {
      const contactDate = new Date(newContact.contactDate);
      const receptionDate = new Date(signal.receptionDate);
      
      contactDate.setHours(0, 0, 0, 0);
      receptionDate.setHours(0, 0, 0, 0);
      
      if (contactDate < receptionDate) {
        contactErrors.contactDate = 'La date de contact ne peut pas être antérieure à la date de réception du signal';
      }
    }
    
    // Validation de la date de réponse si elle existe
    if (newContact.response?.date && !validateDateNotInFuture(newContact.response.date)) {
      contactErrors.responseDate = 'La date de réponse ne peut pas être dans le futur';
    }
    
    // Validation que la date de réponse est après la date de contact
    if (newContact.contactDate && newContact.response?.date) {
      if (!validateChronologicalDates(newContact.contactDate, newContact.response.date)) {
        contactErrors.responseDate = 'La date de réponse doit être égale ou postérieure à la date de contact';
      }
    }
    
    if (Object.keys(contactErrors).length > 0) {
      setErrors(prev => ({
        ...prev,
        ...contactErrors
      }));
      return;
    }

    const contactToSave: Contact = {
      ...newContact,
      contactedBy: user?._id || ''
    };

    // Vérifier si une réponse a été ajoutée
    const hasAddedResponse = contactToSave.response?.hasResponse;

    if (editingContactIndex !== null) {
      // Modification d'un contact existant
      setFormData(prev => ({
        ...prev,
        contacts: prev.contacts.map((contact, index) => 
          index === editingContactIndex ? contactToSave : contact
        )
      }));
    } else {
      // Ajout d'un nouveau contact
      setFormData(prev => ({
        ...prev,
        contacts: [...prev.contacts, contactToSave]
      }));
    }

    // Si une réponse a été ajoutée, mettre à jour automatiquement le statut à "Clôturé"
    if (hasAddedResponse) {
      setFormData(prev => ({
        ...prev,
        status: 'Clôturé'
      }));
    }

    resetContactForm();
    setErrors(prev => ({ ...prev, contact: '' }));
  };

  // Commencer l'édition d'un contact
  const handleEditContact = (index: number) => {
    const contact = formData.contacts[index];
    if (contact) {
      // S'assurer que les dates sont au bon format YYYY-MM-DD pour les inputs HTML
      const formattedContact = {
        ...contact,
        // Formater la date de contact
        contactDate: contact.contactDate 
          ? new Date(contact.contactDate).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
        // S'assurer que l'objet response existe et formater sa date si elle existe
        response: {
          ...contact.response,
          date: contact.response?.date 
            ? new Date(contact.response.date).toISOString().split('T')[0] 
            : undefined
        }
      };
      
      setNewContact(formattedContact);
      setEditingContactIndex(index);
      setShowContactForm(true);
    }
  };

  // Supprimer un contact
  const handleDeleteContact = (index: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      setFormData(prev => ({
        ...prev,
        contacts: prev.contacts.filter((_, i) => i !== index)
      }));
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }
    if (!formData.signalType.trim()) {
      newErrors.signalType = 'Le type de signal est obligatoire';
    }
    if (!formData.source.trim()) {
      newErrors.source = 'La source est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Vérifier si au moins un contact a une réponse
    const hasResponseInContacts = formData.contacts.some(contact => 
      contact.response && contact.response.hasResponse
    );

    // Si une réponse existe, s'assurer que le statut est "Clôturé"
    const updatedFormData = {
      ...formData,
      status: hasResponseInContacts ? 'Clôturé' : formData.status
    };

    const result = await onSubmit(updatedFormData);
    if (!result.success && result.error) {
      setErrors(prev => ({ ...prev, submit: result.error || '' }));
    }
  };

  return (
    <div className="edit-signal-form">
      <form onSubmit={handleSubmit}>
        
        {/* Section informations en lecture seule */}
        <div className="edit-signal-form-section">
          <h3 className="edit-signal-section-title">
            <i className="fas fa-info-circle"></i>
            Informations du signal
          </h3>
          
          <div className="edit-signal-readonly-note">
            <i className="fas fa-lightbulb" style={{ marginRight: '0.5rem' }}></i>
            Les informations ci-dessous concernent le bénéficiaire et la coordination. 
            Vous pouvez modifier la description, le type, la source et le statut du signal.
          </div>

          <div className="edit-signal-readonly-grid">
            <div className="edit-signal-readonly-item">
              <span className="edit-signal-readonly-label">Bénéficiaire</span>
              <div className="edit-signal-readonly-value">
                {signal.beneficiary?.fullName} {signal.beneficiary?.firstName}
              </div>
            </div>
            
            <div className="edit-signal-readonly-item">
              <span className="edit-signal-readonly-label">Date de réception</span>
              <div className="edit-signal-readonly-value">
                {new Date(signal.receptionDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
            
            <div className="edit-signal-readonly-item">
              <span className="edit-signal-readonly-label">Coordinateur</span>
              <div className="edit-signal-readonly-value">
                {signal.coordinator?.fullName}
              </div>
            </div>
            
            <div className="edit-signal-readonly-item">
              <span className="edit-signal-readonly-label">Créé le</span>
              <div className="edit-signal-readonly-value">
                {new Date(signal.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        </div>

        {/* Section informations modifiables */}
        <div className="edit-signal-form-section">
          <h3 className="edit-signal-section-title">
            <i className="fas fa-edit"></i>
            Informations modifiables
          </h3>

          <div className="edit-signal-form-row">
            <div className="edit-signal-form-group">
              <label htmlFor="signalType" className="edit-signal-form-label">
                Type de signal <span className="edit-signal-required">*</span>
              </label>
              <input
                type="text"
                id="signalType"
                name="signalType"
                value={formData.signalType}
                onChange={handleInputChange}
                className={`edit-signal-form-input ${errors.signalType ? 'edit-signal-input-error' : ''}`}
                placeholder="Ex: Technique, Santé, Comportement..."
              />
              {errors.signalType && (
                <div className="edit-signal-error-text">{errors.signalType}</div>
              )}
            </div>

            <div className="edit-signal-form-group">
              <label htmlFor="source" className="edit-signal-form-label">
                Source <span className="edit-signal-required">*</span>
              </label>
              <input
                type="text"
                id="source"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                className={`edit-signal-form-input ${errors.source ? 'edit-signal-input-error' : ''}`}
                placeholder="Ex: Capteur, Famille, Médecin..."
              />
              {errors.source && (
                <div className="edit-signal-error-text">{errors.source}</div>
              )}
            </div>
          </div>

          <div className="edit-signal-form-group">
            <label htmlFor="description" className="edit-signal-form-label">
              Description <span className="edit-signal-required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`edit-signal-form-textarea ${errors.description ? 'edit-signal-input-error' : ''}`}
              placeholder="Description détaillée du signal..."
            />
            {errors.description && (
              <div className="edit-signal-error-text">{errors.description}</div>
            )}
          </div>

          <div className="edit-signal-form-row">
            <div className="edit-signal-form-group">
              <label htmlFor="status" className="edit-signal-form-label">
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="edit-signal-form-select"
              >
                <option value="Nouveau">Nouveau</option>
                <option value="En cours">En cours</option>
                <option value="Clôturé">Clôturé</option>
              </select>
              
              {/* Note d'information sur le statut */}
              {formData.contacts.some(contact => contact.response?.hasResponse) && formData.status !== 'Clôturé' && (
                <div className="edit-signal-form-note">
                  <i className="fas fa-info-circle"></i>
                  Le statut sera automatiquement mis à "Clôturé" car une réponse a été enregistrée.
                </div>
              )}
            </div>

            <div className="edit-signal-form-group">
              <label htmlFor="notes" className="edit-signal-form-label">
                Notes
              </label>
              <input
                type="text"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="edit-signal-form-input"
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>
        </div>

        {/* Section contacts */}
        <div className="edit-signal-form-section edit-signal-contacts-section">
          <div className="edit-signal-contacts-header">
            <h3 className="edit-signal-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
              <i className="fas fa-phone"></i>
              Contacts et suivi
            </h3>
            
            <button
              type="button"
              onClick={() => {
                resetContactForm();
                setShowContactForm(!showContactForm);
              }}
              className="edit-signal-add-contact-btn"
              disabled={isSubmitting}
            >
              <i className="fas fa-plus"></i>
              Ajouter un contact
            </button>
          </div>

          {/* Liste des contacts existants */}
          <div className="edit-signal-contacts-list">
            {formData.contacts.length > 0 ? (
              formData.contacts.map((contact, index) => (
                <div key={index} className="edit-signal-contact-item">
                  <div className="edit-signal-contact-header">
                    <div className="edit-signal-contact-info">
                      <div className="edit-signal-contact-person">
                        {contact.contactedPerson.name}
                      </div>
                      {contact.contactedPerson.profession && (
                        <div className="edit-signal-contact-profession">
                          {contact.contactedPerson.profession}
                        </div>
                      )}
                      <div className="edit-signal-contact-meta">
                        <div className="edit-signal-contact-date">
                          <i className="fas fa-calendar"></i>
                          {new Date(contact.contactDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="edit-signal-contact-method">
                          <i className="fas fa-phone"></i>
                          {contact.contactMethod}
                        </div>
                      </div>
                    </div>
                    
                    <div className="edit-signal-contact-actions">
                      <button
                        type="button"
                        onClick={() => handleEditContact(index)}
                        className="edit-signal-contact-edit-btn"
                        disabled={isSubmitting}
                        title="Modifier ce contact"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(index)}
                        className="edit-signal-contact-delete-btn"
                        disabled={isSubmitting}
                        title="Supprimer ce contact"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="edit-signal-contact-subject">
                    {contact.contactSubject}
                  </div>
                  
                  {contact.contactContent && (
                    <div className="edit-signal-contact-content">
                      {contact.contactContent}
                    </div>
                  )}
                  
                  {contact.response?.hasResponse && contact.response.content && (
                    <div className="edit-signal-contact-response">
                      <div className="edit-signal-response-header">
                        <span className="edit-signal-response-badge">
                          <i className="fas fa-reply"></i>
                          Réponse reçue
                        </span>
                        {contact.response.date && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            le {new Date(contact.response.date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <div className="edit-signal-response-content">
                        {contact.response.content}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="edit-signal-no-contacts">
                <i className="fas fa-phone"></i>
                <div>Aucun contact enregistré pour ce signal</div>
              </div>
            )}
          </div>

          {/* Formulaire de contact */}
          {showContactForm && (
            <div className="edit-signal-contact-form">
              <div className="edit-signal-contact-form-header">
                <h4 className="edit-signal-contact-form-title">
                  {editingContactIndex !== null ? 'Modifier le contact' : 'Nouveau contact'}
                </h4>
                <button
                  type="button"
                  onClick={resetContactForm}
                  className="edit-signal-contact-form-close"
                >
                  ×
                </button>
              </div>

              <div className="edit-signal-contact-form-section">
                <h5 className="edit-signal-contact-form-section-title">
                  Informations de contact
                </h5>
                
                <div className="edit-signal-form-row">
                  <div className="edit-signal-form-group">
                    <label className="edit-signal-form-label">
                      Nom de la personne contactée *
                    </label>
                    <input
                      type="text"
                      name="contactedPerson.name"
                      value={newContact.contactedPerson.name}
                      onChange={handleNewContactChange}
                      className="edit-signal-form-input"
                      placeholder="Dr. Martin Dupont, Marie Dubois..."
                    />
                  </div>
                  
                  <div className="edit-signal-form-group">
                    <label className="edit-signal-form-label">
                      Profession / Relation
                    </label>
                    <input
                      type="text"
                      name="contactedPerson.profession"
                      value={newContact.contactedPerson.profession}
                      onChange={handleNewContactChange}
                      className="edit-signal-form-input"
                      placeholder="Médecin traitant, Fille du patient..."
                    />
                  </div>
                </div>

                <div className="edit-signal-form-row">
                  <div className="edit-signal-form-group">
                    <label className="edit-signal-form-label">
                      Date de contact
                    </label>
                    <input
                      type="date"
                      name="contactDate"
                      value={newContact.contactDate}
                      onChange={handleNewContactChange}
                      className="edit-signal-form-input"
                      max={new Date().toISOString().split('T')[0]} // Empêcher les dates futures
                      min={new Date(signal.receptionDate).toISOString().split('T')[0]} // Empêcher les dates avant la réception
                    />
                    {errors.contactDate && (
                      <div className="edit-signal-error-text">{errors.contactDate}</div>
                    )}
                  </div>
                  
                  <div className="edit-signal-form-group">
                    <label className="edit-signal-form-label">
                      Méthode de contact
                    </label>
                    <select
                      name="contactMethod"
                      value={newContact.contactMethod}
                      onChange={handleNewContactChange}
                      className="edit-signal-form-select"
                    >
                      <option value="Téléphone">Téléphone</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="Visite">Visite</option>
                      <option value="Courrier">Courrier</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="edit-signal-form-group">
                  <label className="edit-signal-form-label">
                    Sujet du contact *
                  </label>
                  <input
                    type="text"
                    name="contactSubject"
                    value={newContact.contactSubject}
                    onChange={handleNewContactChange}
                    className="edit-signal-form-input"
                    placeholder="Information sur l'état de santé, demande d'intervention..."
                  />
                </div>

                <div className="edit-signal-form-group">
                  <label className="edit-signal-form-label">
                    Contenu du contact
                  </label>
                  <textarea
                    name="contactContent"
                    value={newContact.contactContent}
                    onChange={handleNewContactChange}
                    className="edit-signal-form-textarea"
                    placeholder="Détails de l'échange, informations communiquées..."
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>

              {/* Section réponse */}
              <div className="edit-signal-contact-form-section">
                <div className="edit-signal-response-toggle">
                  <input
                    type="checkbox"
                    id="hasResponse"
                    className="edit-signal-response-checkbox"
                    checked={newContact.response?.hasResponse || false}
                    onChange={(e) => setNewContact(prev => ({
                      ...prev,
                      response: {
                        ...prev.response,
                        hasResponse: e.target.checked
                      }
                    }))}
                  />
                  <label htmlFor="hasResponse" className="edit-signal-form-label" style={{ margin: 0 }}>
                    Une réponse a été reçue
                  </label>
                </div>
                
        

                {newContact.response?.hasResponse && (
                  <div className="edit-signal-response-fields">
                    <div className="edit-signal-form-row">
                      <div className="edit-signal-form-group">
                        <label className="edit-signal-form-label">
                          Date de la réponse
                        </label>
                        <input
                          type="date"
                          name="response.date"
                          value={newContact.response?.date || ''}
                          onChange={handleNewContactChange}
                          className="edit-signal-form-input"
                          max={new Date().toISOString().split('T')[0]} // Empêcher les dates futures
                        />
                        {errors.responseDate && (
                          <div className="edit-signal-error-text">{errors.responseDate}</div>
                        )}
                      </div>
                      
                      <div className="edit-signal-form-group">
                        <label className="edit-signal-form-label">
                          Méthode de réponse
                        </label>
                        <select
                          name="response.responseMethod"
                          value={newContact.response?.responseMethod || 'Téléphone'}
                          onChange={handleNewContactChange}
                          className="edit-signal-form-select"
                        >
                          <option value="Téléphone">Téléphone</option>
                          <option value="Email">Email</option>
                          <option value="SMS">SMS</option>
                          <option value="Visite">Visite</option>
                          <option value="Courrier">Courrier</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                    </div>

                    <div className="edit-signal-form-group">
                      <label className="edit-signal-form-label">
                        Contenu de la réponse
                      </label>
                      <textarea
                        name="response.content"
                        value={newContact.response?.content || ''}
                        onChange={handleNewContactChange}
                        className="edit-signal-form-textarea"
                        placeholder="Détails de la réponse reçue..."
                        style={{ minHeight: '80px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {errors.contact && (
                <div className="edit-signal-error-text" style={{ marginBottom: '1rem' }}>
                  {errors.contact}
                </div>
              )}

              <div className="edit-signal-contact-form-actions">
                <button
                  type="button"
                  onClick={resetContactForm}
                  className="edit-signal-contact-form-cancel"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveContact}
                  className="edit-signal-contact-form-submit"
                  disabled={isSubmitting}
                >
                  <i className="fas fa-save"></i>
                  {editingContactIndex !== null ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Erreur de soumission */}
        {errors.submit && (
          <div className="edit-signal-form-section">
            <div className="edit-signal-error-text">
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
              {errors.submit}
            </div>
          </div>
        )}

        {/* Actions du formulaire */}
        <div className="edit-signal-form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="edit-signal-form-cancel"
            disabled={isSubmitting}
          >
            <i className="fas fa-times"></i>
            Annuler
          </button>
          
          <button
            type="submit"
            className="edit-signal-form-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Enregistrement...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}