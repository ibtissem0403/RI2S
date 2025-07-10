import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BeneficiaireExperimentation, CibleExperimentation, StatutCible } from '../../types/models';
import { beneficiaireService } from '../../services/beneficiaireService';
import './beneficiaireTable.css';

interface BeneficiaireTableProps {
  beneficiaires: BeneficiaireExperimentation[];
  cibles: CibleExperimentation[];
  experimentationId: string;
  onRefresh: () => Promise<void>;
}

const BeneficiaireTable: React.FC<BeneficiaireTableProps> = ({
  beneficiaires,
  cibles,
  experimentationId,
  onRefresh
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCible, setSelectedCible] = useState<string>('');
  const [selectedStatut, setSelectedStatut] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // État pour le changement de statut
  const [isChangingStatut, setIsChangingStatut] = useState(false);
  const [beneficiaireToUpdate, setBeneficiaireToUpdate] = useState<string | null>(null);
  const [nouveauStatutId, setNouveauStatutId] = useState<string>('');
  const [noteChangement, setNoteChangement] = useState<string>('');

  // Filtrer les bénéficiaires
  const filteredBeneficiaires = beneficiaires.filter(b => {
    const usagerName = typeof b.usager === 'object' 
      ? `${b.usager.firstName || ''} ${b.usager.fullName || ''}`.toLowerCase()
      : '';
    
    const matchesSearch = searchTerm === '' || usagerName.includes(searchTerm.toLowerCase());
    const matchesCible = selectedCible === '' || 
      (typeof b.cible === 'object' ? b.cible._id === selectedCible : b.cible === selectedCible);
    const matchesStatut = selectedStatut === '' || 
      (typeof b.statut === 'object' ? b.statut._id === selectedStatut : b.statut === selectedStatut);
    
    return matchesSearch && matchesCible && matchesStatut;
  });

  // Obtenir les statuts pour une cible spécifique
  const getStatutsForCible = (cibleId: string) => {
    const cible = cibles.find(c => c._id === cibleId);
    return cible?.statuts || [];
  };

  // Formater une date en français
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Ouvrir le modal de changement de statut
  const openChangeStatutModal = (beneficiaireId: string, cibleId: string) => {
    setBeneficiaireToUpdate(beneficiaireId);
    setIsChangingStatut(true);
    setNouveauStatutId('');
    setNoteChangement('');
  };

  // Changer le statut d'un bénéficiaire
  const handleChangeStatut = async () => {
    if (!beneficiaireToUpdate || !nouveauStatutId) return;
    
    try {
      setIsLoading(true);
      
      await beneficiaireService.changerStatut(beneficiaireToUpdate, {
        nouveauStatutId,
        note: noteChangement,
        valeurs_champs: {} // À implémenter: formulaire dynamique pour les champs du nouveau statut
      });
      
      setSuccess('Statut mis à jour avec succès');
      setIsChangingStatut(false);
      setBeneficiaireToUpdate(null);
      
      // Rafraîchir la liste
      await onRefresh();
    } catch (err: any) {
      setError('Erreur lors du changement de statut: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  };

  // Voir les détails d'un bénéficiaire
  const viewBeneficiaire = (beneficiaireId: string) => {
    router.push(`/beneficiaires/${beneficiaireId}`);
  };

  // Récupérer le nom du bénéficiaire à mettre à jour
  const getBeneficiaireToUpdateName = () => {
    if (!beneficiaireToUpdate) return "";
    
    const beneficiaire = beneficiaires.find(b => b._id === beneficiaireToUpdate);
    if (!beneficiaire) return "";
    
    const usager = typeof beneficiaire.usager === 'object' ? beneficiaire.usager : null;
    return usager ? `${usager.firstName} ${usager.fullName}` : 'Bénéficiaire';
  };

  return (
    <div className="benef-table-container">
      {/* Messages */}
      {error && (
        <div className="exp-alert exp-alert-error">
          <div className="exp-alert-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="exp-alert-content">
            <div className="exp-alert-title">Erreur</div>
            <div className="exp-alert-message">{error}</div>
          </div>
          <button 
            className="exp-alert-close"
            onClick={() => setError(null)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {success && (
        <div className="exp-alert exp-alert-success">
          <div className="exp-alert-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="exp-alert-content">
            <div className="exp-alert-title">Succès</div>
            <div className="exp-alert-message">{success}</div>
          </div>
          <button 
            className="exp-alert-close"
            onClick={() => setSuccess(null)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* Section des filtres améliorée */}
      <div className="exp-card filter-card">
        <div className="filter-card-header">
          <div className="filter-card-title">
            <i className="fas fa-filter"></i>
            Filtrer les bénéficiaires
          </div>
        </div>
        <div className="exp-card-content">
          <div className="filter-grid">
            <div className="filter-item">
              <div className="filter-label">
                <i className="fas fa-search"></i>
                Rechercher par nom
              </div>
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Nom du bénéficiaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="filter-clear-btn" onClick={() => setSearchTerm('')}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <div className="filter-label">
                <i className="fas fa-bullseye"></i>
                Filtrer par cible
              </div>
              <div className="filter-select-wrapper">
                <select
                  className="filter-select"
                  value={selectedCible}
                  onChange={(e) => {
                    setSelectedCible(e.target.value);
                    setSelectedStatut('');
                  }}
                >
                  <option value="">Toutes les cibles</option>
                  {cibles.map(cible => (
                    <option key={cible._id} value={cible._id}>
                      {cible.nom_cible}
                    </option>
                  ))}
                </select>
                <div className="filter-select-icon">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
            
            <div className="filter-item">
              <div className="filter-label">
                <i className="fas fa-flag"></i>
                Filtrer par statut
              </div>
              <div className="filter-select-wrapper">
                <select
                  className="filter-select"
                  value={selectedStatut}
                  onChange={(e) => setSelectedStatut(e.target.value)}
                  disabled={!selectedCible}
                >
                  <option value="">Tous les statuts</option>
                  {selectedCible && 
                    getStatutsForCible(selectedCible).map(statut => (
                      <option key={statut._id} value={statut._id}>
                        {statut.nom_statut}
                      </option>
                    ))
                  }
                </select>
                <div className="filter-select-icon">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </div>
          
          {/* Boutons de filtres actifs et réinitialisation - optionnel */}
          {(searchTerm || selectedCible || selectedStatut) && (
            <div className="filter-actions">
              <div className="active-filters">
                {searchTerm && (
                  <div className="active-filter">
                    <span>Nom: {searchTerm}</span>
                    <button onClick={() => setSearchTerm('')}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
                {selectedCible && (
                  <div className="active-filter">
                    <span>Cible: {cibles.find(c => c._id === selectedCible)?.nom_cible || selectedCible}</span>
                    <button onClick={() => {
                      setSelectedCible('');
                      setSelectedStatut('');
                    }}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
                {selectedStatut && (
                  <div className="active-filter">
                    <span>Statut: {getStatutsForCible(selectedCible).find(s => s._id === selectedStatut)?.nom_statut || selectedStatut}</span>
                    <button onClick={() => setSelectedStatut('')}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
              <button 
                className="reset-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCible('');
                  setSelectedStatut('');
                }}
              >
                <i className="fas fa-undo"></i>
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Liste des bénéficiaires */}
      {filteredBeneficiaires.length > 0 ? (
        <div className="exp-card">
          <div className="exp-card-header">
            <div className="exp-card-title">
              <i className="fas fa-users"></i>
              Liste des bénéficiaires ({filteredBeneficiaires.length})
            </div>
          </div>
          <div className="exp-card-content p-0">
            <div className="benef-table-wrapper">
              <table className="benef-table">
                <thead>
                  <tr>
                    <th>
                      <div className="benef-table-header">
                        <i className="fas fa-user"></i>
                        <span>Bénéficiaire</span>
                      </div>
                    </th>
                    <th>
                      <div className="benef-table-header">
                        <i className="fas fa-bullseye"></i>
                        <span>Cible</span>
                      </div>
                    </th>
                    <th>
                      <div className="benef-table-header">
                        <i className="fas fa-flag"></i>
                        <span>Statut</span>
                      </div>
                    </th>
                    <th>
                      <div className="benef-table-header">
                        <i className="fas fa-calendar-plus"></i>
                        <span>Date de rattachement</span>
                      </div>
                    </th>
                    <th className="text-right">
                      <div className="benef-table-header justify-end">
                        <i className="fas fa-cog"></i>
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBeneficiaires.map((beneficiaire) => {
                    const usager = typeof beneficiaire.usager === 'object' ? beneficiaire.usager : null;
                    const cible = typeof beneficiaire.cible === 'object' ? beneficiaire.cible : null;
                    const statut = typeof beneficiaire.statut === 'object' ? beneficiaire.statut : null;
                    
                    return (
                      <tr key={beneficiaire._id} className="benef-table-row">
                        <td>
                          <div className="benef-user-cell">
                            <div className="benef-avatar">
                              {usager ? (usager.firstName?.charAt(0) || '') + (usager.fullName?.charAt(0) || '') : '?'}
                            </div>
                            <div>
                              <div className="benef-name">
                                {usager ? `${usager.firstName} ${usager.fullName}` : 'Inconnu'}
                              </div>
                              <div className="benef-id">
                                ID: {beneficiaire._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="benef-cible">
                            <i className="fas fa-users"></i>
                            <div>
                              <div className="benef-cible-name">{cible?.nom_cible || 'Inconnue'}</div>
                              {cible?.code_cible && (
                                <div className="benef-cible-code">Code: {cible.code_cible}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`benef-status ${
                            statut?.nom_statut?.toLowerCase().includes('terminé') || 
                            statut?.nom_statut?.toLowerCase().includes('archivé') 
                              ? 'benef-status-warning' 
                              : statut?.nom_statut?.toLowerCase().includes('actif') 
                                ? 'benef-status-success' 
                                : 'benef-status-info'
                          }`}>
                            <i className={`fas ${
                              statut?.nom_statut?.toLowerCase().includes('terminé') || 
                              statut?.nom_statut?.toLowerCase().includes('archivé')
                                ? 'fa-check-circle' 
                                : statut?.nom_statut?.toLowerCase().includes('actif')
                                  ? 'fa-play-circle'
                                  : 'fa-circle-info'
                            }`}></i>
                            {statut?.nom_statut || 'Inconnu'}
                          </div>
                        </td>
                        <td>
                          <div className="benef-date">
                            <i className="fas fa-calendar-day"></i>
                            {formatDate(beneficiaire.date_rattachement)}
                          </div>
                        </td>
                        <td>
                          <div className="benef-actions">
                            <button 
                              className="exp-btn exp-btn-outline benef-btn"
                              onClick={() => openChangeStatutModal(beneficiaire._id, typeof beneficiaire.cible === 'string' ? beneficiaire.cible : beneficiaire.cible._id)}
                            >
                              <i className="fas fa-exchange-alt"></i>
                              <span>Changer statut</span>
                            </button>
                            <button 
                              className="exp-btn exp-btn-primary benef-btn"
                              onClick={() => viewBeneficiaire(beneficiaire._id)}
                            >
                              <i className="fas fa-eye"></i>
                              <span>Voir détails</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="benef-empty-state">
          <div className="benef-empty-icon">
            <i className="fas fa-users-slash"></i>
          </div>
          <h3>Aucun bénéficiaire trouvé</h3>
          <p>
            Il n'y a pas encore de bénéficiaires pour cette expérimentation ou aucun ne correspond aux filtres appliqués.
          </p>
          <button 
            className="exp-btn exp-btn-primary"
            onClick={() => router.push(`/beneficiaires/associate?experimentationId=${experimentationId}`)}
          >
            <i className="fas fa-user-plus"></i>
            Ajouter un bénéficiaire
          </button>
        </div>
      )}
      
      {/* Modal pour changer le statut */}
      {isChangingStatut && beneficiaireToUpdate && (
        <>
          <div className="benef-modal-backdrop" onClick={() => {
            setIsChangingStatut(false);
            setBeneficiaireToUpdate(null);
          }}></div>
          <div className="benef-modal">
            <div className="benef-modal-header">
              <h3>
                <i className="fas fa-exchange-alt"></i>
                Changer le statut de {getBeneficiaireToUpdateName()}
              </h3>
              <button 
                className="benef-modal-close"
                onClick={() => {
                  setIsChangingStatut(false);
                  setBeneficiaireToUpdate(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="benef-modal-body">
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-flag"></i>
                  Nouveau statut
                  <span className="text-danger-color">*</span>
                </div>
                <select
                  className="exp-field-select"
                  value={nouveauStatutId}
                  onChange={(e) => setNouveauStatutId(e.target.value)}
                  required
                >
                  <option value="" disabled>Sélectionnez un nouveau statut</option>
                  {beneficiaires
                    .filter(b => b._id === beneficiaireToUpdate)
                    .flatMap(b => {
                      const cibleId = typeof b.cible === 'object' ? b.cible._id : b.cible;
                      const cible = cibles.find(c => c._id === cibleId);
                      return cible?.statuts 
                        ? cible.statuts
                            .filter(s => s._id !== (typeof b.statut === 'object' ? b.statut._id : b.statut))
                            .map(s => ({ value: s._id, label: s.nom_statut })) 
                        : [];
                    })
                    .map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-sticky-note"></i>
                  Note (optionnelle)
                </div>
                <textarea
                  className="exp-field-textarea"
                  value={noteChangement}
                  onChange={(e) => setNoteChangement(e.target.value)}
                  placeholder="Ajoutez une note expliquant le changement de statut..."
                  rows={4}
                ></textarea>
              </div>
            </div>
            
            <div className="benef-modal-footer">
              <button 
                className="exp-btn exp-btn-outline"
                onClick={() => {
                  setIsChangingStatut(false);
                  setBeneficiaireToUpdate(null);
                }}
              >
                <i className="fas fa-times"></i>
                Annuler
              </button>
              
              <button 
                className="exp-btn exp-btn-primary"
                onClick={handleChangeStatut}
                disabled={!nouveauStatutId || isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Traitement...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BeneficiaireTable;