"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ExperimentationFormData,
  CibleFormData,
  StatutFormData,
  ChampFormData,
  ChampType,
} from "../../types/models";
import { experimentationService } from "@/services/experimentationServices";
import FormField from "../common/FormField";
import Notification from "../Notification/Notification";
import CibleForm from "./CibleForm";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import "./experimentationForm.css";

interface ExperimentationFormProps {
  initialData?: Partial<ExperimentationFormData>;
  isEditing?: boolean;
}

// Extend the Step interface to include validation status
interface Step {
  id: string;
  title: string;
  description: string;
  icon: string; // Ajout d'une icône pour chaque étape
}

const ExperimentationForm: React.FC<ExperimentationFormProps> = ({
  initialData,
  isEditing = false,
}) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État pour les notifications
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [animateError, setAnimateError] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState<ExperimentationFormData>({
    name: initialData?.name || "",
    code: initialData?.code || "",
    description: initialData?.description || "",
    startDate: initialData?.startDate || new Date().toISOString().split("T")[0],
    endDate: initialData?.endDate || "",
    protocolVersion: initialData?.protocolVersion || "1.0",
    status: initialData?.status || "Active",
    entreprise: initialData?.entreprise || "",
    contact_referent: initialData?.contact_referent || {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
    },
    cibles: initialData?.cibles || [],
    champs_communs: initialData?.champs_communs || [],
  });

  const getBreadcrumbItems = () => {
    if (isEditing) {
      return [
        { label: "Accueil", href: "/index" },
        { label: "Expérimentations", href: "/index" },
        {
          label: initialData?.name || "Expérimentation",
          href: `/experimentations/${initialData?._id}`,
        },
        { label: "Modifier", isCurrentPage: true },
      ];
    } else {
      return [
        { label: "Accueil", href: "/index" },
        { label: "Expérimentations", href: "/index" },
        { label: "Créer une expérimentation", isCurrentPage: true },
      ];
    }
  };

  // Liste des étapes
  const steps: Step[] = [
    {
      id: "info-generale",
      title: "Informations générales",
      description: "Définir les paramètres de base",
      icon: "fas fa-info-circle",
    },
    {
      id: "champs-communs",
      title: "Champs communs",
      description: "Champs pour tous les bénéficiaires",
      icon: "fas fa-layer-group",
    },
    {
      id: "cibles",
      title: "Cibles",
      description: "Définir les profils cibles",
      icon: "fas fa-bullseye",
    },
    {
      id: "validation",
      title: "Validation",
      description: "Vérifier et enregistrer",
      icon: "fas fa-check-circle",
    },
  ];

  // Fonction pour afficher une erreur
  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorVisible(true);

    // Animation d'erreur
    setAnimateError(true);
    setTimeout(() => {
      setAnimateError(false);
    }, 500);
  };

  // Fonction pour afficher un succès
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setSuccessVisible(true);
  };

  // Fonction pour valider chaque étape
  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Informations générales
        const requiredFields = [
          "name",
          "code",
          "startDate",
          "entreprise",
          "protocolVersion",
        ];
        const invalidFieldsList = requiredFields.filter(
          (field) => !formData[field as keyof ExperimentationFormData]
        );
        setInvalidFields(invalidFieldsList);
        return invalidFieldsList.length === 0;

      case 1: // Champs communs
        return true; // Les champs communs sont optionnels

      case 2: // Cibles
        if (formData.cibles.length === 0) {
          //showError('Veuillez définir au moins une cible.');
          return false;
        }

        // Vérifier si toutes les cibles ont au moins un statut
        const invalidCibles = formData.cibles.filter(
          (cible) => cible.statuts.length === 0
        );
        if (invalidCibles.length > 0) {
          showError(
            `La cible "${invalidCibles[0].nom_cible}" doit avoir au moins un statut.`
          );
          return false;
        }

        return true;

      case 3: // Validation
        return true; // L'étape de validation est toujours valide

      default:
        return false;
    }
  };

  // Mettre à jour les informations générales
  const handleInfoChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("contact_referent.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        contact_referent: {
          ...prev.contact_referent!,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Supprimer le champ de la liste des champs invalides
    if (invalidFields.includes(name)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }
  };

  // Gérer les champs communs
  const [champCommun, setChampCommun] = useState<ChampFormData>({
    nom_champ: "",
    type_champ: "texte",
    obligatoire: false,
    description: "",
    options: [],
  });

  const [optionValue, setOptionValue] = useState("");

  const handleChampCommunChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setChampCommun((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addOption = () => {
    if (optionValue.trim() === "") return;

    setChampCommun((prev) => ({
      ...prev,
      options: [...(prev.options || []), optionValue.trim()],
    }));

    setOptionValue("");
  };

  const removeOption = (index: number) => {
    setChampCommun((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index),
    }));
  };

  const addChampCommun = () => {
    if (champCommun.nom_champ.trim() === "") return;

    setFormData((prev) => ({
      ...prev,
      champs_communs: [...prev.champs_communs, { ...champCommun }],
    }));

    // Réinitialiser le formulaire de champ commun
    setChampCommun({
      nom_champ: "",
      type_champ: "texte",
      obligatoire: false,
      description: "",
      options: [],
    });

    // Ajouter la classe d'animation
    const newItem = document.querySelector(".champs-list > div:last-child");
    if (newItem) {
      newItem.classList.add("pop-in");
      setTimeout(() => {
        newItem.classList.remove("pop-in");
      }, 500);
    }
  };

  const removeChampCommun = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      champs_communs: prev.champs_communs.filter((_, i) => i !== index),
    }));
  };

  // Gérer les cibles
  const [cible, setCible] = useState<CibleFormData>({
    nom_cible: "",
    code_cible: "",
    description: "",
    statuts: [],
  });

  const handleCibleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCible((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addCible = () => {
    if (cible.nom_cible.trim() === "") return;

    setFormData((prev) => ({
      ...prev,
      cibles: [...prev.cibles, { ...cible }],
    }));

    // Réinitialiser le formulaire de cible
    setCible({
      nom_cible: "",
      code_cible: "",
      description: "",
      statuts: [],
    });

    // Ajouter la classe d'animation
    const newItem = document.querySelector(".cibles-list > div:last-child");
    if (newItem) {
      newItem.classList.add("pop-in");
      setTimeout(() => {
        newItem.classList.remove("pop-in");
      }, 500);
    }
  };

  const updateCible = (index: number, updatedCible: CibleFormData) => {
    setFormData((prev) => ({
      ...prev,
      cibles: prev.cibles.map((c, i) => (i === index ? updatedCible : c)),
    }));
  };

  const removeCible = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      cibles: prev.cibles.filter((_, i) => i !== index),
    }));
  };

  // Navigation entre les étapes
  const handleNextStep = () => {
    // Valider l'étape actuelle
    if (validateStep(activeStep)) {
      setActiveStep(activeStep + 1);
      setErrorVisible(false);

      // Scroll vers le haut de la page
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // Si aucun message d'erreur n'est déjà défini, afficher un message générique
      if (!errorMessage) {
        showError(
          "Veuillez remplir tous les champs obligatoires avant de continuer."
        );
      }
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setErrorVisible(false);
    }
  };

  // Calculer les étapes accessibles
  const [accessibleSteps, setAccessibleSteps] = useState<boolean[]>([]);

  // Mettre à jour les étapes accessibles lorsque les dépendances changent
  useEffect(() => {
    const newAccessibleSteps = steps.map((_, index) => {
      // L'étape actuelle et les étapes précédentes sont toujours accessibles
      if (index <= activeStep) return true;

      // Pour les étapes futures, vérifier si toutes les étapes précédentes sont validées
      for (let i = 0; i < index; i++) {
        if (!validateStep(i)) return false;
      }

      // Seule l'étape suivante est accessible si l'étape courante est validée
      return index === activeStep + 1 && validateStep(activeStep);
    });

    setAccessibleSteps(newAccessibleSteps);
  }, [activeStep, formData]);

  // Changement direct d'étape (via le stepper)
  const handleStepChange = (index: number) => {
    // Vérifier si l'étape est accessible en utilisant le tableau pré-calculé
    if (accessibleSteps[index] || index <= activeStep) {
      setActiveStep(index);
      setErrorVisible(false);
    } else {
      showError(
        "Veuillez compléter l'étape actuelle avant de passer à cette étape."
      );
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valider le formulaire complet
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorVisible(false);

    try {
      if (isEditing && initialData?._id) {
        // Mise à jour d'une expérimentation existante
        await experimentationService.update(initialData._id, formData);
        showSuccess("Expérimentation mise à jour avec succès !");
      } else {
        // Création d'une nouvelle expérimentation
        await experimentationService.createComplete(formData);
        showSuccess("Expérimentation créée avec succès !");
      }

      // Rediriger après un court délai
      setTimeout(() => {
        router.push("/index");
      }, 2000);
    } catch (err: any) {
      showError(
        "Erreur lors de l'enregistrement: " + (err.message || "Erreur inconnue")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Valider les données avant de soumettre
  const validateForm = (): boolean => {
    // Validation de base
    if (
      !formData.name ||
      !formData.code ||
      !formData.startDate ||
      !formData.entreprise
    ) {
      showError("Veuillez remplir tous les champs obligatoires.");
      return false;
    }

    // Validation des cibles
    if (formData.cibles.length === 0) {
      showError("Veuillez définir au moins une cible.");
      return false;
    }

    // Validation des statuts pour chaque cible
    for (const cible of formData.cibles) {
      if (cible.statuts.length === 0) {
        showError(
          `La cible "${cible.nom_cible}" doit avoir au moins un statut.`
        );
        return false;
      }
    }

    return true;
  };

  // Vérifier si un champ est invalide
  const isFieldInvalid = (fieldName: string): boolean => {
    return invalidFields.includes(fieldName);
  };

  // Rendu du stepper
  const renderStepper = () => {
    // Calculer la largeur de la barre de progression
    const progressWidth = `${(activeStep / (steps.length - 1)) * 100}%`;

    return (
      <div className="stepper-container">
        <ul
          className="stepper"
          style={
            {
              "--progress": activeStep / (steps.length - 1),
            } as React.CSSProperties
          }
        >
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={`stepper-step ${
                index === activeStep ? "stepper-step-active" : ""
              } ${index < activeStep ? "stepper-step-completed" : ""}`}
              onClick={() => handleStepChange(index)}
            >
              <div className="stepper-step-circle">
                {index < activeStep ? (
                  <i className="fas fa-check"></i>
                ) : (
                  <i className={step.icon}></i>
                )}
              </div>
              <div>
                <div className="stepper-step-title">{step.title}</div>
                <div className="stepper-step-description">
                  {step.description}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {/* Barre de progression */}
        <style jsx>{`
          .stepper::after {
            width: ${progressWidth};
          }
        `}</style>
      </div>
    );
  };

  // Rendu de l'étape actuelle avec animation
  const renderStepWithAnimation = () => {
    return (
      <div className="step-content" key={activeStep}>
        {renderStep()}
      </div>
    );
  };

  // Fonction d'aide pour obtenir l'icône correspondant au type de champ
  const getIconForFieldType = (type: string): string => {
    switch (type) {
      case "texte":
        return "fas fa-font";
      case "date":
        return "fas fa-calendar-alt";
      case "nombre":
        return "fas fa-hashtag";
      case "liste":
        return "fas fa-list-ul";
      case "fichier":
        return "fas fa-file-alt";
      default:
        return "fas fa-question-circle";
    }
  };

  // Rendu de l'étape actuelle
  const renderStep = () => {
    switch (activeStep) {
      case 0: // Informations générales
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fas fa-info-circle"></i>
                Informations générales
              </h3>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-flask"></i>
                  Nom de l'expérimentation
                  <span className="text-danger-color">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInfoChange}
                  required
                  className={
                    isFieldInvalid("name") ? "border-danger-color" : ""
                  }
                />
                {isFieldInvalid("name") && (
                  <div className="error-text">Ce champ est requis</div>
                )}
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-barcode"></i>
                  Code
                  <span className="text-danger-color">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInfoChange}
                  required
                  className={
                    isFieldInvalid("code") ? "border-danger-color" : ""
                  }
                />
                {isFieldInvalid("code") && (
                  <div className="error-text">Ce champ est requis</div>
                )}
                <div className="hint-text">
                  Code unique pour identifier l'expérimentation
                </div>
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-calendar-alt"></i>
                  Date de début
                  <span className="text-danger-color">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInfoChange}
                  required
                  className={
                    isFieldInvalid("startDate") ? "border-danger-color" : ""
                  }
                />
                {isFieldInvalid("startDate") && (
                  <div className="error-text">Ce champ est requis</div>
                )}
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-calendar-check"></i>
                  Date de fin
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInfoChange}
                />
                <div className="hint-text">
                  Laissez vide si l'expérimentation est en cours
                </div>
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-code-branch"></i>
                  Version du protocole
                  <span className="text-danger-color">*</span>
                </label>
                <input
                  type="text"
                  name="protocolVersion"
                  value={formData.protocolVersion}
                  onChange={handleInfoChange}
                  required
                  className={
                    isFieldInvalid("protocolVersion")
                      ? "border-danger-color"
                      : ""
                  }
                />
                {isFieldInvalid("protocolVersion") && (
                  <div className="error-text">Ce champ est requis</div>
                )}
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-toggle-on"></i>
                  Statut
                  <span className="text-danger-color">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInfoChange}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="En pause">En pause</option>
                  <option value="Terminée">Terminée</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-building"></i>
                  Entreprise
                  <span className="text-danger-color">*</span>
                </label>
                <input
                  type="text"
                  name="entreprise"
                  value={formData.entreprise}
                  onChange={handleInfoChange}
                  required
                  className={
                    isFieldInvalid("entreprise") ? "border-danger-color" : ""
                  }
                />
                {isFieldInvalid("entreprise") && (
                  <div className="error-text">Ce champ est requis</div>
                )}
                <div className="hint-text">Entreprise ou organisme porteur</div>
              </div>

              <div className="form-field form-grid-full">
                <label className="form-field-label">
                  <i className="fas fa-align-left"></i>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInfoChange}
                ></textarea>
              </div>
            </div>

            <h4
              className="card-title"
              style={{ marginTop: "2rem", marginBottom: "1rem" }}
            >
              <i className="fas fa-user-tie"></i>
              Contact référent
            </h4>

            <div className="form-grid">
              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-user"></i>
                  Nom
                </label>
                <input
                  type="text"
                  name="contact_referent.nom"
                  value={formData.contact_referent?.nom || ""}
                  onChange={handleInfoChange}
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-user"></i>
                  Prénom
                </label>
                <input
                  type="text"
                  name="contact_referent.prenom"
                  value={formData.contact_referent?.prenom || ""}
                  onChange={handleInfoChange}
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-envelope"></i>
                  Email
                </label>
                <input
                  type="email"
                  name="contact_referent.email"
                  value={formData.contact_referent?.email || ""}
                  onChange={handleInfoChange}
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  <i className="fas fa-phone"></i>
                  Téléphone
                </label>
                <input
                  type="text"
                  name="contact_referent.telephone"
                  value={formData.contact_referent?.telephone || ""}
                  onChange={handleInfoChange}
                />
              </div>
            </div>
          </div>
        );

      case 1: // Champs communs
        return (
          <>
            {/* Formulaire d'ajout de champs communs */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-puzzle-piece"></i>
                  Ajouter un champ commun
                </h3>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-field-label">
                    <i className="fas fa-tag"></i>
                    Nom du champ
                    <span className="text-danger-color">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom_champ"
                    value={champCommun.nom_champ}
                    onChange={handleChampCommunChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-field-label">
                    <i className="fas fa-th-list"></i>
                    Type de champ
                    <span className="text-danger-color">*</span>
                  </label>
                  <select
                    name="type_champ"
                    value={champCommun.type_champ}
                    onChange={handleChampCommunChange}
                    required
                  >
                    <option value="texte">Texte</option>
                    <option value="date">Date</option>
                    <option value="nombre">Nombre</option>
                    <option value="liste">Liste à choix</option>
                    <option value="fichier">Fichier</option>
                  </select>
                </div>

                <div className="form-field form-grid-full">
                  <label className="form-field-label">
                    <i className="fas fa-info-circle"></i>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={champCommun.description || ""}
                    onChange={handleChampCommunChange}
                  ></textarea>
                </div>

                <div className="form-field form-grid-full">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="champ-obligatoire"
                      name="obligatoire"
                      checked={champCommun.obligatoire}
                      onChange={handleChampCommunChange}
                      style={{ width: "auto", marginRight: "0.5rem" }}
                    />
                    <label
                      htmlFor="champ-obligatoire"
                      className="form-field-label"
                      style={{ margin: 0 }}
                    >
                      <i className="fas fa-exclamation-circle"></i>
                      Champ obligatoire
                    </label>
                  </div>
                </div>
              </div>

              {/* Options pour les listes */}
              {champCommun.type_champ === "liste" && (
                <div style={{ marginTop: "1.5rem" }}>
                  <h4
                    className="card-title"
                    style={{ fontSize: "1rem", marginBottom: "1rem" }}
                  >
                    <i className="fas fa-list-ul"></i>
                    Options de la liste
                  </h4>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ position: "relative", flex: 1 }}>
                      <input
                        type="text"
                        value={optionValue}
                        onChange={(e) => setOptionValue(e.target.value)}
                        placeholder="Nouvelle option..."
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={addOption}
                    >
                      <i className="fas fa-plus"></i>
                      Ajouter
                    </button>
                  </div>

                  {champCommun.options && champCommun.options.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {champCommun.options.map((option, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.5rem",
                            backgroundColor: "var(--gray-50)",
                            borderRadius: "0.375rem",
                          }}
                        >
                          <span>
                            <i
                              className="fas fa-check-circle"
                              style={{
                                color: "var(--primary-color)",
                                marginRight: "0.5rem",
                              }}
                            ></i>
                            {option}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--danger-color)",
                              cursor: "pointer",
                              padding: "0.25rem",
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{ fontSize: "0.875rem", color: "var(--gray-500)" }}
                    >
                      <i
                        className="fas fa-info-circle"
                        style={{ marginRight: "0.25rem" }}
                      ></i>
                      Aucune option ajoutée
                    </p>
                  )}
                </div>
              )}

              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addChampCommun}
                  disabled={!champCommun.nom_champ}
                >
                  <i className="fas fa-plus"></i>
                  Ajouter ce champ
                </button>
              </div>
            </div>

            {/* Liste des champs communs */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-layer-group"></i>
                  Champs communs définis
                </h3>
              </div>

              {formData.champs_communs.length > 0 ? (
                <div
                  className="champs-list"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {formData.champs_communs.map((champ, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "1rem",
                        border: "1px solid var(--gray-200)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <h4
                              style={{
                                fontWeight: "500",
                                fontSize: "1rem",
                                margin: 0,
                              }}
                            >
                              <i
                                className={`${getIconForFieldType(
                                  champ.type_champ
                                )}`}
                                style={{
                                  marginRight: "0.5rem",
                                  color: "var(--primary-color)",
                                }}
                              ></i>
                              {champ.nom_champ}
                            </h4>
                            {champ.obligatoire && (
                              <span className="badge badge-danger">
                                <i
                                  className="fas fa-exclamation-circle"
                                  style={{ marginRight: "0.25rem" }}
                                ></i>
                                Obligatoire
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--gray-500)",
                              margin: "0.5rem 0 0 0",
                            }}
                          >
                            <i
                              className="fas fa-info-circle"
                              style={{ marginRight: "0.25rem" }}
                            ></i>
                            Type:{" "}
                            {champ.type_champ.charAt(0).toUpperCase() +
                              champ.type_champ.slice(1)}
                          </p>
                          {champ.description && (
                            <p
                              style={{
                                fontSize: "0.875rem",
                                margin: "0.5rem 0 0 0",
                              }}
                            >
                              {champ.description}
                            </p>
                          )}

                          {champ.type_champ === "liste" &&
                            champ.options &&
                            champ.options.length > 0 && (
                              <div style={{ marginTop: "0.75rem" }}>
                                <p
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                    margin: "0 0 0.5rem 0",
                                  }}
                                >
                                  <i
                                    className="fas fa-list"
                                    style={{ marginRight: "0.25rem" }}
                                  ></i>
                                  Options:
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.25rem",
                                  }}
                                >
                                  {champ.options.map((option, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        padding: "0.25rem 0.5rem",
                                        backgroundColor: "var(--gray-100)",
                                        borderRadius: "0.375rem",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      <i
                                        className="fas fa-check-circle"
                                        style={{
                                          marginRight: "0.25rem",
                                          color: "var(--primary-color)",
                                        }}
                                      ></i>
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeChampCommun(index)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--danger-color)",
                            cursor: "pointer",
                            padding: "0.25rem",
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontStyle: "italic",
                    color: "var(--gray-500)",
                    textAlign: "center",
                    padding: "1rem 0",
                  }}
                >
                  <i
                    className="fas fa-info-circle"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  Aucun champ commun défini
                </p>
              )}
            </div>
          </>
        );

      case 2: // Cibles
        return (
          <>
            {/* Formulaire d'ajout de cible */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-bullseye"></i>
                  Ajouter une cible
                </h3>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-field-label">
                    <i className="fas fa-users"></i>
                    Nom de la cible
                    <span className="text-danger-color">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom_cible"
                    value={cible.nom_cible}
                    onChange={handleCibleChange}
                    required
                  />
                  <div className="hint-text">
                    Ex: Seniors, Aidants, Professionnels
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-field-label">
                    <i className="fas fa-hashtag"></i>
                    Code de la cible
                  </label>
                  <input
                    type="text"
                    name="code_cible"
                    value={cible.code_cible || ""}
                    onChange={handleCibleChange}
                  />
                  <div className="hint-text">
                    Code optionnel pour identifier la cible
                  </div>
                </div>

                <div className="form-field form-grid-full">
                  <label className="form-field-label">
                    <i className="fas fa-info-circle"></i>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={cible.description || ""}
                    onChange={handleCibleChange}
                  ></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addCible}
                  disabled={!cible.nom_cible}
                >
                  <i className="fas fa-plus"></i>
                  Ajouter cette cible
                </button>
              </div>
            </div>

            {/* Liste des cibles */}
            <div
              className="cibles-list"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {formData.cibles.length > 0 ? (
                formData.cibles.map((cible, index) => (
                  <CibleForm
                    key={index}
                    cible={cible}
                    onChange={(updatedCible) =>
                      updateCible(index, updatedCible)
                    }
                    onRemove={() => removeCible(index)}
                  />
                ))
              ) : (
                <div className="card" style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontStyle: "italic",
                      color: "var(--gray-500)",
                      padding: "1rem 0",
                    }}
                  >
                    <i
                      className="fas fa-info-circle"
                      style={{ marginRight: "0.5rem" }}
                    ></i>
                    Aucune cible définie
                  </p>
                </div>
              )}
            </div>
          </>
        );

      case 3: // Validation
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fas fa-clipboard-check"></i>
                Récapitulatif de l'expérimentation
              </h3>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              {/* Informations générales */}
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    borderBottom: "1px solid var(--gray-200)",
                    paddingBottom: "0.5rem",
                    marginBottom: "1rem",
                    color: "var(--gray-800)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="fas fa-info-circle"></i>
                  Informations générales
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(1, 1fr)",
                    gap: "0.75rem",
                    "@media (min-width: 768px)": {
                      gridTemplateColumns: "repeat(2, 1fr)",
                    },
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--gray-500)",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      <i
                        className="fas fa-flask"
                        style={{ marginRight: "0.25rem" }}
                      ></i>
                      Nom
                    </p>
                    <p style={{ fontWeight: "500", margin: 0 }}>
                      {formData.name}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--gray-500)",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      <i
                        className="fas fa-barcode"
                        style={{ marginRight: "0.25rem" }}
                      ></i>
                      Code
                    </p>
                    <p style={{ fontWeight: "500", margin: 0 }}>
                      {formData.code}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--gray-500)",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      <i
                        className="fas fa-toggle-on"
                        style={{ marginRight: "0.25rem" }}
                      ></i>
                      Statut
                    </p>
                    <p style={{ fontWeight: "500", margin: 0 }}>
                      {formData.status}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--gray-500)",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      <i
                        className="fas fa-building"
                        style={{ marginRight: "0.25rem" }}
                      ></i>
                      Entreprise
                    </p>
                    <p style={{ fontWeight: "500", margin: 0 }}>
                      {formData.entreprise}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--gray-500)",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      <i
                        className="fas fa-calendar-alt"
                        style={{ marginRight: "0.25rem" }}
                      ></i>
                      Période
                    </p>
                    <p style={{ fontWeight: "500", margin: 0 }}>
                      Du{" "}
                      {new Date(formData.startDate).toLocaleDateString("fr-FR")}
                      {formData.endDate
                        ? ` au ${new Date(formData.endDate).toLocaleDateString(
                            "fr-FR"
                          )}`
                        : " (en cours)"}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--gray-500)",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      <i
                        className="fas fa-code-branch"
                        style={{ marginRight: "0.25rem" }}
                      ></i>
                      Version du protocole
                    </p>
                    <p style={{ fontWeight: "500", margin: 0 }}>
                      {formData.protocolVersion}
                    </p>
                  </div>
                  {formData.description && (
                    <div style={{ gridColumn: "span 2" }}>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--gray-500)",
                          margin: "0 0 0.25rem 0",
                        }}
                      >
                        <i
                          className="fas fa-align-left"
                          style={{ marginRight: "0.25rem" }}
                        ></i>
                        Description
                      </p>
                      <p style={{ margin: 0 }}>{formData.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact référent */}
              {(formData.contact_referent?.nom ||
                formData.contact_referent?.prenom) && (
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      borderBottom: "1px solid var(--gray-200)",
                      paddingBottom: "0.5rem",
                      marginBottom: "1rem",
                      color: "var(--gray-800)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <i className="fas fa-user-tie"></i>
                    Contact référent
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(1, 1fr)",
                      gap: "0.75rem",
                      "@media (min-width: 768px)": {
                        gridTemplateColumns: "repeat(2, 1fr)",
                      },
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--gray-500)",
                          margin: "0 0 0.25rem 0",
                        }}
                      >
                        <i
                          className="fas fa-user"
                          style={{ marginRight: "0.25rem" }}
                        ></i>
                        Nom complet
                      </p>
                      <p style={{ fontWeight: "500", margin: 0 }}>
                        {formData.contact_referent?.prenom}{" "}
                        {formData.contact_referent?.nom}
                      </p>
                    </div>
                    {formData.contact_referent?.email && (
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--gray-500)",
                            margin: "0 0 0.25rem 0",
                          }}
                        >
                          <i
                            className="fas fa-envelope"
                            style={{ marginRight: "0.25rem" }}
                          ></i>
                          Email
                        </p>
                        <p style={{ fontWeight: "500", margin: 0 }}>
                          {formData.contact_referent.email}
                        </p>
                      </div>
                    )}
                    {formData.contact_referent?.telephone && (
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--gray-500)",
                            margin: "0 0 0.25rem 0",
                          }}
                        >
                          <i
                            className="fas fa-phone"
                            style={{ marginRight: "0.25rem" }}
                          ></i>
                          Téléphone
                        </p>
                        <p style={{ fontWeight: "500", margin: 0 }}>
                          {formData.contact_referent.telephone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Champs communs */}
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    borderBottom: "1px solid var(--gray-200)",
                    paddingBottom: "0.5rem",
                    marginBottom: "1rem",
                    color: "var(--gray-800)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="fas fa-layer-group"></i>
                  Champs communs ({formData.champs_communs.length})
                </h3>

                {formData.champs_communs.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(1, 1fr)",
                      gap: "1rem",
                      "@media (min-width: 768px)": {
                        gridTemplateColumns: "repeat(2, 1fr)",
                      },
                    }}
                  >
                    {formData.champs_communs.map((champ, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "0.75rem",
                          border: "1px solid var(--gray-200)",
                          borderRadius: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "500",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <i
                              className={getIconForFieldType(champ.type_champ)}
                              style={{ color: "var(--primary-color)" }}
                            ></i>
                            {champ.nom_champ}
                          </span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              backgroundColor: "var(--gray-100)",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "9999px",
                            }}
                          >
                            {champ.type_champ}
                          </span>
                        </div>
                        {champ.description && (
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--gray-600)",
                              margin: "0.5rem 0 0 0",
                            }}
                          >
                            {champ.description}
                          </p>
                        )}
                        {champ.obligatoire && (
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "0.5rem",
                              fontSize: "0.75rem",
                              backgroundColor: "var(--danger-light)",
                              color: "var(--danger-color)",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "9999px",
                            }}
                          >
                            <i
                              className="fas fa-exclamation-circle"
                              style={{ marginRight: "0.25rem" }}
                            ></i>
                            Obligatoire
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontStyle: "italic", color: "var(--gray-500)" }}>
                    <i
                      className="fas fa-info-circle"
                      style={{ marginRight: "0.5rem" }}
                    ></i>
                    Aucun champ commun défini
                  </p>
                )}
              </div>

              {/* Cibles */}
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    borderBottom: "1px solid var(--gray-200)",
                    paddingBottom: "0.5rem",
                    marginBottom: "1rem",
                    color: "var(--gray-800)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="fas fa-bullseye"></i>
                  Cibles ({formData.cibles.length})
                </h3>

                {formData.cibles.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    {formData.cibles.map((cible, index) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid var(--gray-200)",
                          borderRadius: "0.5rem",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "var(--gray-50)",
                            padding: "1rem",
                            borderBottom: "1px solid var(--gray-200)",
                          }}
                        >
                          <h4
                            style={{
                              fontWeight: "600",
                              margin: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <i
                              className="fas fa-users"
                              style={{ color: "var(--primary-color)" }}
                            ></i>
                            {cible.nom_cible}
                          </h4>
                          {cible.description && (
                            <p
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--gray-600)",
                                margin: "0.5rem 0 0 0",
                              }}
                            >
                              {cible.description}
                            </p>
                          )}
                        </div>

                        <div style={{ padding: "1rem" }}>
                          <h5
                            style={{
                              fontWeight: "500",
                              marginBottom: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <i className="fas fa-tasks"></i>
                            Statuts ({cible.statuts.length})
                          </h5>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "1rem",
                            }}
                          >
                            {cible.statuts.map((statut, statIndex) => (
                              <div
                                key={statIndex}
                                style={{
                                  border: "1px solid var(--gray-200)",
                                  borderRadius: "0.5rem",
                                  padding: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "500",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    <i
                                      className="fas fa-flag"
                                      style={{ color: "var(--primary-color)" }}
                                    ></i>
                                    {statut.nom_statut}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      backgroundColor: "var(--gray-100)",
                                      padding: "0.125rem 0.5rem",
                                      borderRadius: "9999px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                    }}
                                  >
                                    <i className="fas fa-puzzle-piece"></i>
                                    {statut.champs.length} champ(s)
                                  </span>
                                </div>

                                {statut.description && (
                                  <p
                                    style={{
                                      fontSize: "0.875rem",
                                      color: "var(--gray-600)",
                                      margin: "0.5rem 0 0 0",
                                    }}
                                  >
                                    {statut.description}
                                  </p>
                                )}

                                {statut.champs.length > 0 && (
                                  <div style={{ marginTop: "0.75rem" }}>
                                    <h6
                                      style={{
                                        fontSize: "0.75rem",
                                        fontWeight: "500",
                                        color: "var(--gray-500)",
                                        marginBottom: "0.5rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.25rem",
                                      }}
                                    >
                                      <i className="fas fa-th-list"></i>
                                      Champs:
                                    </h6>
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(1, 1fr)",
                                        gap: "0.5rem",
                                        "@media (min-width: 640px)": {
                                          gridTemplateColumns: "repeat(2, 1fr)",
                                        },
                                      }}
                                    >
                                      {statut.champs.map(
                                        (champ, champIndex) => (
                                          <div
                                            key={champIndex}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              backgroundColor: "var(--gray-50)",
                                              padding: "0.5rem",
                                              borderRadius: "0.25rem",
                                              fontSize: "0.75rem",
                                            }}
                                          >
                                            <span
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.25rem",
                                              }}
                                            >
                                              <i
                                                className={getIconForFieldType(
                                                  champ.type_champ
                                                )}
                                                style={{
                                                  color: "var(--primary-color)",
                                                }}
                                              ></i>
                                              {champ.nom_champ}
                                            </span>
                                            <span
                                              style={{
                                                color: "var(--gray-500)",
                                              }}
                                            >
                                              {champ.type_champ}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontStyle: "italic", color: "var(--gray-500)" }}>
                    <i
                      className="fas fa-info-circle"
                      style={{ marginRight: "0.5rem" }}
                    ></i>
                    Aucune cible définie
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="experimentationForm-container">
      {/* Breadcrumb */}
      <div className="page-header">
        <div className="breadcrumbs-wrapper">
          <Breadcrumbs items={getBreadcrumbItems()} />
        </div>
      </div>

      {/* Stepper */}
      {renderStepper()}

      {/* Notifications */}
      <Notification
        type="error"
        message={errorMessage || ""}
        isVisible={errorVisible}
        onClose={() => setErrorVisible(false)}
        position="fixed"
        className={animateError ? "shake" : ""}
      />

      <Notification
        type="success"
        message={successMessage || ""}
        isVisible={successVisible}
        onClose={() => setSuccessVisible(false)}
        position="fixed"
        autoClose={true}
        duration={5000}
      />

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {renderStepWithAnimation()}

        {/* Navigation entre les étapes */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePrevStep}
            disabled={activeStep === 0 || isSubmitting}
          >
            <i className="fas fa-chevron-left"></i>
            Précédent
          </button>

          {activeStep < steps.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextStep}
              disabled={isSubmitting}
            >
              Suivant
              <i className="fas fa-chevron-right"></i>
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-success"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Traitement...
                </>
              ) : (
                <>
                  <i
                    className={`fas ${isEditing ? "fa-save" : "fa-check"}`}
                  ></i>
                  {isEditing ? "Mettre à jour" : "Créer l'expérimentation"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ExperimentationForm;
