"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import styles from "./style.module.css";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";

const breadcrumbItems = [
  { label: "Accueil", href: "/index" },
  { label: "Usagers RI2S", href: "/beneficiaires" },
  { label: "Détails", isCurrentPage: true },
];

export default function UsagerRI2SDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.push("/");
      throw new Error("No authentication token found");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      router.push("/");
      throw new Error("Session expirée. Please login again.");
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Déterminer si on a un ID ou un pseudoId
        const idParam = params.id;
        let apiUrl;

        if (idParam.includes('-')) {
          // Si le format ressemble à un pseudoId (ex: PRO-23-123)
          apiUrl = `http://localhost:5000/api/usagers-ri2s/pseudo/${idParam}`;
        } else {
          // Sinon, considérer comme un ID MongoDB
          apiUrl = `http://localhost:5000/api/usagers-ri2s/${idParam}`;
        }

        const usagerRes = await fetchWithAuth(apiUrl);
        const usagerData = await usagerRes.json();

        // Si l'usager est rattaché à des expérimentations, récupérer ces informations
        let experimentations = [];
        if (usagerData.pseudo && usagerData.pseudo.pseudoId) {
          try {
            const experimentsRes = await fetchWithAuth(
              `http://localhost:5000/api/ri2s/beneficiaires/pseudo/${usagerData.pseudo.pseudoId}/experimentations`
            );
            experimentations = await experimentsRes.json();
          } catch (expError) {
            console.error("Erreur lors de la récupération des expérimentations:", expError);
          }
        }

        setData({
          ...usagerData,
          experimentations
        });
      } catch (err) {
        setError(err.message || "Failed to load usager data");
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/beneficiaire/${params.id}/edit`);
  };

  const handleRattacherExperimentation = () => {
    router.push(`/beneficiaires/associate`);
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Chargement en cours...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button onClick={handleBack} className={styles.backButton}>
              <i className="fas fa-arrow-left"></i>
              Retour
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className={styles.emptyState}>
          <i className="fas fa-user-slash"></i>
          <h3>Aucune donnée disponible</h3>
          <p>Aucune donnée disponible pour cet usager</p>
          <button onClick={handleBack} className={styles.backButton}>
            <i className="fas fa-arrow-left"></i>
            Retour
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Déterminer l'icône et la couleur en fonction du type d'usager
  const getUserTypeIcon = () => {
    if (data.type_usager === 'pro') {
      return 'fas fa-user-md';
    } else if (data.role === 'senior') {
      return 'fas fa-user-shield';
    } else if (data.role === 'aidant') {
      return 'fas fa-hands-helping';
    }
    return 'fas fa-user';
  };

  const getUserTypeClass = () => {
    if (data.type_usager === 'pro') {
      return styles.typePro;
    } else if (data.role === 'senior') {
      return styles.typeSenior;
    } else if (data.role === 'aidant') {
      return styles.typeAidant;
    }
    return '';
  };

  // Formater les rôles et types
  const formatTypeUsager = (type) => {
    switch(type) {
      case 'pro': return 'Professionnel';
      case 'non_pro': return 'Non professionnel';
      default: return type;
    }
  };

  const formatRole = (role) => {
    switch(role) {
      case 'senior': return 'Senior';
      case 'aidant': return 'Aidant';
      case 'medecin': return 'Médecin';
      case 'infirmier': return 'Infirmier';
      case 'pharmacien': return 'Pharmacien';
      default: return role;
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* Header avec breadcrumb */}
        <div className={styles.pageHeader}>
          <div className="breadcrumbs-wrapper">
            <Breadcrumbs items={breadcrumbItems} showBackButton={false} />
          </div>
        </div>

        {/* Profile Header Card */}
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  <img
                    src="/api/placeholder/80/80"
                    alt="Photo de profil"
                    className={styles.avatarImage}
                    onError={(e) => {
                      // Fallback: afficher les initiales
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling.style.display = "flex";
                    }}
                  />
                  <div className={styles.avatarInitials}>
                    {data.fullName ? data.fullName.charAt(0).toUpperCase() : ''}
                    {data.firstName ? data.firstName.charAt(0).toUpperCase() : ''}
                  </div>
                </div>
                <div className={styles.statusBadgeCustom}>
                  <div className={`${styles.typeBadge} ${getUserTypeClass()}`}>
                    <i className={getUserTypeIcon()}></i>
                    {formatRole(data.role)}
                  </div>
                </div>
              </div>
              <div className={styles.profileDetails}>
              <h1 className={styles.profileName}>
  <i className={getUserTypeIcon()}></i>
  {data.pseudo && data.pseudo.pseudoName ? (
    <>
      <span>{data.pseudo.pseudoName}</span>
      <span className={styles.pseudonymizedTag}>

      </span>
    </>
  ) : (
    `${data.fullName} ${data.firstName}`
  )}
</h1>
                <div className={styles.profileMeta}>
                  <span className={styles.metaItem}>
                    <i className="fas fa-envelope"></i>
                    {data.email}
                  </span>
                  <span className={styles.metaItem}>
                    <i className="fas fa-phone"></i>
                    {data.phone}
                  </span>
                  {data.pseudo && (
                    <span className={styles.metaItem}>
                      <i className="fas fa-user-secret"></i>
                      {data.pseudo.pseudoId}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.profileActions}>
              <button onClick={handleEdit} className={styles.editButton}>
                <i className="fas fa-edit"></i>
                Modifier
              </button>
              <button onClick={handleRattacherExperimentation} className={styles.experimentationButton}>
                <i className="fas fa-vial"></i>
                Rattacher à une expérimentation
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "personal" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("personal")}
            >
              <i className="fas fa-user-circle"></i>
              Informations personnelles
            </button>
            {data.type_usager === 'pro' && (
              <button
                className={`${styles.tabButton} ${
                  activeTab === "pro" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("pro")}
              >
                <i className="fas fa-briefcase-medical"></i>
                Informations professionnelles
              </button>
            )}
            {data.role === 'aidant' && (
              <button
                className={`${styles.tabButton} ${
                  activeTab === "aidant" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("aidant")}
              >
                <i className="fas fa-hands-helping"></i>
                Lien avec le senior
              </button>
            )}
            <button
              className={`${styles.tabButton} ${
                activeTab === "experimentations" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("experimentations")}
            >
              <i className="fas fa-vial"></i>
              Expérimentations
              {data.experimentations && data.experimentations.length > 0 && (
                <span className={styles.tabBadge}>
                  {data.experimentations.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {activeTab === "personal" && (
            <div className={styles.contentGrid}>
              <div className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <i className="fas fa-user"></i>
                  <h3>Profil personnel</h3>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.infoItem}>
                    <label>
                      <i className="fas fa-id-badge"></i>
                      Identifiant pseudonymisé
                    </label>
                    <div className={styles.infoValue}>
                      {data.pseudo ? data.pseudo.pseudoId : 'Non pseudonymisé'}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <label>
                      <i className="fas fa-user-tag"></i>
                      Type d'usager
                    </label>
                    <div className={styles.infoValue}>
                      {formatTypeUsager(data.type_usager)}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <label>
                      <i className="fas fa-user-cog"></i>
                      Rôle
                    </label>
                    <div className={styles.infoValue}>
                      {formatRole(data.role)}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <label>
                      <i className="fas fa-envelope"></i>
                      Email
                    </label>
                    <div className={styles.infoValue}>
                      {data.email}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <label>
                      <i className="fas fa-phone"></i>
                      Téléphone
                    </label>
                    <div className={styles.infoValue}>
                      {data.phone}
                    </div>
                  </div>
                  {data.dateNaissance && (
                    <div className={styles.infoItem}>
                      <label>
                        <i className="fas fa-birthday-cake"></i>
                        Date de naissance
                      </label>
                      <div className={styles.infoValue}>
                        {new Date(data.dateNaissance).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <i className="fas fa-clipboard-list"></i>
                  <h3>Informations d'enregistrement</h3>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.infoItem}>
                    <label>
                      <i className="fas fa-calendar-plus"></i>
                      Date de création
                    </label>
                    <div className={styles.infoValue}>
                      {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Non spécifiée'}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <label>
                      <i className="fas fa-user-tie"></i>
                      Créé par
                    </label>
                    <div className={styles.infoValue}>
                      {data.createdBy ? `${data.createdBy.fullName || ''} (${data.createdBy.email || ''})` : 'Non spécifié'}
                    </div>
                  </div>
                  {data.pseudo && (
                    <div className={styles.infoItem}>
                      <label>
                        <i className="fas fa-folder-open"></i>
                        Numéro de dossier
                      </label>
                      <div className={styles.infoValue}>
                        {data.pseudo.dossierNumber || 'Non attribué'}
                      </div>
                    </div>
                  )}
                  {data.pseudo && data.pseudo.inclusionDate && (
                    <div className={styles.infoItem}>
                      <label>
                        <i className="fas fa-calendar-check"></i>
                        Date d'inclusion
                      </label>
                      <div className={styles.infoValue}>
                        {new Date(data.pseudo.inclusionDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "pro" && data.type_usager === 'pro' && (
            <div className={styles.contentGrid}>
              <div className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <i className="fas fa-briefcase-medical"></i>
                  <h3>Informations professionnelles</h3>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.infoItem}>
                    <label>
                      <i className="fas fa-stethoscope"></i>
                      Spécialité
                    </label>
                    <div className={styles.infoValue}>
                      {data.specialite || 'Non spécifiée'}
                    </div>
                  </div>
                  {data.villeExercice && (
                    <div className={styles.infoItem}>
                      <label>
                        <i className="fas fa-city"></i>
                        Ville d'exercice
                      </label>
                      <div className={styles.infoValue}>
                        {data.villeExercice}
                      </div>
                    </div>
                  )}
                  {data.zoneGeographiquePatients && (
                    <div className={styles.infoItem}>
                      <label>
                        <i className="fas fa-map-marked-alt"></i>
                        Zone géographique
                      </label>
                      <div className={styles.infoValue}>
                        {data.zoneGeographiquePatients}
                      </div>
                    </div>
                  )}
                  {data.milieuExercice && (
                    <div className={styles.infoItem}>
                      <label>
                        <i className="fas fa-building"></i>
                        Milieu d'exercice
                      </label>
                      <div className={styles.infoValue}>
                        {data.milieuExercice}
                      </div>
                    </div>
                  )}
                  {data.nomStructure && (
                    <div className={styles.infoItem}>
                      <label>
                        <i className="fas fa-hospital"></i>
                        Structure
                      </label>
                      <div className={styles.infoValue}>
                        {data.nomStructure}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "aidant" && data.role === 'aidant' && (
            <div className={styles.contentGrid}>
              <div className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <i className="fas fa-hands-helping"></i>
                  <h3>Lien avec le senior</h3>
                </div>
                <div className={styles.cardContent}>
                  {data.lien_avec_senior ? (
                    <>
                      <div className={styles.infoItem}>
                        <label>
                          <i className="fas fa-user-shield"></i>
                          Senior associé
                        </label>
                        <div className={styles.infoValue}>
                          {data.lien_avec_senior.fullName} {data.lien_avec_senior.firstName}
                        </div>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          <i className="fas fa-phone"></i>
                          Téléphone du senior
                        </label>
                        <div className={styles.infoValue}>
                          {data.lien_avec_senior.phone || 'Non spécifié'}
                        </div>
                      </div>
                      <div className={styles.infoAction}>
                        <button 
                          className={styles.linkButton}
                          onClick={() => router.push(`/usagers/${data.lien_avec_senior._id}`)}
                        >
                          <i className="fas fa-external-link-alt"></i>
                          Voir le profil du senior
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyState}>
                      <i className="fas fa-exclamation-circle"></i>
                      <p>Aucun senior associé à cet aidant</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "experimentations" && (
            <div className={styles.experimentationsContainer}>
              <div className={styles.experimentsHeader}>
                <div className={styles.experimentsTitle}>
                  <i className="fas fa-vial"></i>
                  <h3>Expérimentations</h3>
                  <span className={styles.experimentsCount}>
                    ({data.experimentations ? data.experimentations.length : 0})
                  </span>
                </div>
                <button
                  onClick={handleRattacherExperimentation}
                  className={styles.addExperimentationButton}
                >
                  <i className="fas fa-plus"></i>
                  Rattacher à une expérimentation
                </button>
              </div>

              {data.experimentations && data.experimentations.length > 0 ? (
                <div className={styles.experimentsList}>
                  {data.experimentations.map((exp, index) => (
                    <div key={index} className={styles.experimentationCard}>
                      <div className={styles.experimentationHeader}>
                        <div className={styles.experimentationTitle}>
                          <i className="fas fa-flask"></i>
                          <h4>{exp.experimentation ? exp.experimentation.name : 'Expérimentation'}</h4>
                        </div>
                        <div className={styles.experimentationStatus}>
                          <span className={`${styles.statusChip} ${styles[`status${exp.statut ? exp.statut.nom_statut.replace(/\s+/g, '') : 'Default'}`]}`}>
                            {exp.statut ? exp.statut.nom_statut : 'Statut inconnu'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.experimentationDetails}>
                        <div className={styles.experimentationItem}>
                          <label>Cible</label>
                          <div>{exp.cible ? exp.cible.nom_cible : 'Non spécifiée'}</div>
                        </div>
                        <div className={styles.experimentationItem}>
                          <label>Date de rattachement</label>
                          <div>{exp.date_rattachement ? new Date(exp.date_rattachement).toLocaleDateString() : 'Non spécifiée'}</div>
                        </div>
                        {exp.historique_statuts && exp.historique_statuts.length > 0 && (
                          <div className={styles.experimentationItem}>
                            <label>Dernier changement</label>
                            <div>{new Date(exp.historique_statuts[exp.historique_statuts.length - 1].date_changement).toLocaleDateString()}</div>
                          </div>
                        )}
                      </div>
                      <div className={styles.experimentationActions}>
                        <button 
                          className={styles.viewExperimentationButton}
                          onClick={() => router.push(`/experimentations/${exp.experimentation._id}/beneficiaires/${exp._id}`)}
                        >
                          <i className="fas fa-eye"></i>
                          Voir les détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyExperimentations}>
                  <div className={styles.emptyIcon}>
                    <i className="fas fa-flask"></i>
                  </div>
                  <h4>Aucune expérimentation</h4>
                  <p>
                    Cet usager n'est rattaché à aucune expérimentation
                  </p>
                  <button
                    onClick={handleRattacherExperimentation}
                    className={styles.addFirstExperimentationButton}
                  >
                    <i className="fas fa-plus"></i>
                    Rattacher à une expérimentation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}