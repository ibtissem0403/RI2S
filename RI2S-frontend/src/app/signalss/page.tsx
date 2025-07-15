//app/signalss/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Contact, WeakSignalFormData } from '@/types/models';
import { UserProvider, useUser } from '@/contexts/UserContext';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import Notification, { NotificationType } from '@/components/Notification/Notification';
import '@fortawesome/fontawesome-free/css/all.min.css';
import AuthGuard from '@/components/AuthGuard';
import './addsignal.css';

const breadcrumbItems = [
  { label: 'Accueil', href: '/index' },
  { label: 'Alertes', href: '/signals' },
  { label: 'Créer une alerte', isCurrentPage: true }
];

// Interface pour les usagers RI2S
interface UsagerRI2S {
  _id: string;
  fullName: string;
  firstName: string;
  pseudoId: string;
  role: string;
  type_usager: string;
}

// Fonction utilitaire pour valider que la date n'est pas dans le futur
const validateDateNotInFuture = (dateStr: string): boolean => {
  if (!dateStr) return true;
  
  const inputDate = new Date(dateStr);
  const today = new Date();
  
  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return inputDate <= today;
};

// Fonction pour valider l'ordre chronologique des dates
const validateChronologicalDates = (earlierDate: string, laterDate: string): boolean => {
  if (!earlierDate || !laterDate) return true;
  
  const earlier = new Date(earlierDate);
  const later = new Date(laterDate);
  
  earlier.setHours(0, 0, 0, 0);
  later.setHours(0, 0, 0, 0);
  
  return earlier <= later;
};

