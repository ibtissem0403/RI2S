'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import './add.css';

// Types pour les usagers RI2S
type UsagerType = 'pro' | 'non_pro';
type UserRole = 'médecin' | 'infirmier' | 'pharmacien' | 'kiné' | 'autre_pro' | 'senior' | 'aidant';

// Interface pour l'usager RI2S
interface UsagerRI2S {
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  type_usager: UsagerType;
  role: UserRole;
  
  // Champs pro
  specialite?: string;
  villeExercice?: string;
  zoneGeographiquePatients?: string;
  milieuExercice?: string;
  nomStructure?: string;
  
  // Champs senior
  codePostal?: string;
  dateNaissance?: string;
  horairePrefere?: 'Matin' | 'Midi' | 'Après midi';
  
  // Champ aidant
  lien_avec_senior?: string;
  
  // Notes
  notes?: string;
}

// Interface pour les erreurs de validation
interface ValidationErrors {
  fullName?: string;
  firstName?: string;
  email?: string;
  phone?: string;
  type_usager?: string;
  role?: string;
  specialite?: string;
  lien_avec_senior?: string;
}


// Interface pour le type de notification
type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Interface pour la notification
interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  position: string;
}

// Interface pour les seniors disponibles
interface Senior {
  _id: string;
  fullName: string;
  firstName: string;
  pseudo?: {
    pseudoId?: string;
    pseudoName?: string;
  };
}

const breadcrumbItems = [
  { label: 'Accueil', href: '/index' },
  { label: 'Usagers', href: '/beneficiaires' },
  { label: 'Ajouter Usager', isCurrentPage: true }
];



// Notification component
const Notification: React.FC<NotificationProps> = ({ type, message, isVisible, onClose, position }) => {
  if (!isVisible) return null;
  
  return (
    <div className={`notification ${type} ${position}`}>
      <div className="notification-content">
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

// Section Informations Personnelles
interface FormSectionPersonalProps {
  formData: UsagerRI2S;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  errors: ValidationErrors;
}

const FormSectionPersonal: React.FC<FormSectionPersonalProps> = ({ formData, handleChange, errors }) => {
  return (
    <div className="form-section form-section-personal">
      <div className="form-section-content">
        <h2 className="section-title">
          <i className="fas fa-user-circle"></i> Informations personnelles
        </h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="fullName">
              <i className="fas fa-id-card"></i> Nom <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className={errors.fullName ? 'error' : ''}
            />
            {errors.fullName && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.fullName}</div>}
          </div>
          
          <div className="form-field">
            <label htmlFor="firstName">
              <i className="fas fa-user"></i> Prénom <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className={errors.firstName ? 'error' : ''}
            />
            {errors.firstName && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.firstName}</div>}
          </div>
          
          <div className="form-field">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.email}</div>}
          </div>
          
          <div className="form-field">
            <label htmlFor="phone">
              <i className="fas fa-phone"></i> Téléphone <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="ex: 06xxxxxxxx ou 05xxxxxxxx"
              required
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.phone}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Type d'Usager
interface FormSectionTypeUsagerProps {
  formData: UsagerRI2S;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  errors: ValidationErrors;
}

