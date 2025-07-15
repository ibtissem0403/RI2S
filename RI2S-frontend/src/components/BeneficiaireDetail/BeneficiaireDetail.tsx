'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import DashboardLayout from '@/components/DashboardLayout';
import './BeneficiaireDetail.css';

// Types pour les modèles
interface UsagerRI2S {
  _id: string;
  fullName: string;
  firstName: string;
  pseudoId: string;
  dossierNumber: string;
  email?: string;
  phone?: string;
  type_usager: 'pro' | 'non_pro';
  role: string;
  specialite?: string;
  notes?: string;
  codePostal?: string;
  dateNaissance?: string;
  lien_avec_senior?: string;
  createdAt?: string;
  pseudo?: {
    pseudoId: string;
    pseudoName: string;
    dossierNumber: string;
    inclusionDate: string;
    status: 'Actif' | 'Sorti' | 'Suspendu';
  };
}

interface HistoriqueStatut {
  statut: {
    _id: string;
    nom_statut: string;
  };
  date_changement: string;
  note?: string;
}

interface BeneficiaireExperimentation {
  _id: string;
  usager: UsagerRI2S;
  experimentation: {
    _id: string;
    name: string;
    code: string;
    description?: string;
  };
  cible: {
    _id: string;
    nom_cible: string;
    code_cible?: string;
  };
  statut: {
    _id: string;
    nom_statut: string;
  };
  date_rattachement?: string;
  historique_statuts: HistoriqueStatut[];
}

interface ChampStatut {
  _id: string;
  nom_champ: string;
  type_champ: string;
  options?: string[];
  obligatoire: boolean;
  description?: string;
}

interface ChampCommun {
  _id: string;
  nom_champ: string;
  type_champ: string;
  options?: string[];
  obligatoire: boolean;
  description?: string;
}

interface ValeurChampStatut {
  _id: string;
  beneficiaire: string;
  champ?: {
    _id: string;
    nom_champ: string;
    type_champ: string;
  };
  champ_commun?: {
    _id: string;
    nom_champ: string;
    type_champ: string;
  };
  valeur: any;
}

interface BeneficiaireDetailData {
  beneficiaire: BeneficiaireExperimentation;
  valeursChamps: ValeurChampStatut[];
  valeursChampCommuns: ValeurChampStatut[];
}

interface BeneficiaireDetailProps {
  beneficiaireId: string;
}

