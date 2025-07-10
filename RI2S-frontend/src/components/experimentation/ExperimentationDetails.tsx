"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Experimentation,
  ExperimentationComplete,
  ChampCommun,
  CibleExperimentation,
  BeneficiaireExperimentation,
} from "../../types/models";
import { experimentationService } from "@/services/experimentationServices";
import { beneficiaireService } from "../../services/beneficiaireService";
import Card from "../common/Card";
import Button from "../common/Button";
import Alert from "../common/Alert";
import StatusBadge from "../common/StatusBadge";
import Tabs, { TabItem } from "../UI/Tabs";
import BeneficiaireTable from "./BeneficiaireTable";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import "./experimentationDetails.css";

interface ExperimentationDetailsProps {
  experimentationId: string;
}

const ExperimentationDetails: React.FC<ExperimentationDetailsProps> = ({
  experimentationId,
}) => {
  const router = useRouter();
  const [experimentationData, setExperimentationData] =
    useState<ExperimentationComplete | null>(null);
  const [beneficiaires, setBeneficiaires] = useState<
    BeneficiaireExperimentation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Charger les données de l'expérimentation
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await experimentationService.getComplete(
          experimentationId
        );
        setExperimentationData(data);

        // Charger les bénéficiaires associés
        const beneficiairesData =
          await beneficiaireService.getByExperimentation(experimentationId);
        setBeneficiaires(beneficiairesData);

        setError(null);
      } catch (err: any) {
        setError(
          "Erreur lors du chargement des données: " +
            (err.message || "Erreur inconnue")
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (experimentationId) {
      fetchData();
    }
  }, [experimentationId]);

  // Contenu du breadcrumb à mettre à jour dynamiquement quand les données sont chargées
  const getBreadcrumbItems = () => {
    return [
      { label: "Accueil", href: "/index" },
      { label: "Expérimentations", href: "/index" },
      {
        label: experimentationData?.experimentation.name || "Détails",
        isCurrentPage: true,
      },
    ];
  };

  // Formater une date en français
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Supprimer l'expérimentation
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await experimentationService.delete(experimentationId);
      setSuccess("Expérimentation supprimée avec succès");

      // Rediriger après un court délai
      setTimeout(() => {
        router.push("/index");
      }, 1500);
    } catch (err: any) {
      setError(
        "Erreur lors de la suppression: " + (err.message || "Erreur inconnue")
      );
      setIsDeleting(false);
    }
  };

  // Gérer l'ajout d'un bénéficiaire
  const handleAddBeneficiaire = () => {
    router.push(
      `/beneficiaires/associate?experimentationId=${experimentationId}`
    );
  };

  // Obtenir la variante de statut pour le badge
  const getStatusVariant = (
    status: string
  ): "active" | "warning" | "danger" => {
    switch (status) {
      case "Active":
        return "active";
      case "En pause":
        return "warning";
      case "Terminée":
        return "danger";
      default:
        return "active";
    }
  };

  // Obtenir l'icône pour le statut
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case "Active":
        return "fa-circle-check";
      case "En pause":
        return "fa-circle-pause";
      case "Terminée":
        return "fa-circle-xmark";
      default:
        return "fa-circle-info";
    }
  };

  // Rendu de l'onglet Détails
  const renderDetailsTab = () => {
    if (!experimentationData?.experimentation) return null;

    const exp = experimentationData.experimentation;

    return (
      <div>
        {/* Informations générales */}
        <div className="exp-card">
          <div className="exp-card-header">
            <div className="exp-card-title">
              <i className="fas fa-info-circle"></i>
              Informations générales
            </div>
          </div>
          <div className="exp-card-content">
            <div className="exp-field-grid">
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-tag"></i>
                  Nom
                </div>
                <div className="exp-field-value">{exp.name}</div>
              </div>
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-barcode"></i>
                  Code
                </div>
                <div className="exp-field-value">{exp.code}</div>
              </div>
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-chart-line"></i>
                  Statut
                </div>
                <div className="exp-field-value active">
                  <i className={`fas ${getStatusIcon(exp.status)}`}></i>
                  {exp.status}
                </div>
              </div>
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-building"></i>
                  Entreprise
                </div>
                <div className="exp-field-value">{exp.entreprise}</div>
              </div>
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-calendar-day"></i>
                  Date de début
                </div>
                <div className="exp-field-value">
                  {formatDate(exp.startDate)}
                </div>
              </div>
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-calendar-check"></i>
                  Date de fin
                </div>
                <div className="exp-field-value">
                  {exp.endDate ? formatDate(exp.endDate) : "En cours"}
                </div>
              </div>
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-code-branch"></i>
                  Version du protocole
                </div>
                <div className="exp-field-value">{exp.protocolVersion}</div>
              </div>
              <div className="exp-field-group">
                <div className="exp-field-label">
                  <i className="fas fa-calendar-plus"></i>
                  Date de création
                </div>
                <div className="exp-field-value">
                  {exp.createdAt ? formatDate(exp.createdAt) : "Inconnue"}
                </div>
              </div>
              {exp.description && (
                <div className="exp-field-group exp-field-description">
                  <div className="exp-field-label">
                    <i className="fas fa-align-left"></i>
                    Description
                  </div>
                  <div className="exp-field-value">{exp.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact référent */}
        {exp.contact_referent && (
          <div className="exp-card">
            <div className="exp-card-header">
              <div className="exp-card-title">
                <i className="fas fa-user-tie"></i>
                Contact référent
              </div>
            </div>
            <div className="exp-card-content">
              <div className="exp-field-grid">
                <div className="exp-field-group">
                  <div className="exp-field-label">
                    <i className="fas fa-user"></i>
                    Nom complet
                  </div>
                  <div className="exp-field-value">
                    {exp.contact_referent.prenom} {exp.contact_referent.nom}
                  </div>
                </div>
                {exp.contact_referent.email && (
                  <div className="exp-field-group">
                    <div className="exp-field-label">
                      <i className="fas fa-envelope"></i>
                      Email
                    </div>
                    <div className="exp-field-value">
                      {exp.contact_referent.email}
                    </div>
                  </div>
                )}
                {exp.contact_referent.telephone && (
                  <div className="exp-field-group">
                    <div className="exp-field-label">
                      <i className="fas fa-phone"></i>
                      Téléphone
                    </div>
                    <div className="exp-field-value">
                      {exp.contact_referent.telephone}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="exp-card">
          <div className="exp-card-header">
            <div className="exp-card-title">
              <i className="fas fa-cogs"></i>
              Actions
            </div>
          </div>
          <div className="exp-card-content">
            <div className="exp-btn-group">
              <button
                className="exp-btn exp-btn-primary"
                onClick={() =>
                  router.push(`/experimentations/${experimentationId}/edit`)
                }
              >
                <i className="fas fa-edit"></i>
                Modifier
              </button>

              <button
                className="exp-btn exp-btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <i className="fas fa-trash-alt"></i>
                Supprimer
              </button>
            </div>

            {/* Confirmation de suppression */}
            {showDeleteConfirm && (
              <div className="exp-delete-confirm">
                <div className="exp-delete-confirm-title">
                  <i className="fas fa-exclamation-triangle"></i>
                  Confirmer la suppression
                </div>
                <p className="exp-delete-confirm-text">
                  Êtes-vous sûr de vouloir supprimer cette expérimentation ?
                  Cette action est irréversible.
                </p>
                <div className="exp-delete-confirm-actions">
                  <button
                    className="exp-btn"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Annuler
                  </button>
                  <button
                    className="exp-btn exp-btn-danger"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? "Suppression en cours..."
                      : "Confirmer la suppression"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Rendu de l'onglet Structure
  const renderStructureTab = () => {
    if (!experimentationData) return null;

    return (
      <div>
        {/* Champs communs */}
        <div className="exp-card">
          <div className="exp-card-header">
            <div className="exp-card-title">
              <i className="fas fa-clipboard-list"></i>
              Champs communs ({experimentationData.champsCommuns.length})
            </div>
          </div>
          <div className="exp-card-content">
            {experimentationData.champsCommuns.length > 0 ? (
              <div className="exp-field-grid">
                {experimentationData.champsCommuns.map((champ, index) => (
                  <div key={index} className="exp-champ-card">
                    <div className="exp-champ-header">
                      <div className="exp-champ-nom">
                        <i className="fas fa-file-alt"></i>
                        {champ.nom_champ}
                      </div>
                      <div className="exp-champ-type">{champ.type_champ}</div>
                    </div>
                    {champ.description && (
                      <div className="exp-champ-description">
                        {champ.description}
                      </div>
                    )}
                    {champ.obligatoire && (
                      <span className="exp-champ-obligatoire">
                        <i className="fas fa-exclamation-circle"></i>
                        Obligatoire
                      </span>
                    )}
                    {champ.options && champ.options.length > 0 && (
                      <div className="exp-champ-options">
                        <div className="exp-champ-options-title">Options:</div>
                        <div className="exp-champ-options-list">
                          {champ.options.map((option, i) => (
                            <span key={i} className="exp-champ-option">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="exp-field-value">Aucun champ commun défini</p>
            )}
          </div>
        </div>

        {/* Cibles et statuts */}
        <div>
          {experimentationData.cibles.length > 0 ? (
            experimentationData.cibles.map((cible, index) => (
              <div key={index} className="exp-card">
                <div className="exp-card-header">
                  <div className="exp-card-title">
                    <i className="fas fa-bullseye"></i>
                    {cible.nom_cible}
                  </div>
                  {cible.code_cible && (
                    <div
                      style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}
                    >
                      Code: {cible.code_cible}
                    </div>
                  )}
                </div>
                <div className="exp-card-content">
                  {cible.description && (
                    <div className="exp-field-group">
                      <div className="exp-field-label">
                        <i className="fas fa-info-circle"></i>
                        Description
                      </div>
                      <div className="exp-field-value">{cible.description}</div>
                    </div>
                  )}

                  <h4
                    className="exp-statut-champs-title"
                    style={{ marginTop: "1.5rem", marginBottom: "1rem" }}
                  >
                    <i className="fas fa-list-ol"></i>
                    Statuts
                  </h4>

                  {cible.statuts && cible.statuts.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      {cible.statuts
                        .sort((a, b) => a.ordre - b.ordre)
                        .map((statut, statIndex) => (
                          <div key={statIndex} className="exp-statut-card">
                            <div className="exp-statut-header">
                              <div className="exp-statut-ordre">
                                {statut.ordre + 1}
                              </div>
                              <div className="exp-statut-info">
                                <div className="exp-statut-nom">
                                  <i className="fas fa-flag"></i>
                                  {statut.nom_statut}
                                </div>
                                {statut.description && (
                                  <div className="exp-statut-description">
                                    {statut.description}
                                  </div>
                                )}
                              </div>
                            </div>

                            {statut.champs && statut.champs.length > 0 && (
                              <div className="exp-statut-champs">
                                <div className="exp-statut-champs-title">
                                  <i className="fas fa-list-ul"></i>
                                  Champs associés:
                                </div>
                                <div className="exp-statut-champs-grid">
                                  {statut.champs.map((champ, champIndex) => (
                                    <div
                                      key={champIndex}
                                      className="exp-statut-champ-item"
                                    >
                                      <div className="exp-statut-champ-header">
                                        <div className="exp-statut-champ-nom">
                                          <i className="fas fa-file-alt"></i>
                                          {champ.nom_champ}
                                        </div>
                                        <div className="exp-statut-champ-type">
                                          {champ.type_champ}
                                        </div>
                                      </div>
                                      {champ.obligatoire && (
                                        <span
                                          className="exp-champ-obligatoire"
                                          style={{ marginTop: "0.375rem" }}
                                        >
                                          <i className="fas fa-exclamation-circle"></i>
                                          Obligatoire
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="exp-field-value">
                      Aucun statut défini pour cette cible
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="exp-card">
              <div className="exp-card-content">
                <p className="exp-field-value" style={{ textAlign: "center" }}>
                  Aucune cible définie
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendu de l'onglet Bénéficiaires
  const renderBeneficiairesTab = () => {
    if (!experimentationData?.experimentation) return null;

    return (
      <div>
        <div className="exp-beneficiaires-header">
          <h3 className="exp-beneficiaires-title">
            <i className="fas fa-users"></i>
            Bénéficiaires de l'expérimentation
          </h3>

          <button
            className="exp-btn exp-btn-primary"
            onClick={() =>
              router.push(
                `/beneficiaires/associate?experimentationId=${experimentationId}`
              )
            }
          >
            <i className="fas fa-user-plus"></i>
            Ajouter un bénéficiaire
          </button>
        </div>

        <BeneficiaireTable
          beneficiaires={beneficiaires}
          cibles={experimentationData.cibles}
          experimentationId={experimentationId}
          onRefresh={async () => {
            try {
              const data = await beneficiaireService.getByExperimentation(
                experimentationId
              );
              setBeneficiaires(data);
            } catch (error) {
              console.error(
                "Erreur lors du rafraîchissement des bénéficiaires",
                error
              );
            }
          }}
        />
      </div>
    );
  };

  // Fonction pour rendre le contenu en fonction de l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return renderDetailsTab();
      case "structure":
        return renderStructureTab();
      case "beneficiaires":
        return renderBeneficiairesTab();
      default:
        return renderDetailsTab();
    }
  };

  if (isLoading) {
    return (
      <div className="exp-loading">
        <div className="exp-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exp-alert exp-alert-error">
        <div className="exp-alert-icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <div>
          <div className="exp-alert-title">Erreur</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!experimentationData) {
    return (
      <div className="exp-alert exp-alert-error">
        <div className="exp-alert-icon">
          <i className="fas fa-info-circle"></i>
        </div>
        <div>Aucune donnée disponible pour cette expérimentation.</div>
      </div>
    );
  }

  return (
    <div className="exp-container">
      {/* Breadcrumb */}
      <div className="breadcrumbs-container">
        <Breadcrumbs items={getBreadcrumbItems()} />
      </div>

      {/* En-tête */}
      <div className="exp-header">
        <h1 className="exp-title">
          <i className="fas fa-flask"></i>
          {experimentationData.experimentation.name}
        </h1>

        <div className="exp-meta">
          <div
            className={`exp-status ${getStatusVariant(
              experimentationData.experimentation.status
            )}`}
          >
            <i
              className={`fas ${getStatusIcon(
                experimentationData.experimentation.status
              )}`}
            ></i>
            {experimentationData.experimentation.status}
          </div>
          <div className="exp-code">
            <i className="fas fa-hashtag"></i>
            Code: {experimentationData.experimentation.code}
          </div>
        </div>
      </div>

      {/* Messages de confirmation */}
      {success && (
        <div
          className="exp-alert"
          style={{
            backgroundColor: "var(--success-light)",
            color: "var(--success-color)",
          }}
        >
          <div className="exp-alert-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div className="exp-alert-title">Succès</div>
            <div>{success}</div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="exp-tabs">
        <div
          className={`exp-tab ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          <i className="fas fa-info-circle"></i>
          Détails
        </div>
        <div
          className={`exp-tab ${activeTab === "structure" ? "active" : ""}`}
          onClick={() => setActiveTab("structure")}
        >
          <i className="fas fa-sitemap"></i>
          Structure
        </div>
        <div
          className={`exp-tab ${activeTab === "beneficiaires" ? "active" : ""}`}
          onClick={() => setActiveTab("beneficiaires")}
        >
          <i className="fas fa-users"></i>
          Bénéficiaires ({beneficiaires.length})
        </div>
      </div>

      {/* Contenu de l'onglet actif */}
      {renderTabContent()}
    </div>
  );
};

export default ExperimentationDetails;