const FormSectionTypeUsager: React.FC<FormSectionTypeUsagerProps> = ({ formData, handleChange, errors }) => {
  return (
    <div className="form-section form-section-type-usager">
      <div className="form-section-content">
        <h2 className="section-title">
          <i className="fas fa-user-tag"></i> Type d'usager
        </h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="type_usager">
              <i className="fas fa-users"></i> Type d'usager <span className="required">*</span>
            </label>
            <select
              id="type_usager"
              name="type_usager"
              value={formData.type_usager}
              onChange={handleChange}
              required
              className={errors.type_usager ? 'error' : ''}
            >
              <option value="non_pro">Non professionnel</option>
              <option value="pro">Professionnel</option>
            </select>
            {errors.type_usager && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.type_usager}</div>}
          </div>
          
          <div className="form-field">
            <label htmlFor="role">
              <i className="fas fa-user-cog"></i> Rôle <span className="required">*</span>
            </label>
            {formData.type_usager === 'pro' ? (
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={errors.role ? 'error' : ''}
              >
                <option value="médecin">Médecin</option>
                <option value="infirmier">Infirmier</option>
                <option value="pharmacien">Pharmacien</option>
                <option value="kiné">Kinésithérapeute</option>
                <option value="autre_pro">Autre professionnel</option>
              </select>
            ) : (
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={errors.role ? 'error' : ''}
              >
                <option value="senior">Senior</option>
                <option value="aidant">Aidant</option>
              </select>
            )}
            {errors.role && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.role}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Professionnel
interface FormSectionProfessionalProps {
  formData: UsagerRI2S;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  errors: ValidationErrors;
}

const FormSectionProfessional: React.FC<FormSectionProfessionalProps> = ({ formData, handleChange, errors }) => {
  if (formData.type_usager !== 'pro') return null;
  
  return (
    <div className="form-section form-section-professional">
      <div className="form-section-content">
        <h2 className="section-title">
          <i className="fas fa-briefcase"></i> Informations professionnelles
        </h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="specialite">
              <i className="fas fa-stethoscope"></i> Spécialité <span className="required">*</span>
            </label>
            <input
              type="text"
              id="specialite"
              name="specialite"
              value={formData.specialite || ''}
              onChange={handleChange}
              required
              className={errors.specialite ? 'error' : ''}
            />
            {errors.specialite && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.specialite}</div>}
          </div>
          
          <div className="form-field">
            <label htmlFor="villeExercice">
              <i className="fas fa-map-marker-alt"></i> Ville d'exercice
            </label>
            <input
              type="text"
              id="villeExercice"
              name="villeExercice"
              value={formData.villeExercice || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="zoneGeographiquePatients">
              <i className="fas fa-globe"></i> Zone géographique des patients
            </label>
            <input
              type="text"
              id="zoneGeographiquePatients"
              name="zoneGeographiquePatients"
              value={formData.zoneGeographiquePatients || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="milieuExercice">
              <i className="fas fa-building"></i> Milieu d'exercice
            </label>
            <select
              id="milieuExercice"
              name="milieuExercice"
              value={formData.milieuExercice || ''}
              onChange={handleChange}
            >
              <option value="">Sélectionner...</option>
              <option value="Libéral">Libéral</option>
              <option value="Hôpital">Hôpital</option>
              <option value="Clinique">Clinique</option>
              <option value="EHPAD">EHPAD</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          
          <div className="form-field">
            <label htmlFor="nomStructure">
              <i className="fas fa-hospital"></i> Nom de la structure
            </label>
            <input
              type="text"
              id="nomStructure"
              name="nomStructure"
              value={formData.nomStructure || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Senior
interface FormSectionSeniorProps {
  formData: UsagerRI2S;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  errors: ValidationErrors;
}

const FormSectionSenior: React.FC<FormSectionSeniorProps> = ({ formData, handleChange, errors }) => {
  if (formData.type_usager !== 'non_pro' || formData.role !== 'senior') return null;
  
  return (
    <div className="form-section form-section-senior">
      <div className="form-section-content">
        <h2 className="section-title">
          <i className="fas fa-user-friends"></i> Informations senior
        </h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="codePostal">
              <i className="fas fa-map-pin"></i> Code postal
            </label>
            <input
              type="text"
              id="codePostal"
              name="codePostal"
              value={formData.codePostal || ''}
              onChange={handleChange}
              placeholder="ex: 81100, Castres"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="dateNaissance">
              <i className="fas fa-birthday-cake"></i> Date de naissance
            </label>
            <input
              type="date"
              id="dateNaissance"
              name="dateNaissance"
              value={formData.dateNaissance || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="horairePrefere">
              <i className="fas fa-clock"></i> Moment de contact préféré
            </label>
            <select
              id="horairePrefere"
              name="horairePrefere"
              value={formData.horairePrefere || 'Matin'}
              onChange={handleChange}
            >
              <option value="Matin">Matin</option>
              <option value="Midi">Midi</option>
              <option value="Après midi">Après midi</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Aidant
interface FormSectionAidantProps {
  formData: UsagerRI2S;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  errors: ValidationErrors;
  seniors: Senior[];
  isLoading: boolean;
}

const FormSectionAidant: React.FC<FormSectionAidantProps> = ({ formData, handleChange, errors, seniors, isLoading }) => {
  if (formData.type_usager !== 'non_pro' || formData.role !== 'aidant') return null;
  
  return (
    <div className="form-section form-section-aidant">
      <div className="form-section-content">
        <h2 className="section-title">
          <i className="fas fa-hands-helping"></i> Informations aidant
        </h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="lien_avec_senior">
              <i className="fas fa-link"></i> Senior associé <span className="required">*</span>
            </label>
            <select
              id="lien_avec_senior"
              name="lien_avec_senior"
              value={formData.lien_avec_senior || ''}
              onChange={handleChange}
              required
              className={errors.lien_avec_senior ? 'error' : ''}
            >
              <option value="">Sélectionner un senior...</option>
              {seniors.map(senior => (
                <option key={senior._id} value={senior._id}>
                  {senior.pseudo?.pseudoName ? ` ${senior.pseudo.pseudoName}` : ''}
                </option>
              ))}
            </select>
            {errors.lien_avec_senior && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.lien_avec_senior}</div>}
            {isLoading && <div className="loading-text"><i className="fas fa-spinner fa-spin"></i> Chargement des seniors...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Notes
interface FormSectionNotesProps {
  formData: UsagerRI2S;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const FormSectionNotes: React.FC<FormSectionNotesProps> = ({ formData, handleChange }) => {
  return (
    <div className="form-section form-section-notes">
      <div className="form-section-content">
        <h2 className="section-title">
          <i className="fas fa-sticky-note"></i> Informations complémentaires
        </h2>
        <div className="form-field">
          <label htmlFor="notes">
            <i className="fas fa-comment-alt"></i> Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

// Composant principal pour l'ajout d'un usager RI2S
export default function AjoutUsagerRI2S() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [isFetchingSeniors, setIsFetchingSeniors] = useState<boolean>(false);
  
  // État pour les erreurs de validation
  const [errors, setErrors] = useState<ValidationErrors>({});
  
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
  
  // État pour les données du formulaire
  const [formData, setFormData] = useState<UsagerRI2S>({
    fullName: '',
    firstName: '',
    email: '',
    phone: '',
    type_usager: 'non_pro',
    role: 'senior',
    specialite: '',
    villeExercice: '',
    zoneGeographiquePatients: '',
    milieuExercice: '',
    nomStructure: '',
    codePostal: '',
    dateNaissance: '',
    horairePrefere: 'Matin',
    lien_avec_senior: '',
    notes: ''
  });
  
  // Afficher une notification
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true
    });
  };

  // Fermer une notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Effet pour charger les seniors quand le type d'usager est aidant
  useEffect(() => {
    // Charger les seniors si l'usager est un aidant
    if (formData.type_usager === 'non_pro' && formData.role === 'aidant') {
      fetchSeniors();
    }
  }, [formData.type_usager, formData.role]);

  // Fonction pour récupérer les seniors
  const fetchSeniors = async () => {
    setIsFetchingSeniors(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:5000/api/usagers-ri2s/seniors-disponibles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des seniors');
      }
      
      const data = await response.json();
      setSeniors(data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('error', 'Erreur lors du chargement des seniors');
    } finally {
      setIsFetchingSeniors(false);
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Champs obligatoires
    if (!formData.fullName) newErrors.fullName = 'Le nom est requis';
    if (!formData.firstName) newErrors.firstName = 'Le prénom est requis';
    if (!formData.email) newErrors.email = 'L\'email est requis';
    if (!formData.phone) newErrors.phone = 'Le téléphone est requis';
    
    // Validation selon le type d'usager
    if (formData.type_usager === 'pro' && !formData.specialite) {
      newErrors.specialite = 'La spécialité est requise pour un professionnel';
    }
    
    if (formData.type_usager === 'non_pro' && formData.role === 'aidant' && !formData.lien_avec_senior) {
      newErrors.lien_avec_senior = 'Le lien avec un senior est requis';
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Phone validation
    if (formData.phone && !/^0[1-9][0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide (10 chiffres commençant par 0)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Effacer l'erreur pour ce champ s'il y en a une
    if (name in errors) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ValidationErrors];
        return newErrors;
      });
    }
    
    // Mise à jour du champ
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Si on change le type d'usager, réinitialiser les champs spécifiques
    if (name === 'type_usager') {
      if (value === 'pro') {
        setFormData(prev => ({
          ...prev,
          role: 'médecin',
          codePostal: '',
          dateNaissance: '',
          horairePrefere: 'Matin',
          lien_avec_senior: ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          role: 'senior',
          specialite: '',
          villeExercice: '',
          zoneGeographiquePatients: '',
          milieuExercice: '',
          nomStructure: ''
        }));
      }
    }
    
    // Si on change le rôle non-pro, réinitialiser certains champs
    if (name === 'role' && formData.type_usager === 'non_pro') {
      if (value === 'senior') {
        setFormData(prev => ({
          ...prev,
          lien_avec_senior: ''
        }));
      }
    }
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (!validateForm()) {
      showNotification('error', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    setIsLoading(true);
    closeNotification();
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Votre session a expiré. Veuillez vous reconnecter.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/usagers-ri2s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'usager');
      }
      
      const data = await response.json();
      
      showNotification('success', `Usager RI2S créé avec succès ! Pseudonyme: ${data.data.pseudo.pseudoName}`);
      
      // Rediriger vers la liste des usagers après un court délai
      setTimeout(() => {
        router.push('/beneficiaires');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('error', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-container">
      <div className="page-header">
        <div className="breadcrumbs-container">
                   <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
                 </div>
        <h1 className="add-title"><i className="fas fa-user-plus"></i> Ajouter un usager RI2S</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="add-form">
        <FormSectionTypeUsager 
          formData={formData}
          handleChange={handleChange}
          errors={errors}
        />
        
        <FormSectionPersonal 
          formData={formData}
          handleChange={handleChange}
          errors={errors}
        />
        
        <FormSectionProfessional 
          formData={formData}
          handleChange={handleChange}
          errors={errors}
        />
        
        <FormSectionSenior 
          formData={formData}
          handleChange={handleChange}
          errors={errors}
        />
        
        <FormSectionAidant 
          formData={formData}
          handleChange={handleChange}
          errors={errors}
          seniors={seniors}
          isLoading={isFetchingSeniors}
        />
        
        <FormSectionNotes 
          formData={formData}
          handleChange={handleChange}
        />
        
        <div className="add-actions">
          <button 
            type="button" 
            className="add-btn add-btn-cancel" 
            onClick={() => router.back()}
            disabled={isLoading}
          >
            <i className="fas fa-times"></i> Annuler
          </button>
          
          <button 
            type="submit" 
            className={`add-btn add-btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            <i className="fas fa-save"></i> {isLoading ? 'Création en cours...' : 'Créer l\'usager'}
          </button>
        </div>
      </form>
      
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={closeNotification}
        position="fixed"
      />
    </div>
  );
}