const BeneficiaireDetail: React.FC<BeneficiaireDetailProps> = ({ beneficiaireId }) => {
  const router = useRouter();
  
  // Debug logs pour vérifier l'ID reçu
  console.log("Composant BeneficiaireDetail - ID reçu:", beneficiaireId);
  console.log("Composant BeneficiaireDetail - Type de l'ID:", typeof beneficiaireId);
  
  const [beneficiaireData, setBeneficiaireData] = useState<BeneficiaireDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'infos' | 'champs' | 'historique'>('infos');
  
  // État pour gérer la mise à jour du statut
  const [isChangingStatut, setIsChangingStatut] = useState(false);
  const [nouveauStatutId, setNouveauStatutId] = useState('');
  const [noteChangement, setNoteChangement] = useState('');
  const [statutsDisponibles, setStatutsDisponibles] = useState<Array<{_id: string, nom_statut: string}>>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Notification
  const [notification, setNotification] = useState<{
    type: string;
    message: string;
    isVisible: boolean;
  }>({
    type: '',
    message: '',
    isVisible: false
  });

  useEffect(() => {
    console.log("Composant BeneficiaireDetail - useEffect déclenché avec ID:", beneficiaireId);
    
    // Vérification explicite du type et de la valeur
    if (typeof beneficiaireId !== 'string') {
      console.error("L'ID du bénéficiaire n'est pas une chaîne de caractères:", beneficiaireId);
      setError(`ID du bénéficiaire invalide: type ${typeof beneficiaireId}`);
      setIsLoading(false);
      return;
    }
    
    if (!beneficiaireId || beneficiaireId === 'undefined' || beneficiaireId.trim() === '') {
      console.error("L'ID du bénéficiaire est vide ou 'undefined':", beneficiaireId);
      setError("ID du bénéficiaire manquant ou invalide");
      setIsLoading(false);
      return;
    }
    
    // ID valide, charger les données
    console.log("ID valide, chargement des données...");
    fetchBeneficiaireDetails();
  }, [beneficiaireId]);

  const fetchBeneficiaireDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      console.log(`Récupération des détails pour le bénéficiaire ID: ${beneficiaireId}`);
      console.log(`Type de l'ID: ${typeof beneficiaireId}`);
      
      // Nettoyage de l'ID pour s'assurer qu'il est valide
      const cleanId = String(beneficiaireId).trim();
      console.log(`ID nettoyé: ${cleanId}`);
      
      // S'assurer que l'URL est correcte et inclut l'ID
      const url = `http://localhost:5000/api/ri2s/beneficiaires/${cleanId}/complet`;
      console.log("URL de l'API appelée:", url);
      
      const response = await axios.get<BeneficiaireDetailData>(
        url,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Réponse de l'API:", response.data);
      
      setBeneficiaireData(response.data);
      
      // Récupérer les statuts disponibles pour cette cible
      if (response.data.beneficiaire.cible) {
        const cibleId = typeof response.data.beneficiaire.cible === 'object' 
          ? response.data.beneficiaire.cible._id 
          : response.data.beneficiaire.cible;
        
        const statutsResponse = await axios.get(
          `http://localhost:5000/api/ri2s/cibles/${cibleId}/statuts`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setStatutsDisponibles(statutsResponse.data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des détails:', err);
      if (axios.isAxiosError(err)) {
        const statusCode = err.response?.status;
        const responseData = err.response?.data;
        console.error(`Erreur HTTP ${statusCode}:`, responseData);
        setError(`Erreur ${statusCode}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeStatut = async () => {
    if (!nouveauStatutId) {
      showNotification('error', 'Veuillez sélectionner un nouveau statut');
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      await axios.put(
        `http://localhost:5000/api/ri2s/beneficiaires/${beneficiaireId}/statut`,
        {
          nouveauStatutId,
          note: noteChangement
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Rafraîchir les données
      await fetchBeneficiaireDetails();
      
      // Fermer le modal
      setIsChangingStatut(false);
      setNouveauStatutId('');
      setNoteChangement('');
      
      showNotification('success', 'Statut mis à jour avec succès');
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      showNotification('error', 'Erreur lors du changement de statut');
    } finally {
      setIsUpdating(false);
    }
  };

  const showNotification = (type: string, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true
    });
    
    // Masquer la notification après 5 secondes
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderValeurChamp = (valeur: ValeurChampStatut) => {
    const champInfo = valeur.champ || valeur.champ_commun;
    if (!champInfo) return 'N/A';
    
    const { type_champ } = champInfo;
    
    switch (type_champ) {
      case 'date':
        return formatDate(valeur.valeur);
      case 'fichier':
        return valeur.valeur ? (
          <a href={valeur.valeur} target="_blank" rel="noopener noreferrer" className="benef-file-link">
            <i className="fas fa-file-download"></i> Télécharger
          </a>
        ) : 'Aucun fichier';
      case 'liste':
        return valeur.valeur || 'Non spécifié';
      case 'nombre':
        return valeur.valeur || '0';
      case 'texte':
      default:
        return valeur.valeur || 'N/A';
    }
  };

  const getBreadcrumbItems = () => {
    if (!beneficiaireData) return [
      { label: 'Accueil', href: '/index' },
      { label: 'Bénéficiaires', href: '/beneficiaires' },
      { label: 'Détails du bénéficiaire', isCurrentPage: true }
    ];
    
    const experimentation = beneficiaireData.beneficiaire.experimentation;
    const expName = typeof experimentation === 'object' ? experimentation.name : 'Expérimentation';
    const expId = typeof experimentation === 'object' ? experimentation._id : experimentation;
    
    return [
      { label: 'Accueil', href: '/index' },
      { label: 'Expérimentations', href: '/experimentations' },
      { label: expName, href: `/experimentations/${expId}` },
      { label: 'Bénéficiaires', href: `/experimentations/${expId}?tab=beneficiaires` },
      { label: 'Détails du bénéficiaire', isCurrentPage: true }
    ];
  };

  const getStatusColorClass = (status: string) => {
    status = status.toLowerCase();
    if (status.includes('actif') || status.includes('en cours')) return 'benef-status-active';
    if (status.includes('termin') || status.includes('archiv')) return 'benef-status-completed';
    if (status.includes('suspendu') || status.includes('pause')) return 'benef-status-suspended';
    return 'benef-status-default';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="benef-detail-loading">
          <div className="benef-detail-spinner"></div>
          <p>Chargement des détails du bénéficiaire...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !beneficiaireData) {
    return (
      <DashboardLayout>
        <div className="benef-detail-error">
          <div className="benef-detail-error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Erreur lors du chargement des détails</h3>
          <p>{error || "Données du bénéficiaire non disponibles"}</p>
          <button 
            onClick={() => router.back()}
            className="benef-detail-back-btn"
          >
            <i className="fas fa-arrow-left"></i> Retour
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { beneficiaire, valeursChamps, valeursChampCommuns } = beneficiaireData;
  const usager = beneficiaire.usager;
  const pseudo = usager.pseudo;

  return (
    <DashboardLayout>
      <div className="benef-detail-container">
        <div className="breadcrumbs-container">
          <Breadcrumbs items={getBreadcrumbItems()} />
        </div>

        <div className="benef-detail-header">
          <div className="benef-detail-title-section">
            <h1 className="benef-detail-title">
              <i className="fas fa-user"></i>
              {`${usager.pseudoId}`}
            </h1>
          </div>
          
          <div className="benef-detail-actions">
            <button 
              className="benef-detail-btn benef-detail-btn-secondary"
              onClick={() => router.back()}
            >
              <i className="fas fa-arrow-left"></i>
              Retour
            </button>
            
          </div>
        </div>

        <div className="benef-detail-tabs">
          <button
            className={`benef-detail-tab ${activeTab === 'infos' ? 'active' : ''}`}
            onClick={() => setActiveTab('infos')}
          >
            <i className="fas fa-info-circle"></i>
            Informations générales
          </button>
          <button
            className={`benef-detail-tab ${activeTab === 'champs' ? 'active' : ''}`}
            onClick={() => setActiveTab('champs')}
          >
            <i className="fas fa-list-ul"></i>
            Champs spécifiques
          </button>
          <button
            className={`benef-detail-tab ${activeTab === 'historique' ? 'active' : ''}`}
            onClick={() => setActiveTab('historique')}
          >
            <i className="fas fa-history"></i>
            Historique des statuts
          </button>
        </div>

        <div className="benef-detail-content">
          {activeTab === 'infos' && (
            <div className="benef-detail-info-grid">
              <div className="benef-detail-card">
                <div className="benef-detail-card-header">
                  <h3>
                    <i className="fas fa-user-circle"></i>
                    Informations du bénéficiaire
                  </h3>
                </div>
                <div className="benef-detail-card-content">
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Pseudonyme</span>
                    <span className="benef-detail-info-value">{usager.pseudoId || 'Non pseudonymisé'}</span>
                  </div>
    
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Email</span>
                    <span className="benef-detail-info-value">{usager.email || 'Non renseigné'}</span>
                  </div>
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Téléphone</span>
                    <span className="benef-detail-info-value">{usager.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Type d'usager</span>
                    <span className="benef-detail-info-value">
                      {usager.type_usager === 'pro' ? 'Professionnel' : 'Non professionnel'}
                    </span>
                  </div>
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Rôle</span>
                    <span className="benef-detail-info-value">{usager.role}</span>
                  </div>
                  {usager.specialite && (
                    <div className="benef-detail-info-row">
                      <span className="benef-detail-info-label">Spécialité</span>
                      <span className="benef-detail-info-value">{usager.specialite}</span>
                    </div>
                  )}
                  {usager.codePostal && (
                    <div className="benef-detail-info-row">
                      <span className="benef-detail-info-label">Code postal</span>
                      <span className="benef-detail-info-value">{usager.codePostal}</span>
                    </div>
                  )}
                  {usager.dateNaissance && (
                    <div className="benef-detail-info-row">
                      <span className="benef-detail-info-label">Date de naissance</span>
                      <span className="benef-detail-info-value">{formatDate(usager.dateNaissance)}</span>
                    </div>
                  )}
                  {usager.lien_avec_senior && (
                    <div className="benef-detail-info-row">
                      <span className="benef-detail-info-label">Lien avec senior</span>
                      <span className="benef-detail-info-value">{usager.lien_avec_senior}</span>
                    </div>
                  )}
                  {usager.notes && (
                    <div className="benef-detail-info-row benef-detail-notes">
                      <span className="benef-detail-info-label">Notes</span>
                      <span className="benef-detail-info-value">{usager.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="benef-detail-card">
                <div className="benef-detail-card-header">
                  <h3>
                    <i className="fas fa-flask"></i>
                    Détails de l'expérimentation
                  </h3>
                </div>
                <div className="benef-detail-card-content">
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Expérimentation</span>
                    <span className="benef-detail-info-value">
                      {typeof beneficiaire.experimentation === 'object' 
                        ? beneficiaire.experimentation.name 
                        : 'Non spécifié'}
                    </span>
                  </div>
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Code</span>
                    <span className="benef-detail-info-value">
                      {typeof beneficiaire.experimentation === 'object' 
                        ? beneficiaire.experimentation.code 
                        : 'Non spécifié'}
                    </span>
                  </div>
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Cible</span>
                    <span className="benef-detail-info-value">
                      {typeof beneficiaire.cible === 'object' 
                        ? beneficiaire.cible.nom_cible 
                        : 'Non spécifié'}
                    </span>
                  </div>
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Statut actuel</span>
                    <span className={`benef-detail-info-value benef-detail-current-status ${
                      typeof beneficiaire.statut === 'object' 
                        ? getStatusColorClass(beneficiaire.statut.nom_statut) 
                        : ''
                    }`}>
                      {typeof beneficiaire.statut === 'object' 
                        ? beneficiaire.statut.nom_statut 
                        : 'Non spécifié'}
                    </span>
                  </div>
                  <div className="benef-detail-info-row">
                    <span className="benef-detail-info-label">Date de rattachement</span>
                    <span className="benef-detail-info-value">
                      {beneficiaire.date_rattachement 
                        ? formatDate(beneficiaire.date_rattachement) 
                        : 'Non spécifié'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'champs' && (
            <div className="benef-detail-champs">
              {valeursChampCommuns.length > 0 && (
                <div className="benef-detail-card benef-detail-communs">
                  <div className="benef-detail-card-header">
                    <h3>
                      <i className="fas fa-layer-group"></i>
                      Champs communs
                    </h3>
                  </div>
                  <div className="benef-detail-card-content">
                    <div className="benef-detail-champs-grid">
                      {valeursChampCommuns.map(valeur => (
                        <div key={valeur._id} className="benef-detail-champ">
                          <div className="benef-detail-champ-name">
                            {valeur.champ_commun?.nom_champ || 'Champ sans nom'}
                          </div>
                          <div className="benef-detail-champ-value">
                            {renderValeurChamp(valeur)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {valeursChamps.length > 0 && (
                <div className="benef-detail-card benef-detail-statut-champs">
                  <div className="benef-detail-card-header">
                    <h3>
                      <i className="fas fa-clipboard-list"></i>
                      Champs spécifiques du statut
                    </h3>
                  </div>
                  <div className="benef-detail-card-content">
                    <div className="benef-detail-champs-grid">
                      {valeursChamps.map(valeur => (
                        <div key={valeur._id} className="benef-detail-champ">
                          <div className="benef-detail-champ-name">
                            {valeur.champ?.nom_champ || 'Champ sans nom'}
                          </div>
                          <div className="benef-detail-champ-value">
                            {renderValeurChamp(valeur)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {valeursChamps.length === 0 && valeursChampCommuns.length === 0 && (
                <div className="benef-detail-empty">
                  <div className="benef-detail-empty-icon">
                    <i className="fas fa-clipboard"></i>
                  </div>
                  <h3>Aucun champ renseigné</h3>
                  <p>Ce bénéficiaire n'a pas de champs spécifiques ou communs renseignés.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'historique' && (
            <div className="benef-detail-card">
              <div className="benef-detail-card-header">
                <h3>
                  <i className="fas fa-history"></i>
                  Historique des statuts
                </h3>
              </div>
              <div className="benef-detail-card-content">
                {beneficiaire.historique_statuts && beneficiaire.historique_statuts.length > 0 ? (
                  <div className="benef-detail-timeline">
                    {beneficiaire.historique_statuts.map((historique, index) => (
                      <div key={index} className="benef-detail-timeline-item">
                        <div className="benef-detail-timeline-point"></div>
                        <div className="benef-detail-timeline-content">
                          <div className="benef-detail-timeline-date">
                            {formatDate(historique.date_changement)}
                          </div>
                          <div className={`benef-detail-timeline-status ${
                            getStatusColorClass(historique.statut.nom_statut)
                          }`}>
                            {historique.statut.nom_statut}
                          </div>
                          {historique.note && (
                            <div className="benef-detail-timeline-note">
                              <i className="fas fa-quote-left"></i>
                              {historique.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="benef-detail-empty">
                    <div className="benef-detail-empty-icon">
                      <i className="fas fa-history"></i>
                    </div>
                    <h3>Aucun historique</h3>
                    <p>Aucun changement de statut n'a été enregistré pour ce bénéficiaire.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de changement de statut */}
      {isChangingStatut && (
        <div className="benef-detail-modal-overlay">
          <div className="benef-detail-modal">
            <div className="benef-detail-modal-header">
              <h3>
                <i className="fas fa-exchange-alt"></i>
                Changer le statut du bénéficiaire
              </h3>
              <button 
                className="benef-detail-modal-close" 
                onClick={() => setIsChangingStatut(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="benef-detail-modal-content">
              <div className="benef-detail-form-group">
                <label htmlFor="nouveau-statut">Nouveau statut</label>
                <select
                  id="nouveau-statut"
                  value={nouveauStatutId}
                  onChange={(e) => setNouveauStatutId(e.target.value)}
                  className="benef-detail-select"
                  required
                >
                  <option value="">Sélectionner un statut</option>
                  {statutsDisponibles.map(statut => (
                    <option key={statut._id} value={statut._id}>
                      {statut.nom_statut}
                    </option>
                  ))}
                </select>
              </div>
              <div className="benef-detail-form-group">
                <label htmlFor="note-changement">Note (optionnelle)</label>
                <textarea
                  id="note-changement"
                  value={noteChangement}
                  onChange={(e) => setNoteChangement(e.target.value)}
                  className="benef-detail-textarea"
                  placeholder="Ajouter une note concernant ce changement de statut..."
                  rows={4}
                ></textarea>
              </div>
            </div>
            <div className="benef-detail-modal-footer">
              <button 
                className="benef-detail-btn benef-detail-btn-secondary"
                onClick={() => setIsChangingStatut(false)}
                disabled={isUpdating}
              >
                Annuler
              </button>
              <button 
                className="benef-detail-btn benef-detail-btn-primary"
                onClick={handleChangeStatut}
                disabled={!nouveauStatutId || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="benef-detail-btn-spinner"></div>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.isVisible && (
        <div className={`benef-detail-notification ${notification.type} ${notification.isVisible ? '' : 'hidden'}`}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
          <span>{notification.message}</span>
          <button 
            onClick={closeNotification}
            className="benef-detail-notification-close"
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}

export default BeneficiaireDetail;