'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./BeneficiariesList.css";
import DashboardLayout from "../DashboardLayout";
import Breadcrumbs from "../Breadcrumbs/Breadcrumbs";
import UsagerRI2SStatsDashboard from "@/components/UsagerRI2SStats/UsagerRI2SStatsDashboard";
import '@fortawesome/fontawesome-free/css/all.min.css';

// Ajout du CSS pour le bouton et la section des statistiques
const additionalStyles = `
  .stats-toggle-container {
    margin-bottom: 1.5rem;
  }
  
  .ri2s-stats-toggle {
    background-color: white;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
    overflow: hidden;
  }

  .ri2s-stats-toggle-btn {
    width: 100%;
    padding: 1rem;
    border: none;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .ri2s-stats-toggle-btn:hover {
    background-color: #f8f9fa;
  }

  .ri2s-stats-toggle-btn.active {
    background-color: #4a9540;
    color: white;
  }

  .ri2s-stats-toggle-btn i {
    font-size: 1.125rem;
  }
  
  .stats-loading {
    text-align: center;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .stats-loading .bl-spinner {
    margin: 0 auto 1rem;
  }
  
  .stats-error {
    text-align: center;
    padding: 1.5rem;
    background-color: #f8d7da;
    color: #721c24;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #f5c6cb;
  }
  
  .stats-error-title {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .stats-retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #4a9540;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .stats-retry-btn:hover {
    background-color: #3a8a32;
  }
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  
  .stats-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 0.4rem;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #22577a;
    color: white;
  }
  
  .stats-btn:hover {
    background-color: #1a4b6d;
  }
  
  @media (max-width: 768px) {
    .header-actions {
      flex-direction: column;
      width: 100%;
    }
    
    .stats-btn, .header-btn {
      width: 100%;
      justify-content: center;
    }
  }
`;

const breadcrumbItems = [
  { label: 'Accueil', href: '/index' },
  { label: 'Usagers RI2S', isCurrentPage: true }
];

// Interface pour les usagers RI2S
interface UsagerRI2S {
  _id: string;
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  type_usager: "pro" | "non_pro";
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
    status: "Actif" | "Sorti" | "Suspendu";
  };
  experimentations?: Array<{
    nom: string;
    code: string;
    statut: string;
    cible: string;
  }>;
}

// Interface pour filtrer par expérimentation
interface Experimentation {
  _id: string;
  name: string;
  code: string;
}

