'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import AuthGuard from '@/components/AuthGuard';
import './edit.css';

const breadcrumbItems = [
  { label: 'Accueil', href: '/index' },
  { label: 'Usagers RI2S', href: '/beneficiaires' },
  { label: 'Modifier', isCurrentPage: true }
];

// Types pour les usagers RI2S
type UsagerType = 'pro' | 'non_pro';
type UserRole = 'médecin' | 'infirmier' | 'pharmacien' | 'kiné' | 'autre_pro' | 'senior' | 'aidant';

// Interface pour l'usager RI2S
interface UsagerRI2S {
  _id: string;
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

  // Information de pseudonymisation
  pseudo?: {
    pseudoId: string;
    pseudoName: string;
  }
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

// Type pour les notifications
type NotificationType = 'success' | 'error' | 'info' | 'warning';

export default function EditUsagerRI2S() {
  const router = useRouter();
  const params = useParams();
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    _id: '',
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

  // Utilitaire pour les requêtes authentifiées
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('Session expirée');
    }

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };

    return fetch(url, {
      ...options,
      headers: authHeaders
    });
  };

  // Effet pour charger les seniors quand on en a besoin
  const fetchSeniors = async () => {
    setIsFetchingSeniors(true);
    try {
      const response = await fetchWithAuth('http://localhost:5000/api/usagers-ri2s/seniors-disponibles');
      
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

  // Charger les données de l'usager
  useEffect(() => {
    const fetchUsager = async () => {
      if (!params?.id) return;
      
      try {
        setIsLoading(true);
        const response = await fetchWithAuth(`http://localhost:5000/api/usagers-ri2s/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Usager non trouvé');
        }
        
        const usagerData = await response.json();
        console.log('Données de l\'usager reçues:', usagerData);
        
        // Mise à jour du formulaire
        setFormData({
          ...usagerData,
          dateNaissance: usagerData.dateNaissance ? new Date(usagerData.dateNaissance).toISOString().split('T')[0] : '',
        });
        
        // Si c'est un aidant, charger les seniors disponibles
        if (usagerData.type_usager === 'non_pro' && usagerData.role === 'aidant') {
          fetchSeniors();
        }
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement');
        console.error('Erreur complète:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsager();
  }, [params?.id]);

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
      } else if (value === 'aidant' && !isFetchingSeniors && seniors.length === 0) {
        // Charger les seniors disponibles si c'est un aidant
        fetchSeniors();
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
    
    setIsSubmitting(true);
    closeNotification();
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Votre session a expiré. Veuillez vous reconnecter.');
        setTimeout(() => {
          router.push('/');
        }, 2000);
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/usagers-ri2s/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour de l\'usager');
      }
      
      const data = await response.json();
      
      showNotification('success', `Usager mis à jour avec succès !`);
      
      // Rediriger vers la liste des usagers après un court délai
      setTimeout(() => {
        router.push('/beneficiaires');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('error', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="edit-loading">
      <div className="edit-spinner"></div>
      <p>Chargement...</p>
    </div>
  );

  if (error) return (
    <div className="edit-error">
      <h3>Erreur !</h3>
      <p>{error}</p>
      <button onClick={() => router.back()} className="edit-error-btn">
        Retour
      </button>
    </div>
  );

  return (
    <AuthGuard>
      <div className="edit-container">
        <div className="page-header">
          <div className="breadcrumbs-wrapper">
            <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
          </div>
          <h1 className="edit-title">
            Modifier l'usager 
            {formData.pseudo?.pseudoName ? ` ${formData.pseudo.pseudoName}` : ` ${formData.fullName}`}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-form">
          {/* Section Type d'usager */}
          <div className="form-section">
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
          
          {/* Section Informations personnelles */}
          <div className="form-section">
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
          
          {/* Section Professionnel de santé */}
          {formData.type_usager === 'pro' && (
            <div className="form-section">
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
          )}
          
          {/* Section Senior */}
          {formData.type_usager === 'non_pro' && formData.role === 'senior' && (
            <div className="form-section">
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
          )}
          
          {/* Section Aidant */}
          {formData.type_usager === 'non_pro' && formData.role === 'aidant' && (
            <div className="form-section">
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
                          {senior.pseudo?.pseudoName ? ` ${senior.pseudo.pseudoName}` : `${senior.fullName} ${senior.firstName}`}
                        </option>
                      ))}
                    </select>
                    {errors.lien_avec_senior && <div className="field-error"><i className="fas fa-exclamation-circle"></i> {errors.lien_avec_senior}</div>}
                    {isFetchingSeniors && <div className="loading-text"><i className="fas fa-spinner fa-spin"></i> Chargement des seniors...</div>}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Section Notes */}
          <div className="form-section">
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
          
          {notification.isVisible && (
            <div className={`notification ${notification.type}`}>
              <p>{notification.message}</p>
              <button onClick={closeNotification}>×</button>
            </div>
          )}
          
          <div className="edit-actions">
            <button 
              type="button" 
              className="edit-btn edit-btn-cancel" 
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              <i className="fas fa-times"></i> Annuler
            </button>
            
            <button 
              type="submit" 
              className={`edit-btn edit-btn-primary ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              <i className="fas fa-save"></i> {isSubmitting ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}