function CreateSignalContent() {
  const router = useRouter();
  const { user } = useUser();
  const [usagers, setUsagers] = useState<UsagerRI2S[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // État pour les notifications
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false
  });

  // Données du formulaire
  const [formData, setFormData] = useState<WeakSignalFormData>({
    beneficiary: '',
    receptionDate: new Date().toISOString().split('T')[0],
    signalType: '',
    description: '',
    source: '',
    notes: '',
    status: 'Nouveau',
    contacts: [],
    coordinator: user?._id || ''
  });

  // État pour le nouveau contact
  const [showContactForm, setShowContactForm] = useState(false);
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

  // Fonction pour afficher une notification
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true
    });
  };

  // Fonction pour fermer la notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Charger la liste des usagers RI2S (seniors uniquement)
  useEffect(() => {
    const fetchUsagers = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) throw new Error('Authentification requise');

        const response = await axios.get(
          'http://localhost:5000/api/usagers-ri2s',
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { role: 'senior' } // Filtrer pour ne récupérer que les seniors
          }
        );

        console.log("Données des usagers RI2S:", response.data);
        setUsagers(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des usagers:', error);
        setError('Impossible de charger la liste des usagers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsagers();
  }, []);

  // Gestionnaire de changement pour les champs du formulaire principal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'receptionDate') {
      // Vérifier que la date de réception n'est pas dans le futur
      if (value && !validateDateNotInFuture(value)) {
        setError('La date de réception ne peut pas être dans le futur');
        return;
      }
      
      // Si on change la date de réception, vérifier qu'elle est cohérente avec les dates de contact existantes
      if (value && formData.contacts && formData.contacts.length > 0) {
        const newReceptionDate = new Date(value);
        newReceptionDate.setHours(0, 0, 0, 0);
        
        // Vérifier que tous les contacts ont des dates postérieures à la nouvelle date de réception
        const invalidContacts = formData.contacts.filter(contact => {
          const contactDate = new Date(contact.contactDate);
          contactDate.setHours(0, 0, 0, 0);
          return contactDate < newReceptionDate;
        });
        
        if (invalidContacts.length > 0) {
          setError(`La date de réception ne peut pas être postérieure à des dates de contact existantes (${invalidContacts.length} contact(s) concerné(s))`);
          return;
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
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

  // Ajouter un nouveau contact
  const handleAddContact = () => {
    // Validation des champs obligatoires
    if (!newContact.contactedPerson.name || !newContact.contactSubject) {
      setError('Veuillez remplir au minimum le nom de la personne et le sujet du contact');
      return;
    }

    // Validation de la date de contact
    if (newContact.contactDate && !validateDateNotInFuture(newContact.contactDate)) {
      setError('La date de contact ne peut pas être dans le futur');
      return;
    }
    
    // Validation que la date de contact est après la date de réception du signal
    if (newContact.contactDate && formData.receptionDate) {
      const contactDate = new Date(newContact.contactDate);
      const receptionDate = new Date(formData.receptionDate);
      
      contactDate.setHours(0, 0, 0, 0);
      receptionDate.setHours(0, 0, 0, 0);
      
      if (contactDate < receptionDate) {
        setError('La date de contact ne peut pas être antérieure à la date de réception du signal');
        return;
      }
    }
    
    // Validation de la date de réponse si elle existe
    if (newContact.response?.date && !validateDateNotInFuture(newContact.response.date)) {
      setError('La date de réponse ne peut pas être dans le futur');
      return;
    }
    
    // Validation que la date de réponse est après la date de contact
    if (newContact.contactDate && newContact.response?.date) {
      if (!validateChronologicalDates(newContact.contactDate, newContact.response.date)) {
        setError('La date de réponse doit être égale ou postérieure à la date de contact');
        return;
      }
    }

    const contactToAdd: Contact = {
      ...newContact,
      contactedBy: user?._id || ''
    };

    setFormData(prev => ({
      ...prev,
      contacts: [...(prev.contacts || []), contactToAdd]
    }));

    // Réinitialiser le formulaire de contact
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

    setShowContactForm(false);
    setError(null);
    showNotification('success', 'Contact ajouté avec succès');
  };

  // Supprimer un contact
  const handleDeleteContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts?.filter((_, i) => i !== index) || []
    }));
    showNotification('info', 'Contact supprimé');
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que les champs obligatoires sont remplis
    if (!formData.beneficiary || !formData.signalType || !formData.description || !formData.source) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier que la date de réception n'est pas dans le futur
    if (formData.receptionDate && !validateDateNotInFuture(formData.receptionDate)) {
      setError('La date de réception ne peut pas être dans le futur');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');

      const dataToSubmit = {
        ...formData,
        coordinator: user?._id
      };

      await axios.post(
        'http://localhost:5000/api/weak-signals',
        dataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('Alerte créée avec succès !');
      showNotification('success', 'Alerte créée avec succès !');
      
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push('/signals');
      }, 2000);

    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création d\'alerte';
      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="addsignal-container">
        <div className="page-header">
          <div className="breadcrumbs-wrapper">
            <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
          </div>
        </div>
        
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des usagers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="addsignal-container">
      <div className="page-header">
        <div className="breadcrumbs-wrapper">
          <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
        </div>
        
        <h1 className="page-title">
          <i className="fas fa-plus-circle"></i>
          Créer une nouvelle alerte
        </h1>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />

      <form onSubmit={handleSubmit} className="ws-form">
        {/* Section informations principales */}
        <div className="ws-form-section">
          <h2 className="ws-form-section-title">
            <i className="fas fa-info-circle"></i>
            Informations principales
          </h2>

          <div className="ws-form-row">
            <div className="ws-form-group">
              <label htmlFor="beneficiary" className="ws-form-label">
                <i className="fas fa-user"></i>
                Bénéficiaire <span className="ws-required">*</span>
              </label>
              <select
                id="beneficiary"
                name="beneficiary"
                value={formData.beneficiary}
                onChange={handleInputChange}
                className="ws-form-input"
                required
              >
                <option value="">Sélectionner un bénéficiaire</option>
                {usagers.map((usager) => (
                  <option key={usager._id} value={usager._id}>
                    {usager.pseudoId} - {usager.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="ws-form-group">
              <label htmlFor="receptionDate" className="ws-form-label">
                <i className="fas fa-calendar"></i>
                Date de réception <span className="ws-required">*</span>
              </label>
              <input
                type="date"
                id="receptionDate"
                name="receptionDate"
                value={formData.receptionDate}
                onChange={handleInputChange}
                className="ws-form-input"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="ws-form-row">
            <div className="ws-form-group">
              <label htmlFor="signalType" className="ws-form-label">
                <i className="fas fa-tag"></i>
                Type d'alerte <span className="ws-required">*</span>
              </label>
              <input
                type="text"
                id="signalType"
                name="signalType"
                value={formData.signalType}
                onChange={handleInputChange}
                className="ws-form-input"
                placeholder="Ex: Technique, Santé, Comportement, Isolement..."
                required
              />
            </div>

            <div className="ws-form-group">
              <label htmlFor="source" className="ws-form-label">
                <i className="fas fa-satellite"></i>
                Source d'alerte <span className="ws-required">*</span>
              </label>
              <input
                type="text"
                id="source"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                className="ws-form-input"
                placeholder="Telegrafik, Presage..."
                required
              />
            </div>
          </div>

          <div className="ws-form-group">
            <label htmlFor="description" className="ws-form-label">
              <i className="fas fa-file-alt"></i>
              Description détaillée <span className="ws-required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="ws-form-textarea"
              placeholder="Décrivez en détail l'alerte"
              required
            />
          </div>

          <div className="ws-form-row">
            <div className="ws-form-group">
              <label htmlFor="status" className="ws-form-label">
                <i className="fas fa-flag"></i>
                Statut initial
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="ws-form-input"
              >
                <option value="Nouveau">Nouveau</option>
                <option value="En cours">En cours</option>
                <option value="Clôturé">Clôturé</option>
              </select>
            </div>

            <div className="ws-form-group">
              <label htmlFor="notes" className="ws-form-label">
                <i className="fas fa-sticky-note"></i>
                Notes additionnelles
              </label>
              <input
                type="text"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="ws-form-input"
                placeholder="Notes ou observations complémentaires..."
              />
            </div>
          </div>
          
          {/* Coordinateur */}
          {user && (
            <div className="ws-form-group">
              <label className="ws-form-label">
                <i className="fas fa-user-shield"></i>
                Coordinateur
              </label>
              <div className="ws-form-coordinator">
                <div className="ws-coordinator-info">
                  <span className="ws-coordinator-name">{user.fullName}</span>
                  <span className="ws-coordinator-email">{user.email}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section contacts */}
        <div className="ws-form-section">
          <div className="ws-form-section-header">
            <h2 className="ws-form-section-title">
              <i className="fas fa-phone"></i>
              Suivi d'actions
            </h2>
            
            <button
              type="button"
              onClick={() => setShowContactForm(!showContactForm)}
              className="ws-toggle-btn"
            >
              <i className={`fas ${showContactForm ? "fa-eye-slash" : "fa-plus"}`}></i>
              {showContactForm ? "Masquer" : "Ajouter un contact"}
            </button>
          </div>

          {/* Liste des contacts existants */}
          {formData.contacts && formData.contacts.length > 0 ? (
            <div className="ws-actions-list">
              {formData.contacts.map((contact, index) => (
                <div key={index} className="ws-action-item">
                  <div className="ws-action-header">
                    <span className="ws-action-date">
                      <i className="fas fa-calendar-day"></i>
                      {new Date(contact.contactDate).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      className="ws-action-delete"
                      onClick={() => handleDeleteContact(index)}
                      title="Supprimer ce contact"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <div className="ws-action-description">
                    <strong>{contact.contactedPerson.name}</strong>
                    {contact.contactedPerson.profession && ` - ${contact.contactedPerson.profession}`}
                  </div>
                  <div className="ws-action-description">
                    <i className="fas fa-quote-left" style={{ fontSize: '0.8rem', marginRight: '0.5rem', opacity: 0.5 }}></i>
                    {contact.contactSubject}
                  </div>
                  {contact.contactContent && (
                    <div className="ws-contact-content">
                      {contact.contactContent}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="ws-no-contacts">
              <i className="fas fa-phone"></i>
              <div>Aucun contact ajouté pour cette alerte</div>
            </div>
          )}

          {/* Formulaire de nouveau contact */}
          {showContactForm && (
            <div className="ws-add-action-form">
              <div className="ws-form-row">
                <div className="ws-form-group">
                  <label className="ws-form-label">
                    <i className="fas fa-user-md"></i> Nom de la personne contactée *
                  </label>
                  <input
                    type="text"
                    name="contactedPerson.name"
                    value={newContact.contactedPerson.name}
                    onChange={handleNewContactChange}
                    className="ws-form-input"
                    placeholder="Dr. Martin Dupont, Marie Dubois..."
                    required
                  />
                </div>
                
                <div className="ws-form-group">
                  <label className="ws-form-label">
                    <i className="fas fa-briefcase"></i> Profession / Relation
                  </label>
                  <input
                    type="text"
                    name="contactedPerson.profession"
                    value={newContact.contactedPerson.profession}
                    onChange={handleNewContactChange}
                    className="ws-form-input"
                    placeholder="Médecin traitant, Fille du patient..."
                  />
                </div>
              </div>

              <div className="ws-form-row">
                <div className="ws-form-group">
                  <label className="ws-form-label">
                    <i className="fas fa-calendar-check"></i> Date de contact
                  </label>
                  <input
                    type="date"
                    name="contactDate"
                    value={newContact.contactDate}
                    onChange={handleNewContactChange}
                    className="ws-form-input"
                    max={new Date().toISOString().split('T')[0]}
                    min={formData.receptionDate}
                  />
                </div>
                
                <div className="ws-form-group">
                  <label className="ws-form-label">
                    <i className="fas fa-phone"></i> Méthode de contact
                  </label>
                  <select
                    name="contactMethod"
                    value={newContact.contactMethod}
                    onChange={handleNewContactChange}
                    className="ws-form-input"
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

              <div className="ws-form-group">
                <label className="ws-form-label">
                  <i className="fas fa-comment"></i> Sujet du contact *
                </label>
                <input
                  type="text"
                  name="contactSubject"
                  value={newContact.contactSubject}
                  onChange={handleNewContactChange}
                  className="ws-form-input"
                  placeholder="Information sur l'état de santé, demande d'intervention..."
                  required
                />
              </div>

              <div className="ws-form-group">
                <label className="ws-form-label">
                  <i className="fas fa-align-left"></i> Contenu du contact
                </label>
                <textarea
                  name="contactContent"
                  value={newContact.contactContent}
                  onChange={handleNewContactChange}
                  className="ws-form-textarea"
                  placeholder="Détails de l'échange, informations communiquées..."
                  rows={3}
                />
              </div>

              <div className="ws-response-toggle">
                <input
                  type="checkbox"
                  id="hasResponse"
                  checked={newContact.response?.hasResponse || false}
                  onChange={(e) => setNewContact(prev => ({
                    ...prev,
                    response: {
                      ...prev.response,
                      hasResponse: e.target.checked
                    }
                  }))}
                  className="ws-response-checkbox"
                />
                <label htmlFor="hasResponse" className="ws-form-label" style={{ margin: 0 }}>
                  <i className="fas fa-reply"></i> Une réponse a été reçue
                </label>
              </div>

              {newContact.response?.hasResponse && (
                <div className="ws-response-fields">
                  <div className="ws-form-row">
                    <div className="ws-form-group">
                      <label className="ws-form-label">
                        <i className="fas fa-calendar-day"></i> Date de la réponse
                      </label>
                      <input
                        type="date"
                        name="response.date"
                        value={newContact.response?.date || ''}
                        onChange={handleNewContactChange}
                        className="ws-form-input"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="ws-form-group">
                      <label className="ws-form-label">
                        <i className="fas fa-reply-all"></i> Méthode de réponse
                      </label>
                      <select
                        name="response.responseMethod"
                        value={newContact.response?.responseMethod || 'Téléphone'}
                        onChange={handleNewContactChange}
                        className="ws-form-input"
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

                  <div className="ws-form-group">
                    <label className="ws-form-label">
                      <i className="fas fa-comment-dots"></i> Contenu de la réponse
                    </label>
                    <textarea
                      name="response.content"
                      value={newContact.response?.content || ''}
                      onChange={handleNewContactChange}
                      className="ws-form-textarea"
                      placeholder="Détails de la réponse reçue..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="ws-contact-form-actions">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="ws-contact-form-cancel"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="ws-contact-form-submit"
                >
                  <i className="fas fa-plus"></i> Ajouter le contact
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="ws-form-error">
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}

        {successMessage && (
          <div className="ws-form-success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {/* Actions du formulaire */}
        <div className="ws-form-actions">
          <button
            type="button"
            onClick={() => router.push('/signals')}
            className="ws-form-cancel"
          >
            <i className="fas fa-times"></i> Annuler
          </button>
          
          <button
            type="submit"
            className="ws-form-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="ws-form-spinner"></div>
                Création en cours...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Créer l'alerte
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Composant principal avec les providers
export default function CreateSignalPage() {
  return (
    <UserProvider>
      <AuthGuard>
        <CreateSignalContent />
      </AuthGuard>
    </UserProvider>
  );
}