export default function UsagersRI2SList() {
  const [usagers, setUsagers] = useState<UsagerRI2S[]>([]);
  const [experimentations, setExperimentations] = useState<Experimentation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [experimentationFilter, setExperimentationFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // États pour les statistiques
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  const router = useRouter();

  const fetchUsagers = async () => {
    try {
      setIsLoading(!isRefreshing);
      setError(null);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      const response = await axios.get<UsagerRI2S[]>(
        "http://localhost:5000/api/usagers-ri2s",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsagers(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchExperimentations = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;
      const response = await axios.get<Experimentation[]>(
        "http://localhost:5000/api/experimentations",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExperimentations(response.data);
    } catch (err) {
      console.error("Error fetching experimentations:", err);
    }
  };

  // Fonction pour récupérer les statistiques
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      const response = await axios.get(
        "http://localhost:5000/api/usagers-ri2s-statistiques/generales",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStats(response.data);
    } catch (err) {
      console.error("Statistiques error:", err);
      setStatsError(err instanceof Error ? err.message : "Erreur lors du chargement des statistiques");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsagers();
    fetchExperimentations();
  };

  useEffect(() => {
    fetchUsagers();
    fetchExperimentations();
  }, []);

  // Effet pour charger les statistiques quand on les affiche
  useEffect(() => {
    if (showStats && !stats && !statsLoading) {
      fetchStats();
    }
  }, [showStats, stats, statsLoading]);

  const filteredUsagers = usagers.filter((u) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      (u.pseudo?.pseudoName && u.pseudo.pseudoName.toLowerCase().includes(searchLower)) ||
      (u.pseudo?.dossierNumber && u.pseudo.dossierNumber.toLowerCase().includes(searchLower)) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.phone.toLowerCase().includes(searchLower);

    const matchesRole =
      roleFilter === "all" ||
      u.role === roleFilter;

    const matchesExperimentation =
      experimentationFilter === "all" ||
      (u.experimentations && u.experimentations.some(exp => exp.code === experimentationFilter));

    return matchesSearch && matchesRole && matchesExperimentation;
  });

  // Calculate total pages whenever filtered data changes
  useEffect(() => {
    const totalPagesCount = Math.max(1, Math.ceil(filteredUsagers.length / itemsPerPage));
    setTotalPages(totalPagesCount);
    
    // If current page is out of range, reset to page 1
    if (currentPage > totalPagesCount) {
      setCurrentPage(1);
    }
  }, [filteredUsagers, itemsPerPage, currentPage]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsagers.slice(indexOfFirstItem, indexOfLastItem);

  const formatDateToYMD = (dateInput: string | Date) => {
    if (!dateInput) return "N/A";
    const date = new Date(dateInput);
    return date.toISOString().split('T')[0];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Actif": return "●";
      case "Sorti": return "◆";
      case "Suspendu": return "■";
      default: return "○";
    }
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'Actif': return 'bl-status-active';
      case 'Sorti': return 'bl-status-exited';
      case 'Suspendu': return 'bl-status-suspended';
      default: return 'bl-status-default';
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: {[key: string]: string} = {
      'médecin': 'Médecin',
      'infirmier': 'Infirmier',
      'pharmacien': 'Pharmacien',
      'kiné': 'Kinésithérapeute',
      'autre_pro': 'Autre professionnel',
      'senior': 'Senior',
      'aidant': 'Aidant'
    };
    
    return roleMap[role] || role;
  };

  const getTypeDisplay = (type: string) => {
    return type === 'pro' ? 'Professionnel' : 'Non professionnel';
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of the list when changing pages
    window.scrollTo(0, 0);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // Toggle les statistiques
  const handleToggleStats = () => {
    setShowStats(!showStats);
    if (!showStats && !stats && !statsLoading) {
      fetchStats();
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Number of page buttons to show
    
    let startPage: number;
    let endPage: number;
    
    if (totalPages <= maxPagesToShow) {
      // If we have less pages than max, show all pages
      startPage = 1;
      endPage = totalPages;
    } else {
      // Calculate start and end pages to show
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
      
      if (currentPage <= maxPagesBeforeCurrentPage) {
        // Near the start
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        // Near the end
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        // In the middle
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const renderMainContent = () => {
    if (isLoading && !isRefreshing) {
      return (
        <div className="bl-loading">
          <div className="bl-spinner"></div>
          <p className="bl-loading-text">Chargement en cours...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bl-error">
          <div className="bl-error-header">
            <div className="bl-error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="bl-error-title">Erreur de chargement</h3>
          </div>
          <p className="bl-error-message">{error}</p>
          <div className="bl-error-actions">
            <button onClick={handleRefresh} className="bl-retry-btn" disabled={isRefreshing}>
              {isRefreshing ? "Actualisation..." : "Réessayer"}
            </button>
            <button onClick={() => router.push("/")} className="bl-home-btn">
              Retour à l'accueil
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="content-container">
        <div className="bl-controls">
          <div className="bl-search-container">
            <div className="bl-search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, email ou pseudonyme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bl-search-input"
            />
          </div>

          <div className="bl-filters">
            <div className="bl-filter-group">
              <label htmlFor="bl-role-filter" className="bl-filter-label">Rôle:</label>
              <select
                id="bl-role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bl-filter-select"
              >
                <option value="all">Tous rôles</option>
                <option value="médecin">Médecin</option>
                <option value="infirmier">Infirmier</option>
                <option value="pharmacien">Pharmacien</option>
                <option value="kiné">Kinésithérapeute</option>
                <option value="autre_pro">Autre professionnel</option>
                <option value="senior">Senior</option>
                <option value="aidant">Aidant</option>
              </select>
            </div>

            {experimentations.length > 0 && (
              <div className="bl-filter-group">
                <label htmlFor="bl-exp-filter" className="bl-filter-label">Expérimentation:</label>
                <select
                  id="bl-exp-filter"
                  value={experimentationFilter}
                  onChange={(e) => setExperimentationFilter(e.target.value)}
                  className="bl-filter-select"
                >
                  <option value="all">Toutes expérimentations</option>
                  {experimentations.map(exp => (
                    <option key={exp._id} value={exp.code}>{exp.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bl-content">
          {filteredUsagers.length > 0 ? (
            <>
              <div className="bl-summary">
                <span className="bl-results-count">
                  {filteredUsagers.length} usager(s) trouvé(s)
                  {filteredUsagers.length > itemsPerPage && 
                    ` - Affichage ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredUsagers.length)} sur ${filteredUsagers.length}`}
                </span>
                <div className="header-actions">
                  <button onClick={handleRefresh} className="header-btn refresh-btn" disabled={isRefreshing}>
                    <span className={`refresh-icon ${isRefreshing ? "spinning" : ""}`}>↻</span>
                    {isRefreshing ? "Actualisation" : "Actualiser"}
                  </button>
                  {/* Ajout du bouton pour afficher les statistiques */}
                  <button onClick={handleToggleStats} className="stats-btn">
                    <i className={`fas ${showStats ? 'fa-chart-bar' : 'fa-chart-line'}`}></i>
                    {showStats ? 'Masquer stats' : 'Afficher stats'}
                  </button>
                  <button onClick={() => router.push("/recrutement")} className="header-btn add-btn">
                    <span className="add-icon">+</span> Nouveau
                  </button>
                </div>
                {(searchQuery || roleFilter !== "all" || experimentationFilter !== "all") && (
                  <button onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                    setExperimentationFilter("all");
                  }} className="bl-clear-filters">
                    <span className="bl-clear-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </span>
                    Effacer les filtres
                  </button>
                )}
              </div>

              {/* Section des statistiques */}
              {showStats && (
                <div className="stats-toggle-container">
                  <div className="ri2s-stats-toggle">
                    <button
                      onClick={handleToggleStats}
                      className={`ri2s-stats-toggle-btn ${showStats ? 'active' : ''}`}
                    >
                      <i className={`fas ${showStats ? 'fa-chart-bar' : 'fa-chart-line'}`}></i>
                      {showStats ? 'Masquer les statistiques' : 'Afficher les statistiques'}
                      <i className={`fas fa-chevron-${showStats ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                  
                  {statsLoading ? (
                    <div className="stats-loading">
                      <div className="bl-spinner"></div>
                      <p>Chargement des statistiques...</p>
                    </div>
                  ) : statsError ? (
                    <div className="stats-error">
                      <div className="stats-error-title">
                        <i className="fas fa-exclamation-triangle"></i>
                        Erreur de chargement des statistiques
                      </div>
                      <p>{statsError}</p>
                      <button
                        onClick={fetchStats}
                        className="stats-retry-btn"
                        disabled={statsLoading}
                      >
                        <i className="fas fa-redo"></i>
                        Réessayer
                      </button>
                    </div>
                  ) : stats ? (
                    <UsagerRI2SStatsDashboard stats={stats} />
                  ) : null}
                </div>
              )}

              {/* Table with responsive container */}
              <div className="bl-table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="bl-col-dossier">№ Dossier</th>
                      <th className="bl-col-pseudo">Pseudonyme</th>
                      <th className="bl-col-contact">Contact</th>
                      <th className="bl-col-role">Rôle</th>
                      <th className="bl-col-date">Date d'ajout</th>
                      <th className="bl-col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((u) => (
                      <tr key={u._id}>
                        <td>{u.pseudo?.dossierNumber || 'N/A'}</td>
                        <td>{u.pseudo?.pseudoName || 'Non pseudonymisé'}</td>
                        <td>{u.email || u.phone || 'N/A'}</td>
                        <td>{getRoleDisplay(u.role)}</td>
                        <td>{u.createdAt ? formatDateToYMD(u.createdAt) : 'N/A'}</td>
                        <td>
                          <div className="bl-actions">
                            <button 
                              onClick={() => router.push(`/beneficiary/${u._id}`)} 
                              className="bl-view-btn" 
                              title="Détails"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              onClick={() => router.push(`/beneficiaire/${u._id}/edit`)} 
                              className="bl-edit-btn" 
                              title="Modifier"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => router.push(`/beneficiaires/associer/${u._id}`)}
                              className="bl-link-btn"
                              title="Associer à une expérimentation"
                            >
                              <i className="fas fa-link"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bl-pagination">
                  <div className="bl-pagination-controls">
                    <button 
                      onClick={() => handlePageChange(1)} 
                      disabled={currentPage === 1}
                      className="bl-pagination-button bl-pagination-first"
                      aria-label="Première page"
                    >
                      ⟪
                    </button>
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1}
                      className="bl-pagination-button bl-pagination-prev"
                      aria-label="Page précédente"
                    >
                      ⟨
                    </button>
                    
                    <div className="bl-pagination-pages">
                      {getPageNumbers().map(number => (
                        <button
                          key={number}
                          onClick={() => handlePageChange(number)}
                          className={`bl-pagination-button ${currentPage === number ? 'bl-pagination-active' : ''}`}
                          aria-label={`Page ${number}`}
                          aria-current={currentPage === number ? 'page' : undefined}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                      className="bl-pagination-button bl-pagination-next"
                      aria-label="Page suivante"
                    >
                      ⟩
                    </button>
                    <button 
                      onClick={() => handlePageChange(totalPages)} 
                      disabled={currentPage === totalPages}
                      className="bl-pagination-button bl-pagination-last"
                      aria-label="Dernière page"
                    >
                      ⟫
                    </button>
                  </div>
                  
                  <div className="bl-pagination-info">
                    <span className="bl-pagination-text">Éléments par page:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={handleItemsPerPageChange}
                      className="bl-pagination-select"
                      aria-label="Nombre d'éléments par page"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bl-empty">
              <div className="bl-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <p className="bl-empty-text">Aucun usager ne correspond aux critères</p>
              {(searchQuery || roleFilter !== "all" || experimentationFilter !== "all") && (
                <button onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setExperimentationFilter("all");
                }} className="bl-reset-filters">
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Utilisation du DashboardLayout pour envelopper le contenu
  return (
    <DashboardLayout>
      <style>{additionalStyles}</style>
      <div className="breadcrumbs-container">
        <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
      </div>
      {renderMainContent()}
    </DashboardLayout>
  );
}