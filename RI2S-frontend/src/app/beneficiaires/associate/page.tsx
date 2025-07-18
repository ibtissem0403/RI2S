"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { experimentationService } from "@/services/experimentationServices";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import "./associate.css";
import Stepper from "./components/Stepper";

// Types pour les modèles
interface Beneficiaire {
  _id: string;
  fullName: string;
  firstName: string;
  dossierNumber?: string;
}

// Interface pour les bénéficiaires pseudonymisés - CORRIGÉE
interface PseudonymizedBeneficiary {
  _id?: string;
  pseudoId?: string;
  fullName?: string;
  firstName?: string;
  pseudo?: {
    pseudoId: string;
    pseudoName: string;
    dossierNumber: string;
    inclusionDate: string;
    status: "Actif" | "Sorti" | "Suspendu";
  };
}

interface Champ {
  _id: string;
  nom_champ: string;
  description?: string;
  type_champ: string; // text, number, date, select, etc.
  options?: string[]; // Pour les champs de type select
  obligatoire: boolean;
}

interface Statut {
  _id: string;
  nom_statut: string;
  champs: Champ[];
}

interface Cible {
  _id: string;
  nom_cible: string;
  statuts: Statut[];
}

interface ExperimentationData {
  champsCommuns: Champ[];
  experimentation: {
    _id: string;
    name: string;
  };
  cibles: Cible[];
}

// Classe d'aide pour l'authentification
class AuthHelper {
  static getToken(): string | null {
    // Chercher le token dans différents emplacements possibles
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      document.cookie.replace(
        /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
        "$1"
      )
    );
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return { "Content-Type": "application/json" };

    // S'assurer que le token a le préfixe "Bearer" s'il n'est pas déjà présent
    const authToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    return {
      Authorization: authToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  static async refreshToken(): Promise<string | null> {
    try {
      // Exemple de code pour rafraîchir le token - à adapter selon votre système
      // const response = await axios.post('/api/auth/refresh', {}, {
      //   withCredentials: true
      // });
      // const newToken = response.data.token;
      // localStorage.setItem('token', newToken);
      // return newToken;

      // Pour l'instant, on simule juste un rafraîchissement
      console.log("Tentative de rafraîchissement du token...");
      return this.getToken();
    } catch (error) {
      console.error("Échec du rafraîchissement du token:", error);
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      // Pour un token JWT
      const base64Url = token.split(" ")[1] || token;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64.split(".")[1])
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const { exp } = JSON.parse(jsonPayload);
      const expired = Date.now() >= exp * 1000;

      if (expired) {
        console.warn("Token expiré:", new Date(exp * 1000).toLocaleString());
      }

      return expired;
    } catch (e) {
      console.warn("Impossible de vérifier l'expiration du token:", e);
      return false; // En cas de doute, supposons que le token est valide
    }
  }
}

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

const AssociatePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const experimentationId = searchParams?.get("experimentationId");
  const [usagers, setUsagers] = useState<UsagerRI2S[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<string | null>(null);
  const [experimentation, setExperimentation] =
    useState<ExperimentationData | null>(null);
  const [pseudonymizedBeneficiaries, setPseudonymizedBeneficiaries] = useState<
    PseudonymizedBeneficiary[]
  >([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("");
  const [selectedCible, setSelectedCible] = useState<string>("");
  // Nouveau: Array de statuts sélectionnés au lieu d'un seul statut
  const [selectedStatuts, setSelectedStatuts] = useState<string[]>([]);
  // Pour conserver l'état actif/principal pour la soumission finale
  const [activeStatut, setActiveStatut] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État pour les valeurs des champs dynamiques - modifié pour stocker par statut
  const [champValues, setChampValues] = useState<Record<string, Record<string, any>>>({});
  const [champCommunValues, setChampCommunValues] = useState<
    Record<string, any>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      // Analyse du token
      const analyzeToken = () => {
        const token = AuthHelper.getToken();
        if (!token) {
          setTokenInfo("Aucun token trouvé. Veuillez vous connecter.");
          return false;
        }

        // Afficher une partie du token pour débogage
        const tokenPart = token.substring(0, 20) + "...";
        setTokenInfo(`Token trouvé: ${tokenPart}`);

        // Vérifier si le token est expiré
        if (AuthHelper.isTokenExpired(token)) {
          setTokenInfo(`Token expiré. Veuillez vous reconnecter.`);
          return false;
        }
        
        return true;
      };

      if (!analyzeToken()) {
        return;
      }

      // Récupérer les usagers
      try {
        setIsLoading(true);
        const token = AuthHelper.getToken();
        if (!token) throw new Error("Authentification requise");
        
        const headers = { Authorization: `Bearer ${token}` };
        console.log("Récupération des usagers...");
        
        const response = await axios.get(
          "http://localhost:5000/api/usagers-ri2s",
          { headers }
        );
        
        console.log("Données des usagers reçues:", response.data);
        console.log("Nombre d'usagers reçus:", response.data.length);
        
        // Analyser la structure des données pour le débogage
        if (response.data && response.data.length > 0) {
          console.log("Structure du premier usager:", JSON.stringify(response.data[0], null, 2));
          
          // Vérifier les propriétés importantes
          const usagersAvecRole = response.data.filter((u: any) => u.role);
          console.log(`Nombre d'usagers avec propriété 'role':`, usagersAvecRole.length);
          
          if (usagersAvecRole.length > 0) {
            console.log("Exemple de rôle:", usagersAvecRole[0].role);
          }
        }
        
        setUsagers(response.data);
        setPseudonymizedBeneficiaries(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des usagers:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la récupération des usagers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Récupérer les détails de l'expérimentation
  useEffect(() => {
    const fetchExperimentationData = async () => {
      if (!experimentationId) return;

      try {
        setIsLoading(true);
        console.log("Récupération des données de l'expérimentation...");

        // Vérifier et rafraîchir le token si nécessaire
        const token = AuthHelper.getToken();
        if (!token) {
          setError(
            "Aucun token d'authentification trouvé. Veuillez vous connecter."
          );
          setIsLoading(false);
          return;
        }

        // Récupérer les données de l'expérimentation
        const expData = await experimentationService.getComplete(
          experimentationId
        );
        console.log("Données expérimentation reçues:", expData);
        setExperimentation(expData);
      } catch (err: any) {
        console.error("Erreur lors du chargement des données d'expérimentation:", err);
        setError(
          "Erreur lors du chargement des données d'expérimentation: " +
            (err.message || "Erreur inconnue")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperimentationData();
  }, [experimentationId]);

  // Obtenir les statuts pour une cible
  const getStatutsForCible = (cibleId: string): Statut[] => {
    if (!experimentation) return [];
    const cible = experimentation.cibles.find((c) => c._id === cibleId);
    return cible?.statuts || [];
  };

  // Fonction pour obtenir le nom d'une cible par ID
  const getCibleName = (cibleId: string): string => {
    if (!cibleId || !experimentation) return "";
    
    const cible = experimentation.cibles.find((c) => c._id === cibleId);
    console.log("getCibleName - ID:", cibleId, "Cible trouvée:", cible);
    
    if (!cible) {
      console.warn("Cible non trouvée pour l'ID:", cibleId);
      return "";
    }
    
    return cible.nom_cible || "";
  };

  // Obtenir les champs pour un statut
  const getChamps = (statutId: string): Champ[] => {
    if (!selectedCible || !experimentation) return [];

    const cible = experimentation.cibles.find((c) => c._id === selectedCible);
    if (!cible) return [];

    const statut = cible.statuts.find((s) => s._id === statutId);
    return statut?.champs || [];
  };

  const handleCibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCible(e.target.value);
    console.log("Cible sélectionnée:", e.target.value);
    
    // Réinitialiser les statuts
    setSelectedStatuts([]);
    setActiveStatut("");
    
    // Réinitialiser les valeurs des champs
    setChampValues({});
    setChampCommunValues({});
  };

  // Gérer le changement de statuts (case à cocher)
  const handleStatutToggle = (statutId: string) => {
    setSelectedStatuts(prev => {
      if (prev.includes(statutId)) {
        // Si déjà sélectionné, on le retire
        // Si c'était le statut actif, il faut en choisir un nouveau
        if (activeStatut === statutId) {
          const remaining = prev.filter(id => id !== statutId);
          if (remaining.length > 0) {
            setActiveStatut(remaining[0]);
          } else {
            setActiveStatut("");
          }
        }
        return prev.filter(id => id !== statutId);
      } else {
        // Sinon on l'ajoute
        // Si c'est le premier statut sélectionné, on le définit comme actif
        if (prev.length === 0) {
          setActiveStatut(statutId);
        }
        return [...prev, statutId];
      }
    });
  };

  // Définir un statut comme actif (principal pour la soumission)
  const handleSetActiveStatut = (statutId: string) => {
    if (selectedStatuts.includes(statutId)) {
      setActiveStatut(statutId);
    }
  };

  // Gérer le changement de valeur d'un champ - MÉMORISÉ pour éviter les re-rendus
  const handleChampChange = React.useCallback((statutId: string, champId: string, value: any) => {
    setChampValues(prev => ({
      ...prev,
      [statutId]: {
        ...(prev[statutId] || {}),
        [champId]: value
      }
    }));
  }, []);

  // Gérer le changement de valeur d'un champ commun - MÉMORISÉ pour éviter les re-rendus
  const handleChampCommunChange = React.useCallback((champId: string, value: any) => {
    setChampCommunValues(prev => ({
      ...prev,
      [champId]: value,
    }));
  }, []);

  // Rendu d'un champ dynamique - CORRIGÉ pour éviter la perte de focus
  const renderChamp = React.useCallback((statutId: string, champ: Champ) => {
    const value = champValues[statutId]?.[champ._id] || "";

    // Fonction handler mémorisée pour éviter les re-rendus
    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      handleChampChange(statutId, champ._id, e.target.value);
    }, [statutId, champ._id]);

    // Fonction handler spécifique pour les fichiers
    const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleChampChange(statutId, champ._id, files[0].name);
      }
    }, [statutId, champ._id]);

    // Générer une clé unique pour chaque champ pour éviter les re-rendus
    const inputKey = `${statutId}-${champ._id}`;

    switch (champ.type_champ) {
      case "texte":
        return (
          <input
            key={inputKey}
            type="text"
            className="exp-input"
            value={value}
            onChange={handleInputChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );

      case "nombre":
        return (
          <input
            key={inputKey}
            type="number"
            className="exp-input"
            value={value}
            onChange={handleInputChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );

      case "date":
        return (
          <input
            key={inputKey}
            type="date"
            className="exp-input"
            value={value}
            onChange={handleInputChange}
            required={champ.obligatoire}
          />
        );

      case "liste":
        return (
          <div key={inputKey} className="filter-select-wrapper">
            <select
              className="filter-select"
              value={value}
              onChange={handleInputChange}
              required={champ.obligatoire}
            >
              <option value="">
                Sélectionner une option
              </option>
              {champ.options?.map((option, index) => (
                <option key={`${inputKey}-option-${index}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="filter-select-icon">
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
        );

      case "fichier":
        return (
          <input
            key={inputKey}
            type="file"
            className="exp-input"
            onChange={handleFileChange}
            required={champ.obligatoire}
          />
        );

      default:
        return (
          <input
            key={inputKey}
            type="text"
            className="exp-input"
            value={value}
            onChange={handleInputChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );
    }
  }, [champValues, handleChampChange]);

  // Rendu d'un champ commun - CORRIGÉ pour éviter la perte de focus
  const renderChampCommun = React.useCallback((champ: Champ) => {
    const value = champCommunValues[champ._id] || "";

    // Fonction handler mémorisée pour éviter les re-rendus
    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      handleChampCommunChange(champ._id, e.target.value);
    }, [champ._id]);

    // Fonction handler spécifique pour les fichiers
    const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleChampCommunChange(champ._id, files[0].name);
      }
    }, [champ._id]);

    // Générer une clé unique pour chaque champ
    const inputKey = `commun-${champ._id}`;

    switch (champ.type_champ) {
      case "texte":
        return (
          <input
            key={inputKey}
            type="text"
            className="modern-input"
            value={value}
            onChange={handleInputChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );

      case "nombre":
        return (
          <input
            key={inputKey}
            type="number"
            className="modern-input"
            value={value}
            onChange={handleInputChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );

      case "date":
        return (
          <input
            key={inputKey}
            type="date"
            className="modern-input"
            value={value}
            onChange={handleInputChange}
            required={champ.obligatoire}
          />
        );

      case "liste":
        return (
          <div key={inputKey} className="filter-select-wrapper">
            <select
              className="filter-select"
              value={value}
              onChange={handleInputChange}
              required={champ.obligatoire}
            >
              <option value="">
                Sélectionner une option
              </option>
              {champ.options?.map((option, index) => (
                <option key={`${inputKey}-option-${index}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="filter-select-icon">
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
        );

      case "fichier":
        return (
          <input
            key={inputKey}
            type="file"
            className="modern-input"
            onChange={handleFileChange}
            required={champ.obligatoire}
          />
        );

      default:
        return (
          <input
            key={inputKey}
            type="text"
            className="modern-input"
            value={value}
            onChange={handleInputChange}
            required={champ.obligatoire}
            placeholder={champ.description || ""}
          />
        );
    }
  }, [champCommunValues, handleChampCommunChange]);

  // Breadcrumb
  const getBreadcrumbItems = () => {
    return [
      { label: "Accueil", href: "/index" },
      { label: "Expérimentations", href: "/index" },
      {
        label: experimentation?.experimentation?.name || "Expérimentation",
        href: `/experimentations/${experimentationId}`,
      },
      { label: "Associer un bénéficiaire", isCurrentPage: true },
    ];
  };

  // Soumettre le formulaire - CORRIGÉ
  const handleSubmit = async () => {
    console.log("Soumission du formulaire...");
    if (!selectedBeneficiary || !selectedCible || selectedStatuts.length === 0 || !activeStatut) {
      console.log("error", selectedBeneficiary, selectedCible, selectedStatuts, activeStatut);
      setError(
        "Veuillez sélectionner un bénéficiaire, une cible et au moins un statut, et définir un statut actif."
      );
      return;
    }

    // CORRECTION PRINCIPALE: Récupérer le pseudoId correct
    console.log("Vérification du bénéficiaire sélectionné:", selectedBeneficiary);
    console.log("Type de données:", typeof selectedBeneficiary);

    // Trouver le bénéficiaire complet
    const selectedBeneficiaryObj = pseudonymizedBeneficiaries.find((b: any) => {
      // Vérifier tous les identifiants possibles
      return (
        b.pseudoId === selectedBeneficiary || 
        (b.pseudo && b.pseudo.pseudoId === selectedBeneficiary) ||
        b._id === selectedBeneficiary
      );
    });

    console.log("Bénéficiaire trouvé:", selectedBeneficiaryObj);

    if (!selectedBeneficiaryObj) {
      setError("Bénéficiaire non trouvé dans la liste. Veuillez sélectionner un bénéficiaire valide.");
      return;
    }

    // Obtenir le pseudoId correct - CETTE PARTIE EST CRUCIALE
    const pseudoId = selectedBeneficiaryObj.pseudoId || 
                   (selectedBeneficiaryObj.pseudo && selectedBeneficiaryObj.pseudo.pseudoId);

    if (!pseudoId) {
      setError("Le bénéficiaire sélectionné n'a pas de pseudoId valide.");
      return;
    }

    console.log("PseudoId utilisé pour l'association:", pseudoId);

    try {
      setIsSubmitting(true);
      
      // Préparation des données des champs pour tous les statuts
      let allChampValues: Record<string, any> = {};
      
      // Fusionner tous les champs de tous les statuts sélectionnés
      selectedStatuts.forEach(statutId => {
        if (champValues[statutId]) {
          allChampValues = { ...allChampValues, ...champValues[statutId] };
        }
      });
      
      console.log("Soumission du formulaire avec les données:", {
        beneficiaireId: pseudoId, // Utiliser pseudoId au lieu de selectedBeneficiary
        experimentationId,
        cibleId: selectedCible,
        statutId: activeStatut, // Utiliser le statut actif comme statut principal
        statuts_secondaires: selectedStatuts.filter(id => id !== activeStatut), // Les autres statuts
        valeurs_champs: allChampValues,
        valeurs_champs_communs: champCommunValues,
      });

      // Vérifier et rafraîchir le token si nécessaire
      const token = AuthHelper.getToken();
      if (!token) {
        setError(
          "Aucun token d'authentification trouvé. Veuillez vous connecter."
        );
        setIsSubmitting(false);
        return;
      }

      // Si le token est expiré, tenter de le rafraîchir
      if (AuthHelper.isTokenExpired(token)) {
        const newToken = await AuthHelper.refreshToken();
        if (!newToken) {
          setError("Votre session a expiré. Veuillez vous reconnecter.");
          setIsSubmitting(false);
          return;
        }
      }

      // Obtenir les en-têtes d'authentification
      const headers = AuthHelper.getAuthHeaders();
      console.log("En-têtes utilisés pour l'association:", headers);
      
      // CORRECTION: Utiliser directement axios pour l'association avec le pseudoId
      const response = await axios.post(
        `http://localhost:5000/api/beneficiaries/pseudo/${pseudoId}/associate`,
        {
          experimentationId: experimentationId!,
          cibleId: selectedCible,
          statutId: activeStatut, // Statut principal
          valeurs_champs: allChampValues,
          valeurs_champs_communs: champCommunValues,
          statuts_secondaires: selectedStatuts.filter(id => id !== activeStatut), // Statuts secondaires
        },
        {
          headers,
          withCredentials: true,
        }
      );

      console.log("Réponse de l'association:", response.data);

      // Rediriger vers la page des bénéficiaires de l'expérimentation
      router.push(`/experimentations/${experimentationId}`);
    } catch (err: any) {
      console.error("Erreur lors de l'association:", err);

      // Message d'erreur détaillé
      let errorMessage = "Erreur lors de l'association: ";

      if (err.response) {
        const data = err.response.data;
        console.error("Réponse d'erreur:", {
          status: err.response.status,
          statusText: err.response.statusText,
          data: data,
        });

        if (err.response.status === 401) {
          errorMessage =
            "Votre session a expiré ou vous n'avez pas les droits nécessaires. Veuillez vous reconnecter.";
        } else if (err.response.status === 404) {
          errorMessage =
            "Bénéficiaire introuvable. Veuillez vérifier votre sélection. (Code 404)";
        } else {
          errorMessage += data?.message || `Erreur ${err.response.status}`;
        }
      } else if (err.request) {
        // La requête a été faite mais pas de réponse reçue
        console.error("Aucune réponse reçue:", err.request);
        errorMessage += "Aucune réponse du serveur";
      } else {
        // Quelque chose s'est passé lors de la configuration de la requête
        errorMessage += err.message || "Erreur inconnue";
      }

      setError(errorMessage);
      setIsSubmitting(false);
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

  if (!experimentationId || !experimentation) {
    return (
      <div className="exp-alert exp-alert-error">
        <div className="exp-alert-icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <div>
          <div className="exp-alert-title">Erreur</div>
          <div>Expérimentation introuvable ou paramètre manquant.</div>
        </div>
      </div>
    );
  }

  // Composant pour l'étape 0 - Sélection de la cible
  const Steps0 = () => {
    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fas fa-bullseye"
              style={{ color: "#2A7D4F", marginRight: "10px" }}
            ></i>
            Sélection de la cible
          </div>
        </div>
        <div className="exp-card-content">
          <form className="associate-form">
            <div className="exp-field-group">
              <div className="exp-field-label">
                <i
                  className="fas fa-bullseye"
                  style={{ color: "#2A7D4F", marginRight: "10px" }}
                ></i>
                Cible
              </div>
              <div className="filter-select-wrapper">
                <select
                  className="filter-select"
                  value={selectedCible}
                  onChange={handleCibleChange}
                  required
                >
                  <option key="default-cible" value="">
                    Sélectionner une cible
                  </option>
                  {experimentation.cibles.map((cible) => (
                    <option key={`cible-${cible._id}`} value={cible._id}>
                      {cible.nom_cible}
                    </option>
                  ))}
                </select>
                <div className="filter-select-icon">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </form>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "end",
              marginTop: "100px",
            }}
          >
            <button
              className="exp-btn exp-btn-primary"
              disabled={!selectedCible}
              style={
                selectedCible
                  ? {
                      backgroundColor: "#2A7D4F",
                      color: "white",
                      borderColor: "#2A7D4F",
                    }
                  : {
                      backgroundColor: "grey",
                      color: "white",
                      borderColor: "grey",
                    }
              }
              onClick={() => setCurrentStep(1)}
            >
              <span>Suivant</span>
              <i className="fas fa-angle-right" style={{ marginLeft: "8px" }}></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Composant pour l'étape 1 - Sélection du bénéficiaire - CORRIGÉ
  const Steps1 = () => {
    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fas fa-users"
              style={{ color: "#2A7D4F", marginRight: "10px" }}
            ></i>
            Sélection du bénéficiaire
          </div>
        </div>
        <div className="exp-card-content">
          <form className="associate-form">
            <div className="exp-field-group">
              <div className="exp-field-label">
                <i
                  className="fas fa-user"
                  style={{ color: "#2A7D4F", marginRight: "10px" }}
                ></i>
                Bénéficiaire
              </div>
              <div className="filter-select-wrapper">
                <select
                  className="filter-select"
                  value={selectedBeneficiary}
                  onChange={(e) => setSelectedBeneficiary(e.target.value)}
                  required
                >
                  <option key="default-beneficiary" value="">
                    Sélectionner un bénéficiaire
                  </option>
                  {/* CORRECTION PRINCIPALE: Filtrage et valeur d'option corrigés */}
                  {(() => {
                    console.log("Filtrage des bénéficiaires pour la cible:", getCibleName(selectedCible));
                    console.log("Nombre total de bénéficiaires à filtrer:", pseudonymizedBeneficiaries.length);
                    
                    // Vérifier la structure des données
                    if (pseudonymizedBeneficiaries.length > 0) {
                      console.log("Premier bénéficiaire:", pseudonymizedBeneficiaries[0]);
                    }
                    
                    // Filtrage plus permissif
                    const filteredBeneficiaries = pseudonymizedBeneficiaries.filter((b: any) => {
                      // Si pas de cible sélectionnée, montrer tous les bénéficiaires
                      if (!selectedCible) return true;
                      
                      // Pour le débogage
                      console.log("Vérification du bénéficiaire:", b.fullName || b.pseudo?.pseudoName || "Inconnu");
                      
                      // Essayer différentes propriétés qui pourraient contenir l'information de rôle/cible
                      const cibleName = getCibleName(selectedCible).toLowerCase();
                      
                      // Vérifier dans la propriété role
                      if (b.role && typeof b.role === 'string') {
                        if (b.role.toLowerCase().includes(cibleName)) {
                          console.log("Correspondance trouvée dans role:", b.role);
                          return true;
                        }
                      }
                      
                      // Vérifier dans la propriété type_usager
                      if (b.type_usager) {
                        // Mapping type_usager vers les cibles potentielles
                        const typeMapping: Record<string, string[]> = {
                          'pro': ['professionnel', 'professional'],
                          'non_pro': ['senior', 'aidant', 'caregiver']
                        };
                        
                        const possibleTypes = typeMapping[b.type_usager] || [];
                        if (possibleTypes.some(type => type.includes(cibleName) || cibleName.includes(type))) {
                          console.log("Correspondance trouvée dans type_usager:", b.type_usager);
                          return true;
                        }
                      }
                      
                      // Vérifier dans les expérimentations existantes
                      if (b.experimentations && Array.isArray(b.experimentations)) {
                        for (const exp of b.experimentations) {
                          if (exp.cible && exp.cible.toLowerCase().includes(cibleName)) {
                            console.log("Correspondance trouvée dans experimentations.cible:", exp.cible);
                            return true;
                          }
                        }
                      }
                      
                      // Dernier recours : chercher dans toutes les propriétés de type string
                      for (const [key, value] of Object.entries(b)) {
                        if (typeof value === 'string' && value.toLowerCase().includes(cibleName)) {
                          console.log(`Correspondance trouvée dans propriété ${key}:`, value);
                          return true;
                        }
                      }
                      
                      // En mode développement, accepter tous les bénéficiaires si aucun ne correspond
                      // Commenter cette ligne en production
                      // return true;
                      
                      return false;
                    });
                    
                    console.log("Nombre de bénéficiaires après filtrage:", filteredBeneficiaries.length);
                    
                    if (filteredBeneficiaries.length === 0) {
                      return (
                        <option disabled value="">
                          Aucun bénéficiaire correspondant à cette cible
                        </option>
                      );
                    }
                    
                    return filteredBeneficiaries.map((b: any, index) => {
                      // CORRECTION: S'assurer d'utiliser le pseudoId pour la valeur de l'option
                      const pseudoId = b.pseudoId || (b.pseudo && b.pseudo.pseudoId);
                      const displayName = pseudoId || b.fullName || `Bénéficiaire ${index + 1}`;
                      
                      // Si le bénéficiaire n'a pas de pseudoId, le désactiver
                      if (!pseudoId) {
                        return (
                          <option 
                            key={`ben-no-pseudo-${index}`} 
                            value=""
                            disabled
                          >
                            {displayName} (Pas de pseudoId)
                          </option>
                        );
                      }
                      
                      return (
                        <option 
                          key={pseudoId || `ben-index-${index}`} 
                          value={pseudoId}
                        >
                          {displayName}
                        </option>
                      );
                    });
                  })()}
                </select>
                <div className="filter-select-icon">
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
              
              {/* Mode développement : bouton de débogage */}
              <button 
                className="exp-btn exp-btn-outline" 
                style={{ marginTop: '10px', fontSize: '0.8rem' }}
                onClick={(e) => {
                  e.preventDefault();
                  console.log("=== INFORMATIONS DE DÉBOGAGE ===");
                  console.log("Nombre total d'usagers:", usagers.length);
                  console.log("Nombre total de bénéficiaires pseudonymisés:", pseudonymizedBeneficiaries.length);
                  console.log("Cible sélectionnée:", selectedCible);
                  console.log("Nom de la cible:", getCibleName(selectedCible));
                  console.log("Bénéficiaire sélectionné:", selectedBeneficiary);
                  
                  // Trouver le bénéficiaire complet
                  const selectedBeneficiaryObj = pseudonymizedBeneficiaries.find((b: any) => {
                    // Vérifier tous les identifiants possibles
                    return (
                      b.pseudoId === selectedBeneficiary || 
                      (b.pseudo && b.pseudo.pseudoId === selectedBeneficiary) ||
                      b._id === selectedBeneficiary
                    );
                  });
                  
                  console.log("Détails du bénéficiaire sélectionné:", selectedBeneficiaryObj);
                  console.log("Liste complète des usagers:", usagers);
                  console.log("=== FIN DES INFORMATIONS DE DÉBOGAGE ===");
                  
                  // Afficher une alerte avec des informations de base
                  alert(`Informations de débogage affichées dans la console:\n
                  - Nombre d'usagers: ${usagers.length}
                  - Cible sélectionnée: ${getCibleName(selectedCible)}
                  - Bénéficiaire sélectionné: ${selectedBeneficiary}
                  Vérifiez la console pour plus de détails.`);
                }}
              >
                <i className="fas fa-bug"></i> Informations de débogage
              </button>
            </div>
          </form>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              marginTop: "100px",
            }}
          >
            <button
              className="exp-btn exp-btn-outline"
              onClick={() => setCurrentStep(0)}
            >
              <i className="fas fa-angle-left" style={{ marginRight: "8px" }}></i>
              <span>Précédent</span>
            </button>
            <button
              className="exp-btn exp-btn-primary"
              disabled={!selectedBeneficiary}
              style={
                selectedBeneficiary
                  ? {
                      backgroundColor: "#2A7D4F",
                      color: "white",
                      borderColor: "#2A7D4F",
                    }
                  : {
                      backgroundColor: "grey",
                      color: "white",
                      borderColor: "grey",
                    }
              }
              onClick={() => setCurrentStep(2)}
            >
              <span>Suivant</span>
              <i className="fas fa-angle-right" style={{ marginLeft: "8px" }}></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Composant pour l'étape 2 - Champs communs
  const Steps2 = () => {
    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fas fa-layer-group"
              style={{ color: "#2A7D4F", marginRight: "10px" }}
            ></i>
            Champs communs
          </div>
        </div>
        <div className="exp-card-content">
          <form className="associate-form">
            {experimentation.champsCommuns.length > 0 ? (
              experimentation.champsCommuns.map((champ) => (
                <div className="exp-field-group" key={champ._id}>
                  <div className="exp-field-label">
                    {champ.nom_champ}
                    {champ.obligatoire && <span className="exp-required">*</span>}
                  </div>
                  <div className="exp-field-input">
                    {renderChampCommun(champ)}
                  </div>
                  {champ.description && (
                    <div className="exp-field-help">{champ.description}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="exp-info-message">
                <i className="fas fa-info-circle"></i>
                Aucun champ commun défini pour cette expérimentation.
              </div>
            )}
          </form>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              marginTop: "100px",
            }}
          >
            <button
              className="exp-btn exp-btn-outline"
              onClick={() => setCurrentStep(1)}
            >
              <i className="fas fa-angle-left" style={{ marginRight: "8px" }}></i>
              <span>Précédent</span>
            </button>
            <button
              className="exp-btn exp-btn-primary"
              onClick={() => setCurrentStep(3)}
            >
              <span>Suivant</span>
              <i className="fas fa-angle-right" style={{ marginLeft: "8px" }}></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Composant pour l'étape 3 - Statuts et champs spécifiques
  const Steps3 = () => {
    const statutsForCible = getStatutsForCible(selectedCible);

    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fas fa-flag"
              style={{ color: "#2A7D4F", marginRight: "10px" }}
            ></i>
            Statuts et champs spécifiques
          </div>
        </div>
        <div className="exp-card-content">
          <form className="associate-form">
            {/* Explication pour l'utilisateur */}
            <div className="exp-info-message" style={{ marginBottom: "20px" }}>
              <i className="fas fa-info-circle"></i>
              <div>
                <p><strong>Sélectionnez un ou plusieurs statuts</strong> en cochant les cases correspondantes.</p>
                <p>Vous pouvez remplir les champs pour chaque statut sélectionné. Choisissez également un statut principal.</p>
              </div>
            </div>

            {/* Liste des statuts avec cases à cocher */}
            <div className="statut-selection">
              {statutsForCible.length > 0 ? (
                statutsForCible.map((statut) => (
                  <div key={statut._id} className="statut-accordion">
                    <div className="statut-header">
                      <div className="statut-checkbox-container">
                        <input
                          type="checkbox"
                          id={`statut-${statut._id}`}
                          checked={selectedStatuts.includes(statut._id)}
                          onChange={() => handleStatutToggle(statut._id)}
                          className="statut-checkbox"
                        />
                        <label 
                          htmlFor={`statut-${statut._id}`}
                          className="statut-label"
                        >
                          {statut.nom_statut}
                        </label>
                      </div>
                      
                      {selectedStatuts.includes(statut._id) && (
                        <div className="statut-actions">
                          <div className="statut-radio-container">
                            <input
                              type="radio"
                              id={`active-${statut._id}`}
                              name="activeStatut"
                              checked={activeStatut === statut._id}
                              onChange={() => handleSetActiveStatut(statut._id)}
                              className="statut-radio"
                            />
                            <label 
                              htmlFor={`active-${statut._id}`}
                              className="statut-radio-label"
                            >
                              Statut principal
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Champs pour ce statut - visibles uniquement si statut sélectionné */}
                    {selectedStatuts.includes(statut._id) && (
                      <div className="statut-fields">
                        <div className="statut-fields-title">
                          <i className="fas fa-list-alt" style={{ color: "#2A7D4F" }}></i>
                          Champs pour {statut.nom_statut}
                        </div>
                        
                        {statut.champs && statut.champs.length > 0 ? (
                          statut.champs.map((champ) => (
                            <div className="exp-field-group" key={champ._id}>
                              <div className="exp-field-label">
                                {champ.nom_champ}
                                {champ.obligatoire && <span className="exp-required">*</span>}
                              </div>
                              <div className="exp-field-input">
                                {renderChamp(statut._id, champ)}
                              </div>
                              {champ.description && (
                                <div className="exp-field-help">{champ.description}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="exp-info-message">
                            <i className="fas fa-info-circle"></i>
                            Aucun champ défini pour ce statut.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="exp-alert exp-alert-info">
                  <i className="fas fa-info-circle"></i>
                  <div>Aucun statut n'est défini pour cette cible.</div>
                </div>
              )}
            </div>
          </form>
          
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              marginTop: "30px",
            }}
          >
            <button
              className="exp-btn exp-btn-outline"
              onClick={() => setCurrentStep(2)}
            >
              <i className="fas fa-angle-left" style={{ marginRight: "8px" }}></i>
              <span>Précédent</span>
            </button>
            <button
              className="exp-btn exp-btn-primary"
              disabled={selectedStatuts.length === 0 || !activeStatut}
              style={
                selectedStatuts.length > 0 && activeStatut
                  ? {
                      backgroundColor: "#2A7D4F",
                      color: "white",
                      borderColor: "#2A7D4F",
                    }
                  : {
                      backgroundColor: "grey",
                      color: "white",
                      borderColor: "grey",
                    }
              }
              onClick={() => setCurrentStep(4)}
            >
              <span>Suivant</span>
              <i className="fas fa-angle-right" style={{ marginLeft: "8px" }}></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Composant pour l'étape 4 - Validation
  const Steps4 = () => {
    // Fonction pour obtenir le nom d'un statut par ID
    const getStatutName = (statutId: string): string => {
      const cible = experimentation?.cibles.find((c) => c._id === selectedCible);
      if (!cible) return "Statut inconnu";
      
      const statut = cible.statuts.find((s) => s._id === statutId);
      return statut ? statut.nom_statut : "Statut inconnu";
    };

    // Trouver le bénéficiaire sélectionné pour afficher des informations détaillées
    const selectedBeneficiaryObj = pseudonymizedBeneficiaries.find((b: any) => {
      return (
        b.pseudoId === selectedBeneficiary || 
        (b.pseudo && b.pseudo.pseudoId === selectedBeneficiary) ||
        b._id === selectedBeneficiary
      );
    });

    // Obtenir le nom d'affichage du bénéficiaire
    const beneficiaryDisplayName = selectedBeneficiaryObj 
      ? (selectedBeneficiaryObj.pseudoId || 
         (selectedBeneficiaryObj.pseudo && selectedBeneficiaryObj.pseudo.pseudoId) || 
         selectedBeneficiaryObj.fullName || 
         "Bénéficiaire sélectionné")
      : selectedBeneficiary;

    return (
      <div className="exp-card">
        <div className="exp-card-header">
          <div className="exp-card-title" style={{ color: "#2A7D4F" }}>
            <i
              className="fas fa-check-circle"
              style={{ color: "#2A7D4F", marginRight: "10px" }}
            ></i>
            Validation
          </div>
        </div>

        <div className="exp-card-content">
          <form className="associate-form">
            <div className="exp-field-group">
              <div
                className="exp-field-label"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <i
                  className="fas fa-check-circle"
                  style={{ color: "#2A7D4F" }}
                ></i>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#2A7D4F",
                  }}
                >
                  Confirmer l'association
                </span>
              </div>

              <div
                style={{
                  fontSize: "18px",
                  lineHeight: "1.8",
                  marginTop: "20px",
                  color: "#374151",
                }}
              >
                <p>
                  <strong>Cible :</strong>{" "}
                  {getCibleName(selectedCible) || "N/A"}
                </p>
                <p>
                  <strong>Bénéficiaire :</strong>{" "}
                  {beneficiaryDisplayName || "N/A"}
                </p>
                
                {/* Statuts sélectionnés */}
                <div style={{ marginTop: "20px", marginBottom: "15px" }}>
                  <p>
                    <strong>Statuts sélectionnés :</strong>
                  </p>
                  <ul style={{ listStyleType: "none", paddingLeft: "20px" }}>
                    {selectedStatuts.map(statutId => (
                      <li key={statutId} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <i className="fas fa-check-circle" style={{ color: "#2A7D4F", marginRight: "10px" }}></i>
                          <span style={{ fontWeight: activeStatut === statutId ? "bold" : "normal" }}>
                            {getStatutName(statutId)}
                            {activeStatut === statutId && 
                              <span style={{ 
                                backgroundColor: "#e6f0eb", 
                                color: "#2A7D4F",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "14px",
                                marginLeft: "10px"
                              }}>
                                Statut principal
                              </span>
                            }
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Résumé des champs communs */}
                {Object.keys(champCommunValues).length > 0 && (
                  <>
                    <p>
                      <strong>Champs communs :</strong>
                    </p>
                    <div style={{ paddingLeft: "20px" }}>
                      {Object.entries(champCommunValues).map(([champId, value]) => {
                        const champ = experimentation?.champsCommuns.find(
                          (c) => c._id === champId
                        );
                        return (
                          <p key={champId} style={{ marginBottom: "8px" }}>
                            <strong>{champ?.nom_champ ?? champId} :</strong>{" "}
                            {value || "N/A"}
                          </p>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Résumé des champs spécifiques par statut */}
                {selectedStatuts.map(statutId => {
                  const statutChamps = champValues[statutId] || {};
                  const statutName = getStatutName(statutId);
                  
                  if (Object.keys(statutChamps).length === 0) {
                    return null;
                  }
                  
                  return (
                    <div key={statutId} style={{ marginTop: "15px" }}>
                      <p>
                        <strong>Champs pour {statutName} :</strong>
                      </p>
                      <div style={{ paddingLeft: "20px" }}>
                        {Object.entries(statutChamps).map(([champId, value]) => {
                          const champ = getChamps(statutId).find(
                            (c) => c._id === champId
                          );
                          return (
                            <p key={champId} style={{ marginBottom: "8px" }}>
                              <strong>{champ?.nom_champ ?? champId} :</strong>{" "}
                              {value || "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "60px",
            }}
          >
            <button
              className="exp-btn exp-btn-outline"
              onClick={() => setCurrentStep(3)}
            >
              <i className="fas fa-angle-left" style={{ marginRight: "8px" }}></i>
              <span>Précédent</span>
            </button>
            
            <button
              className="exp-btn exp-btn-primary"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? "grey" : "#2A7D4F",
                color: "white",
                borderColor: isSubmitting ? "grey" : "#2A7D4F",
                padding: "10px 20px",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "6px",
              }}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="exp-container">
      {/* Breadcrumb */}
      <div className="breadcrumbs-container">
        <Breadcrumbs items={getBreadcrumbItems()} />
      </div>

      <h1 className="exp-title">
        <i
          className="fas fa-link"
          style={{ color: "#2A7D4F", marginRight: "10px" }}
        ></i>
        Associer un bénéficiaire à {experimentation?.experimentation.name}
      </h1>

      {/* Afficher un message d'erreur s'il y en a un */}
      {error && (
        <div className="exp-alert exp-alert-error">
          <div className="exp-alert-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div>
            <div className="exp-alert-title">Erreur</div>
            <div>{error}</div>
          </div>
          <button 
            className="exp-alert-close"
            onClick={() => setError(null)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Stepper */}
      <Stepper currentStep={currentStep} />
      
      {/* Afficher l'étape actuelle */}
      {currentStep === 0 && <Steps0 />}
      {currentStep === 1 && <Steps1 />}
      {currentStep === 2 && <Steps2 />}
      {currentStep === 3 && <Steps3 />}
      {currentStep === 4 && <Steps4 />}
    </div>
  );
};

export default AssociatePage;